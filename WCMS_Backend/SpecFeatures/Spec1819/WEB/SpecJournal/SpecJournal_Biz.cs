using Microsoft.Extensions.Caching.Memory;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1819._Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Security.IdentityAccess.Authorization;

namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournal;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.Spec.SpecJournal)]
public class SpecJournal_Biz(BizDeps bizDeps, IHttpClientFactory HttpClientFactory, IMemoryCache Cache) : BizService<SpecJournal>(bizDeps)
{
    #region Property
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(24);
    #endregion

    #region Public
    /// <summary>
    /// 依 ORCID iD 取得作者資料（公開可取得的範圍）
    /// </summary>
    public async Task<ORCIDData> GetOrcIdAuthorAsync(string orcid, CancellationToken ct = default)
    {
        string input = (orcid ?? string.Empty).Trim();
        // ✅ 1) 檢查 ORCID 是否符合「完整格式 + checksum」
        if (!TryValidateOrcid(input, out string validOrcid))
        {
            Message.AddMessage(MessageStatus.Warning, SpecMessageCode.SpecBECode0001, input);
            return new ORCIDData { ORCID = input };
        }
        // ✅ 2) 走 cache（只 cache 合法 ORCID）
        string cacheKey = $"{OrcidConsts.CacheKeyPrefix}{validOrcid}";
        if (Cache.TryGetValue(cacheKey, out ORCIDData? cached) && cached != null) return cached;
        // ✅ 3) 呼叫 ORCID API：若 404 / 空內容，提示「不存在」
        var api = await FetchOrcidRecordJsonAsync(validOrcid, ct);
        if (!api.IsFound || string.IsNullOrWhiteSpace(api.Json))
        {
            Message.AddMessage(MessageStatus.Warning, SpecMessageCode.SpecBECode0002, validOrcid);
            return new ORCIDData { ORCID = validOrcid };
        }
        // ✅ 4) 正常解析 + cache
        ORCIDData dto = ParseOrcidRecord(api.Json!, validOrcid);
        Cache.Set(cacheKey, dto, CacheTtl);
        return dto;
    }
    /// <summary>
    /// 更新出刊狀態 (預刊本 <-> 期刊本)
    /// 規則:如果沒有設定期刊目次代號/卷期代號，則為預刊本；反之為期刊本。
    /// 出刊即設定期刊目次代號/卷期代號；退回預刊本即清 null期刊目次代號 /卷期代號。
    /// </summary>
    /// <param name="internalId">資料 InternalId</param>
    /// <param name="JournalIndexId">期刊目次代號</param>
    /// <param name="JournalIndexRowId">卷期代號</param>
    /// <param name="ct">取消權杖</param>
    public async Task UpdatePublishedStatusAsync(string internalId, string JournalIndexId = null, int? JournalIndexRowId = null, CancellationToken ct = default)
    {
        bool isPublishing = !string.IsNullOrWhiteSpace(JournalIndexId) && JournalIndexRowId != null;
        await ExecTransactionAsync<object>(
            async token =>
            {
                var oldHeader = await QueryHeaderByInternalIdAsync(internalId, token);
                if (oldHeader == null) return null;
                var newHeader = oldHeader.Snapshot();
                ApplyPublishedStatus(newHeader, JournalIndexId, JournalIndexRowId);
                var repo = (dynamic)RepoDict[nameof(SpecJournal)];
                await repo.UpdateAsync((dynamic)oldHeader, (dynamic)newHeader, token);
                return null;
            },
            async (_, _) =>
            {
                Message.AddMessage(MessageStatus.Green, isPublishing ? SpecMessageCode.SpecBECode0004: SpecMessageCode.SpecBECode0003);
                await Task.CompletedTask;
            },
            ct);
    }
    #endregion

    #region Virtual Protected
    protected override Task BeforeUpdate(SpecJournal set, FuncAction act, CancellationToken ct = default)
    {
        var result = base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                BeforeCheckData(set);
                BeforeSetData(set);
                break;
        }
        return result;
    }
    #endregion

    #region Protected
    protected void BeforeCheckData(SpecJournal set)
    {
        CheckJouranlIndexIsEmpty(set);
    }

    protected void BeforeSetData(SpecJournal set)
    {
        SetFileNameEmpty(set);
    }

    #endregion

    #region Private
    /// <summary>
    /// 檢查期刊目次代號、卷期代號是否都有填，或是全空(預刊本)
    /// </summary>
    /// <param name="header"></param>
    protected void CheckJouranlIndexIsEmpty(SpecJournal header)
    {
        if (header.JournalIndexId.IsNullOrEmpty() && header.JournalIndexRowId.IsNullOrEmpty() || !header.JournalIndexId.IsNullOrEmpty() && !header.JournalIndexRowId.IsNullOrEmpty()) return;
        if(header.JournalIndexId.IsNullOrEmpty() ) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<SpecJournal>(x => x.JournalIndexId));
        if(header.JournalIndexRowId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<SpecJournal>(x => x.JournalIndexRowId));
    }
    /// <summary>
    /// 防呆:如果沒有上傳檔案(檔案來源為空)，顯示名稱就設為空白
    /// </summary>
    /// <param name="set"></param>
    protected void SetFileNameEmpty(SpecJournal set)
    {
        if (set.InsightPointFileId == null) set.InsightPointFileName = string.Empty;
        if (set.JournalFileId == null) set.JournalFileName = string.Empty;
        for (int i = set._SpecJournalRefFiles.Count - 1; i >= 0; i--)
        {
            var refFiles = set._SpecJournalRefFiles[i];
            if (refFiles.RefFileId == null) set._SpecJournalRefFiles.Remove(refFiles);
        }
        for (int i = set._SpecJournalOpenPointFiles.Count - 1; i >= 0; i--)
        {
            var openPointFile = set._SpecJournalOpenPointFiles[i];
            if (openPointFile.OpenPointFileId == null) set._SpecJournalOpenPointFiles.Remove(openPointFile);
        }
        for (int i = set._SpecJournalDocument.Count - 1; i >= 0; i--)
        {
            var document = set._SpecJournalDocument[i];
            if (document.DocumentId == null) set._SpecJournalDocument.Remove(document);
        }
    }
    /// <summary>
    /// 呼叫 ORCID record（JSON）；回傳是否找到與 JSON 內容
    /// </summary>
    private async Task<(bool IsFound, string? Json)> FetchOrcidRecordJsonAsync(string orcid, CancellationToken ct = default)
    {
        using var http = HttpClientFactory.CreateClient();
        using var req = new HttpRequestMessage(HttpMethod.Get, $"{OrcidConsts.ApiBase}/{WebUtility.UrlEncode(orcid)}/{OrcidConsts.RecordPath}");
        req.Headers.Accept.Clear();
        req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue(OrcidConsts.AcceptJson));
        using var res = await http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        // ✅ 404：代表該 ORCID iD 不存在（或 record 不可取得）
        if (res.StatusCode == HttpStatusCode.NotFound) return (false, null);
        if (!res.IsSuccessStatusCode) return (false, null);
        string json = await res.Content.ReadAsStringAsync(ct);
        return (true, json);
    }
    /// <summary>
    /// 解析 ORCID record JSON → DTO
    /// </summary>
    private static ORCIDData ParseOrcidRecord(string json, string orcid)
    {
        if (string.IsNullOrWhiteSpace(json)) return new ORCIDData { ORCID = orcid };

        using JsonDocument doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        var dto = new ORCIDData { ORCID = orcid };
        FillName(dto, root);
        FillEmployment(dto, root);
        FillEmail(dto, root);
        if (string.IsNullOrWhiteSpace(dto.AuthorName)) dto.AuthorName = dto.AuthorName_en;
        if (string.IsNullOrWhiteSpace(dto.Unit_en)) dto.Unit_en = dto.Unit;
        return dto;
    }
    /// <summary>
    /// 解析姓名（優先 credit-name，其次 given/family）
    /// </summary>
    private static void FillName(ORCIDData dto, JsonElement root)
    {
        if (!root.TryGetProperty(OrcidConsts.Person, out var person)) return;

        // 英文名（穩定）
        if (person.TryGetProperty(OrcidConsts.Name, out var name))
        {
            dto.AuthorName = GetString(name, OrcidConsts.CreditName, OrcidConsts.Value);

            string given = GetString(name, OrcidConsts.GivenNames, OrcidConsts.Value);
            string family = GetString(name, OrcidConsts.FamilyName, OrcidConsts.Value);
            dto.AuthorName_en = string.Join(" ", new[] { given, family }.Where(s => !string.IsNullOrWhiteSpace(s)));
        }

        // 補中文名（other-names，只當 fallback）
        if (string.IsNullOrWhiteSpace(dto.AuthorName)
            && person.TryGetProperty(OrcidConsts.OtherNames, out var others)
            && others.TryGetProperty(OrcidConsts.OtherName, out var arr)
            && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in arr.EnumerateArray())
            {
                string content = GetString(item, OrcidConsts.Content);
                if (LooksLikeCjk(content))
                {
                    dto.AuthorName = content;
                    break;
                }
            }
        }
    }
    /// <summary>
    /// 解析是否為中日韓文字
    /// </summary>
    private static bool LooksLikeCjk(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return false;
        return s.Any(c => c >= OrcidConsts.CjkStart && c <= OrcidConsts.CjkEnd);
    }
    /// <summary>
    /// 解析任職資訊（取 activities-summary.employments.employment-summary 的最新一筆）
    /// </summary>
    private static void FillEmployment(ORCIDData dto, JsonElement root)
    {
        if (!root.TryGetProperty(OrcidConsts.ActivitiesSummary, out var summary)) return;
        if (!summary.TryGetProperty(OrcidConsts.Employments, out var employments)) return;
        if (!employments.TryGetProperty(OrcidConsts.EmploymentSummary, out var arr) || arr.ValueKind != JsonValueKind.Array) return;

        JsonElement? latest = PickLatestEmployment(arr);
        if (latest == null) return;

        var emp = latest.Value;
        dto.JobTitle = GetString(emp, OrcidConsts.RoleTitle);

        if (emp.TryGetProperty(OrcidConsts.Organization, out var org))
        {
            dto.Unit = GetString(org, OrcidConsts.OrgName);
            dto.Country = GetString(org, OrcidConsts.Address, OrcidConsts.Country);
        }
    }
    /// <summary>
    /// 解析 Email（僅限可公開取得的 email；多數情況可能拿不到）
    /// </summary>
    private static void FillEmail(ORCIDData dto, JsonElement root)
    {
        if (!root.TryGetProperty(OrcidConsts.Person, out var person)) return;
        if (!person.TryGetProperty(OrcidConsts.Emails, out var emails)) return;
        if (!emails.TryGetProperty(OrcidConsts.Email, out var arr) || arr.ValueKind != JsonValueKind.Array) return;

        foreach (var e in arr.EnumerateArray())
        {
            var visibility = GetString(e, OrcidConsts.Visibility);
            var email = GetString(e, OrcidConsts.EmailValue);

            if (string.IsNullOrWhiteSpace(email)) continue;
            if (!string.IsNullOrWhiteSpace(visibility) && !visibility.Equals(OrcidConsts.VisibilityPublic, StringComparison.OrdinalIgnoreCase)) continue;

            dto.Email = email;
            return;
        }
    }
    /// <summary>
    /// 挑最新任職（優先 end-date 為 null 的現職，其次 start-date 最大）
    /// </summary>
    private static JsonElement? PickLatestEmployment(JsonElement arr)
    {
        JsonElement? best = null;
        (bool isCurrent, int startY, int startM, int startD) bestKey = (false, 0, 0, 0);

        foreach (var item in arr.EnumerateArray())
        {
            bool current = !HasEndDate(item);
            var (y, m, d) = GetStartDate(item);
            var key = (current, y, m, d);

            if (best == null || CompareEmploymentKey(key, bestKey) > 0)
            {
                best = item;
                bestKey = key;
            }
        }

        return best;
    }
    /// <summary>
    /// 
    /// </summary>
    /// <param name="item"></param>
    /// <returns></returns>
    private static bool HasEndDate(JsonElement item)
    {
        if (!item.TryGetProperty(OrcidConsts.EndDate, out var end)) return false;
        return end.ValueKind == JsonValueKind.Object && end.EnumerateObject().Any();
    }
    /// <summary>
    /// 
    /// </summary>
    /// <param name="item"></param>
    /// <returns></returns>
    private static (int y, int m, int d) GetStartDate(JsonElement item)
    {
        if (!item.TryGetProperty(OrcidConsts.StartDate, out var start)) return (0, 0, 0);
        return (GetInt(start, OrcidConsts.Year, OrcidConsts.Value),GetInt(start, OrcidConsts.Month, OrcidConsts.Value),GetInt(start, OrcidConsts.Day, OrcidConsts.Value));
    }
    /// <summary>
    /// 
    /// </summary>
    /// <param name="a"></param>
    /// <param name="b"></param>
    /// <returns></returns>
    private static int CompareEmploymentKey((bool c, int y, int m, int d) a, (bool c, int y, int m, int d) b)
    {
        if (a.c != b.c) return a.c ? 1 : -1;
        if (a.y != b.y) return a.y.CompareTo(b.y);
        if (a.m != b.m) return a.m.CompareTo(b.m);
        return a.d.CompareTo(b.d);
    }
    /// <summary>
    /// ORCID 合法性檢查（完整格式 + checksum）
    /// </summary>
    private static bool TryValidateOrcid(string input, out string validOrcid)
    {
        validOrcid = string.Empty;
        // ✅ 必須符合完整格式：0000-0002-4992-5683
        if (!Regex.IsMatch(input, OrcidConsts.OrcidFormatPattern, RegexOptions.CultureInvariant)) return false;
        // ✅ checksum（ISO 7064 mod 11-2）
        if (!IsValidOrcidChecksum(input)) return false;
        validOrcid = input;
        return true;
    }
    /// <summary>
    /// ORCID checksum 驗證（ISO 7064 mod 11-2）
    /// </summary>
    private static bool IsValidOrcidChecksum(string orcid)
    {
        string raw = orcid.Replace(OrcidConsts.Hyphen, string.Empty, StringComparison.Ordinal);
        if (raw.Length != OrcidConsts.OrcidRawLength) return false;
        int total = 0;
        for (int i = 0; i < OrcidConsts.OrcidChecksumIndex; i++)
        {
            int d = raw[i] - '0';
            total = (total + d) * 2;
        }
        int remainder = total % 11;
        int result = (12 - remainder) % 11;
        char check = result == 10 ? OrcidConsts.ChecksumX : (char)('0' + result);
        return char.ToUpperInvariant(raw[OrcidConsts.OrcidChecksumIndex]) == check;
    }
    /// <summary>
    /// 讀取 JSON 的 string（支援多層路徑）
    /// </summary>
    private static string GetString(JsonElement root, params string[] path)
    {
        JsonElement cur = root;
        foreach (var p in path)
        {
            if (cur.ValueKind != JsonValueKind.Object) return string.Empty;
            if (!cur.TryGetProperty(p, out cur)) return string.Empty;
        }
        return cur.ValueKind == JsonValueKind.String ? cur.GetString() ?? string.Empty : string.Empty;
    }
    /// <summary>
    /// 
    /// </summary>
    /// <param name="root"></param>
    /// <param name="path"></param>
    /// <returns></returns>
    private static int GetInt(JsonElement root, params string[] path)
    {
        string s = GetString(root, path);
        return int.TryParse(s, out var v) ? v : 0;
    }

    /// <summary>
    /// 依 InternalId 查詢表頭資料
    /// </summary>
    /// <param name="internalId">資料 InternalId</param>
    /// <returns>表頭資料</returns>
    private async Task<SpecJournal> QueryHeaderByInternalIdAsync(string internalId, CancellationToken ct)
    {
        var condition = $"{nameof(BasicDataModel.InternalId)} = \"{internalId}\"";
        var datas = await DoQueryListAsync<SpecJournal>([], condition, default, 0, 1, ct: ct);
        return datas.Cast<SpecJournal>().FirstOrDefault();
    }
    /// <summary>
    /// 套用出刊狀態與修改資訊
    /// </summary>
    /// <param name="header">表頭資料</param>
    /// <param name="journalIndexId">期刊目次代號</param>
    /// <param name="journalIndexRowId">卷期代號</param>
    private void ApplyPublishedStatus(SpecJournal header, string journalIndexId, int? journalIndexRowId)
    {
        header.JournalIndexId = string.IsNullOrWhiteSpace(journalIndexId) ? null : journalIndexId;
        header.JournalIndexRowId = journalIndexRowId;
        SetModifyInfo(header);
    }
    #endregion
}

/// <summary>
/// ORCID 相關常數集中管理（避免散落 magic string）
/// </summary>
static class OrcidConsts
{
    // ===== HTTP / API =====
    public const string ApiBase = "https://pub.orcid.org/v3.0";
    public const string RecordPath = "record";
    public const string AcceptJson = SysParam.MediaTypes.ApplicationJson;
    public const string CacheKeyPrefix = "orcid:author:";
    // ===== JSON Path Segments =====
    public const string Person = "person";
    public const string Name = "name";
    public const string CreditName = "credit-name";
    public const string GivenNames = "given-names";
    public const string FamilyName = "family-name";
    public const string Value = "value";
    public const string OtherNames = "other-names";
    public const string OtherName = "other-name";
    public const string Content = "content";
    public const string ActivitiesSummary = "activities-summary";
    public const string Employments = "employments";
    public const string EmploymentSummary = "employment-summary";
    public const string RoleTitle = "role-title";
    public const string Organization = "organization";
    public const string OrgName = "name";
    public const string Address = "address";
    public const string Country = "country";
    public const string Emails = "emails";
    public const string Email = "email";
    public const string EmailValue = "email";
    public const string Visibility = "visibility";
    public const string VisibilityPublic = "public";
    public const string EndDate = "end-date";
    public const string StartDate = "start-date";
    public const string Year = "year";
    public const string Month = "month";
    public const string Day = "day";
    // ===== Validation =====
    /// <summary>ORCID 必須完整格式：0000-0000-0000-0000（最後一碼可為 X）</summary>
    public const string OrcidFormatPattern = @"^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$";
    /// <summary>ORCID 去掉 - 後的長度</summary>
    public const int OrcidRawLength = 16;
    /// <summary>checksum 位置（最後一碼 index=15）</summary>
    public const int OrcidChecksumIndex = 15;
    /// <summary>連字號字元</summary>
    public const string Hyphen = "-";
    /// <summary>checksum 可能為 X</summary>
    public const char ChecksumX = 'X';
    // ===== Others =====
    public const int CjkStart = 0x4E00;
    public const int CjkEnd = 0x9FFF;
}
