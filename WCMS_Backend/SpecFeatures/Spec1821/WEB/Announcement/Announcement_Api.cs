using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using WCMS.Features.WEB.SiteViewCount;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.Announcement;
/// <summary>
/// 招生舊站公告一次性匯入 API。
/// 用途：讀取爬蟲產出的類別 ZIP，先上傳檔案取得 InternalId，再替換公告內文下載連結並保存公告。
/// </summary>
public partial class AnnouncementController
{
    #region Property
    /// <summary>
    /// JSON 讀取選項，支援爬蟲包 camelCase 欄位。
    /// </summary>
    private static readonly JsonSerializerOptions LegacyJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = true,
    };
    /// <summary>
    /// 一次性匯入產生的公開下載路由。
    /// </summary>
    private const string PublicDownloadRoute = "/Service/FileManagement/Public_Download";
    #endregion

    #region Public
    /// <summary>
    /// 一次性匯入舊站招生公告類別 ZIP。
    /// </summary>
    [HttpPost(nameof(ImportLegacyAcaAnnouncementZip)), LocalhostOnly, IgnoreAntiforgeryToken]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 1073741824)]
    public async Task<IActionResult> ImportLegacyAcaAnnouncementZip(IFormFile zipFile, [FromForm] string categoryId, [FromForm] string siteIndex = "", [FromForm] string lang = "zh-tw", CancellationToken ct = default)
    {
        if (zipFile == null || zipFile.Length == 0) return BadRequest("請上傳舊站公告類別 ZIP。 ");
        if (string.IsNullOrWhiteSpace(categoryId)) return BadRequest("請輸入新站公告類別 ID。 ");
        LegacyAcaPackageImportResult result = await ImportLegacyAcaPackageAsync(zipFile, categoryId, siteIndex, lang, ct);
        ApiResponse<LegacyAcaPackageImportResult> response = new() { Data = [result], SysMessage = Message.Messages };
        return Ok(response);
    }
    #endregion

    #region Private
    /// <summary>
    /// 匯入整包舊站公告類別資料。
    /// </summary>
    private async Task<LegacyAcaPackageImportResult> ImportLegacyAcaPackageAsync(IFormFile zipFile, string categoryId, string siteIndex, string lang, CancellationToken ct)
    {
        using Stream zipStream = zipFile.OpenReadStream();
        using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, false, Encoding.UTF8);
        LegacyAcaPackageManifest manifest = await ReadManifestAsync(archive, ct);
        LegacyAcaPackageImportResult result = CreatePackageResult(manifest);
        foreach (LegacyAcaManifestItem item in manifest.Items)
        {
            LegacyAcaArticleImportResult itemResult = await TryImportLegacyAcaItemAsync(archive, item, categoryId, siteIndex, lang, ct);
            result.Items.Add(itemResult);
        }
        result.SuccessCount = result.Items.Count(p => p.Status == LegacyImportStatus.Success);
        result.FailedCount = result.Items.Count(p => p.Status == LegacyImportStatus.Failed);
        return result;
    }

    /// <summary>
    /// 匯入單篇公告並保留失敗資訊。
    /// </summary>
    private async Task<LegacyAcaArticleImportResult> TryImportLegacyAcaItemAsync(ZipArchive archive, LegacyAcaManifestItem item, string categoryId, string siteIndex, string lang, CancellationToken ct)
    {
        LegacyAcaArticleImportResult result = CreateItemResult(item);
        try
        {
            Message.Messages.Clear();
            await ImportLegacyAcaItemAsync(archive, item, categoryId, siteIndex, lang, result, ct);
            result.Status = LegacyImportStatus.Success;
        }
        catch (Exception ex)
        {
            result.Status = LegacyImportStatus.Failed;
            result.ErrorMessage = ex.Message;
        }
        return result;
    }

    /// <summary>
    /// 依舊站清單連結類型分流匯入單篇公告。
    /// </summary>
    private async Task ImportLegacyAcaItemAsync(ZipArchive archive, LegacyAcaManifestItem item, string categoryId, string siteIndex, string lang, LegacyAcaArticleImportResult result, CancellationToken ct)
    {
        item.ItemFolder = ResolveItemFolder(item);
        LegacyAcaArticle article = await ReadArticleAsync(archive, item.ItemFolder, ct);
        ApplyManifestItemToArticle(article, item);
        LegacyAcaItemLinkType linkType = ResolveItemLinkType(item, article);
        result.LinkType = linkType.ToString();
        switch (linkType)
        {
            case LegacyAcaItemLinkType.DownloadFile:
                await ImportLegacyDownloadFileItemAsync(archive, item, article, categoryId, siteIndex, lang, result, ct);
                break;
            case LegacyAcaItemLinkType.ExternalLink:
            case LegacyAcaItemLinkType.DeadLink:
                await ImportLegacyUrlItemAsync(item, article, linkType, categoryId, siteIndex, lang, result, ct);
                break;
            default:
                await ImportLegacyContentItemAsync(archive, item, article, categoryId, siteIndex, lang, result, ct);
                break;
        }
    }

    /// <summary>
    /// 匯入有內文公告，並將內文舊站檔案連結替換為 public download。
    /// </summary>
    private async Task ImportLegacyContentItemAsync(ZipArchive archive, LegacyAcaManifestItem item, LegacyAcaArticle article, string categoryId, string siteIndex, string lang, LegacyAcaArticleImportResult result, CancellationToken ct)
    {
        List<LegacyAcaFileLinkMapping> mappings = await ReadFileMappingsAsync(archive, item.ItemFolder, article.FileLinkMappingFile, ct);
        Dictionary<string, string> fileInternalIdMap = await UploadArticleFilesAsync(archive, item.ItemFolder, mappings, result, ct);
        string contentHtml = await ReadTextAsync(archive, BuildZipPath(item.ItemFolder, article.ContentFile), ct);
        if (string.IsNullOrWhiteSpace(contentHtml)) throw new InvalidOperationException($"content_original.html 內容為空：{article.Title}");
        string replacedHtml = ReplaceArticleContentLinks(contentHtml, mappings, fileInternalIdMap, result);
        Announcement savedSet = await SaveAnnouncementAsync(BuildContentAnnouncement(article, replacedHtml, categoryId, lang), ct);
        await CompleteImportedAnnouncementAsync(savedSet, siteIndex, article.ViewCount, result, ct);
    }

    /// <summary>
    /// 匯入清單直接下載檔案的公告，只建立標題與附件關聯。
    /// </summary>
    private async Task ImportLegacyDownloadFileItemAsync(ZipArchive archive, LegacyAcaManifestItem item, LegacyAcaArticle article, string categoryId, string siteIndex, string lang, LegacyAcaArticleImportResult result, CancellationToken ct)
    {
        List<LegacyAcaFileLinkMapping> mappings = await ReadFileMappingsAsync(archive, item.ItemFolder, article.FileLinkMappingFile, ct);
        if (mappings.Count == 0) throw new InvalidOperationException($"下載檔案項目缺少 file_link_mapping：{article.Title}");
        Dictionary<string, string> fileInternalIdMap = await UploadArticleFilesAsync(archive, item.ItemFolder, mappings, result, ct);
        Announcement set = BuildDownloadAnnouncement(article, mappings, fileInternalIdMap, categoryId, lang);
        Announcement savedSet = await SaveAnnouncementAsync(set, ct);
        result.AttachedFileCount = set.AnnouncementDetailFile.Count;
        await CompleteImportedAnnouncementAsync(savedSet, siteIndex, article.ViewCount, result, ct);
    }

    /// <summary>
    /// 匯入清單外部連結或 404 連結公告，只建立標題與 Url。
    /// </summary>
    private async Task ImportLegacyUrlItemAsync(LegacyAcaManifestItem item, LegacyAcaArticle article, LegacyAcaItemLinkType linkType, string categoryId, string siteIndex, string lang, LegacyAcaArticleImportResult result, CancellationToken ct)
    {
        string url = ResolveLegacyUrl(item, article);
        Announcement savedSet = await SaveAnnouncementAsync(BuildUrlAnnouncement(article, url, categoryId, lang), ct);
        result.LinkUrl = url;
        result.ManualReviewRequired = linkType == LegacyAcaItemLinkType.DeadLink;
        await CompleteImportedAnnouncementAsync(savedSet, siteIndex, article.ViewCount, result, ct);
    }

    /// <summary>
    /// 完成公告保存後補點閱數與回傳資訊。
    /// </summary>
    private async Task CompleteImportedAnnouncementAsync(Announcement savedSet, string siteIndex, int viewCount, LegacyAcaArticleImportResult result, CancellationToken ct)
    {
        await UpsertSiteViewCountAsync(siteIndex, savedSet.Announcement.InternalId, viewCount, ct);
        result.InternalId = savedSet.Announcement.InternalId;
        result.AnnouncementId = savedSet.Announcement.AnnouncementId ?? string.Empty;
        result.SiteViewCount = viewCount;
        await EvictForSetAsync(ct, savedSet.Announcement.InternalId);
    }

    /// <summary>
    /// 上傳單篇公告所需檔案並回傳舊連結與 InternalId 對應。
    /// </summary>
    private async Task<Dictionary<string, string>> UploadArticleFilesAsync(ZipArchive archive, string itemFolder, List<LegacyAcaFileLinkMapping> mappings, LegacyAcaArticleImportResult result, CancellationToken ct)
    {
        Dictionary<string, string> fileInternalIdMap = new(StringComparer.OrdinalIgnoreCase);
        foreach (LegacyAcaFileLinkMapping mapping in mappings.Where(ShouldUploadMappingFile))
        {
            string oldHrefKey = GetOldHrefKey(mapping);
            if (fileInternalIdMap.ContainsKey(oldHrefKey)) continue;
            string internalId = await UploadArticleFileAsync(archive, itemFolder, mapping, ct);
            fileInternalIdMap[oldHrefKey] = internalId;
            result.FileInternalIdMap[oldHrefKey] = internalId;
        }
        if (fileInternalIdMap.Count > 0) await FileService.MoveToPermanent([.. fileInternalIdMap.Values.Distinct()]);
        result.UploadedFileCount = fileInternalIdMap.Count;
        return fileInternalIdMap;
    }

    /// <summary>
    /// 上傳 ZIP 內的單一實體檔案並取得 InternalId。
    /// </summary>
    private async Task<string> UploadArticleFileAsync(ZipArchive archive, string itemFolder, LegacyAcaFileLinkMapping mapping, CancellationToken ct)
    {
        string entryPath = BuildZipPath(itemFolder, ResolveDownloadFilePath(mapping));
        ZipArchiveEntry entry = FindRequiredEntry(archive, entryPath);
        using MemoryStream memoryStream = new();
        await using Stream entryStream = entry.Open();
        await entryStream.CopyToAsync(memoryStream, ct);
        memoryStream.Position = 0;
        FormFile file = new(memoryStream, 0, memoryStream.Length, "file", ResolveUploadFileName(mapping, entry));
        return await FileService.UploadTemp(file);
    }

    /// <summary>
    /// 保存公告資料並回傳保存後的 Set。
    /// </summary>
    private async Task<Announcement> SaveAnnouncementAsync(Announcement set, CancellationToken ct)
    {
        Announcement savedSet = await Service.BizCreateDataAsync(set, ct);
        if (Message.HasError) throw new InvalidOperationException(GetErrorMessageText());
        return savedSet;
    }

    /// <summary>
    /// 建立有內文公告保存模型。
    /// </summary>
    private static Announcement BuildContentAnnouncement(LegacyAcaArticle article, string contentHtml, string categoryId, string lang)
    {
        Announcement set = BuildAnnouncementBaseSet(article, categoryId);
        set.AnnouncementDetail.Add(BuildContentAnnouncementDetail(article, contentHtml, lang));
        return set;
    }

    /// <summary>
    /// 建立直接下載檔案公告保存模型。
    /// </summary>
    private static Announcement BuildDownloadAnnouncement(LegacyAcaArticle article, List<LegacyAcaFileLinkMapping> mappings, Dictionary<string, string> fileInternalIdMap, string categoryId, string lang)
    {
        Announcement set = BuildAnnouncementBaseSet(article, categoryId);
        set.AnnouncementDetail.Add(BuildContentAnnouncementDetail(article, string.Empty, lang));
        set.AnnouncementDetailFile.AddRange(BuildAnnouncementDetailFiles(article, mappings, fileInternalIdMap));
        return set;
    }

    /// <summary>
    /// 建立外部連結或 404 連結公告保存模型。
    /// </summary>
    private static Announcement BuildUrlAnnouncement(LegacyAcaArticle article, string url, string categoryId, string lang)
    {
        Announcement set = BuildAnnouncementBaseSet(article, categoryId);
        set.AnnouncementDetail.Add(BuildUrlAnnouncementDetail(article, url, lang));
        return set;
    }

    /// <summary>
    /// 建立公告保存基礎模型。
    /// </summary>
    private static Announcement BuildAnnouncementBaseSet(LegacyAcaArticle article, string categoryId)
    {
        Announcement set = new() { Announcement = BuildAnnouncementHeader(article, ParsePublishDate(article.PublishDate), categoryId) };
        return set;
    }

    /// <summary>
    /// 建立公告主表。
    /// </summary>
    private static Announcement BuildAnnouncementHeader(LegacyAcaArticle article, DateTime publishDate, string categoryId)
    {
        DateTime? validateEnd = ResolveValidateEndDate(article, publishDate);
        return new Announcement
        {
            //AnnouncementId = article.SourceArticleId,
            Categories = categoryId,
            Tags = string.Empty,
            ContentStatus = ContentStatus.None,
            Validate_Start = publishDate,
            Validate_End = validateEnd,
            CreateTime = publishDate,
            ModifyTime = publishDate,
            FormStatus = FormStatus.Saved,
            DataStatus = DataStatus.Valid,
            IsIniData = true,
        };
    }

    /// <summary>
    /// 建立公告內文明細。
    /// </summary>
    private static AnnouncementDetail BuildContentAnnouncementDetail(LegacyAcaArticle article, string contentHtml, string lang)
    {
        return new AnnouncementDetail
        {
            //AnnouncementId = article.SourceArticleId,
            RowId = 1,
            Lang = LangCodeExt.Normalize(lang),
            Title = article.Title ?? string.Empty,
            Content = contentHtml,
            Url = string.Empty,
            UrlDescription = string.Empty,
        };
    }

    /// <summary>
    /// 建立公告網址明細。
    /// </summary>
    private static AnnouncementDetail BuildUrlAnnouncementDetail(LegacyAcaArticle article, string url, string lang)
    {
        return new AnnouncementDetail
        {
            //AnnouncementId = article.SourceArticleId,
            RowId = 1,
            Lang = LangCodeExt.Normalize(lang),
            Title = article.Title ?? string.Empty,
            Content = string.Empty,
            Url = url,
            UrlDescription = article.Title ?? string.Empty,
        };
    }

    /// <summary>
    /// 建立公告附件明細。
    /// </summary>
    private static IEnumerable<AnnouncementDetailFile> BuildAnnouncementDetailFiles(LegacyAcaArticle article, List<LegacyAcaFileLinkMapping> mappings, Dictionary<string, string> fileInternalIdMap)
    {
        int rowId = 1;
        foreach (LegacyAcaFileLinkMapping mapping in mappings)
        {
            if (!fileInternalIdMap.TryGetValue(GetOldHrefKey(mapping), out string? internalId)) continue;
            yield return BuildAnnouncementDetailFile(article, mapping, internalId, rowId++);
        }
    }

    /// <summary>
    /// 建立單筆公告附件明細。
    /// </summary>
    private static AnnouncementDetailFile BuildAnnouncementDetailFile(LegacyAcaArticle article, LegacyAcaFileLinkMapping mapping, string internalId, int rowId)
    {
        return new AnnouncementDetailFile
        {
            //AnnouncementId = article.SourceArticleId ?? string.Empty,
            ParentRowId = 1,
            RowId = rowId,
            FileId = internalId,
            FileName = ResolveMappingFileName(mapping),
        };
    }

    /// <summary>
    /// 新增或更新公告點閱數。
    /// </summary>
    private async Task UpsertSiteViewCountAsync(string siteIndex, string internalId, int viewCount, CancellationToken ct)
    {
        if (viewCount <= 0 || string.IsNullOrWhiteSpace(internalId)) return;
        ApplicationDbContext db = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
        await EnsureSiteViewCountHeaderAsync(db, siteIndex, ct);
        SiteViewCountDetailModel? detail = await db.Set<SiteViewCountDetailModel>().FindAsync([siteIndex, Service.ProgId, internalId], ct);
        if (detail == null) db.Set<SiteViewCountDetailModel>().Add(CreateSiteViewCountDetail(siteIndex, Service.ProgId, internalId, viewCount));
        else detail.PageViewCount = viewCount;
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// 確保 SiteViewCount 主表存在。
    /// </summary>
    private async Task EnsureSiteViewCountHeaderAsync(ApplicationDbContext db, string siteIndex, CancellationToken ct)
    {
        SiteViewCountHeaderModel? header = await db.Set<SiteViewCountHeaderModel>().FindAsync([siteIndex], ct);
        if (header != null) return;
        db.Set<SiteViewCountHeaderModel>().Add(CreateSiteViewCountHeader(siteIndex));
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// 建立 SiteViewCount 主表。
    /// </summary>
    private SiteViewCountHeaderModel CreateSiteViewCountHeader(string siteIndex)
    {
        DateTime now = DateTime.Now;
        return new SiteViewCountHeaderModel
        {
            SiteIndex = siteIndex,
            InternalId = Guid.NewGuid().ToString(),
            CreateTime = now,
            ModifyTime = now,
            CreateUserId = OperateUser.UserId,
            ModifyUserId = OperateUser.UserId,
            FormStatus = FormStatus.Saved,
            DataStatus = DataStatus.Valid,
            PublicViewCount = 0,
        };
    }

    /// <summary>
    /// 建立 SiteViewCount 明細。
    /// </summary>
    private static SiteViewCountDetailModel CreateSiteViewCountDetail(string siteIndex, string progId, string internalId, int viewCount)
    {
        return new SiteViewCountDetailModel
        {
            SiteIndex = siteIndex,
            ProgId = progId,
            TargetInternalId = internalId,
            PageViewCount = viewCount,
            FilePreviewCount = 0,
            FileDownloadCount = 0,
            LinkClickCount = 0,
        };
    }

    /// <summary>
    /// 將內文中的舊下載連結替換為 public download。
    /// </summary>
    private static string ReplaceArticleContentLinks(string html, List<LegacyAcaFileLinkMapping> mappings, Dictionary<string, string> fileInternalIdMap, LegacyAcaArticleImportResult result)
    {
        string content = html;
        foreach (LegacyAcaFileLinkMapping mapping in mappings)
        {
            if (!fileInternalIdMap.TryGetValue(GetOldHrefKey(mapping), out string? internalId)) continue;
            string newHref = BuildPublicDownloadUrl(internalId, ResolveMappingFileName(mapping));
            content = ReplaceHrefValue(content, mapping.OldHref, newHref);
            content = ReplaceHrefValue(content, mapping.NormalizedOldHref, newHref);
            result.ReplacedLinkCount++;
        }
        return content;
    }

    /// <summary>
    /// 替換單一 href 值。
    /// </summary>
    private static string ReplaceHrefValue(string html, string? oldHref, string newHref)
    {
        if (string.IsNullOrWhiteSpace(oldHref)) return html;
        string content = html.Replace(oldHref, newHref, StringComparison.OrdinalIgnoreCase);
        string decodedHref = Uri.UnescapeDataString(oldHref);
        return content.Replace(decodedHref, newHref, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 建立公開下載連結。
    /// </summary>
    private static string BuildPublicDownloadUrl(string internalId, string? fileName)
    {
        string url = $"{PublicDownloadRoute}/{internalId}";
        if (string.IsNullOrWhiteSpace(fileName)) return url;
        return $"{url}?fileName={Uri.EscapeDataString(fileName)}";
    }

    /// <summary>
    /// 讀取類別包 Manifest。
    /// </summary>
    private static async Task<LegacyAcaPackageManifest> ReadManifestAsync(ZipArchive archive, CancellationToken ct)
    {
        ZipArchiveEntry entry = FindManifestEntry(archive);
        await using Stream stream = entry.Open();
        LegacyAcaPackageManifest? result = await JsonSerializer.DeserializeAsync<LegacyAcaPackageManifest>(stream, LegacyJsonOptions, ct);
        return result ?? new LegacyAcaPackageManifest();
    }

    /// <summary>
    /// 讀取單篇公告 JSON。
    /// </summary>
    private static async Task<LegacyAcaArticle> ReadArticleAsync(ZipArchive archive, string itemFolder, CancellationToken ct)
    {
        LegacyAcaArticle result = await ReadJsonAsync<LegacyAcaArticle>(archive, BuildZipPath(itemFolder, "article.json"), ct);
        result.ItemFolder = string.IsNullOrWhiteSpace(result.ItemFolder) ? itemFolder : result.ItemFolder;
        return result;
    }

    /// <summary>
    /// 讀取單篇公告檔案連結對照表，沒有檔案時回傳空集合。
    /// </summary>
    private static async Task<List<LegacyAcaFileLinkMapping>> ReadFileMappingsAsync(ZipArchive archive, string itemFolder, string? mappingFile, CancellationToken ct)
    {
        string fileName = string.IsNullOrWhiteSpace(mappingFile) ? "file_link_mapping.json" : mappingFile;
        ZipArchiveEntry? entry = FindOptionalEntry(archive, BuildZipPath(itemFolder, fileName));
        if (entry == null) return [];
        await using Stream stream = entry.Open();
        return await JsonSerializer.DeserializeAsync<List<LegacyAcaFileLinkMapping>>(stream, LegacyJsonOptions, ct) ?? [];
    }

    /// <summary>
    /// 讀取 ZIP 內 JSON 檔案。
    /// </summary>
    private static async Task<T> ReadJsonAsync<T>(ZipArchive archive, string suffix, CancellationToken ct) where T : new()
    {
        ZipArchiveEntry entry = FindRequiredEntry(archive, suffix);
        await using Stream stream = entry.Open();
        T? result = await JsonSerializer.DeserializeAsync<T>(stream, LegacyJsonOptions, ct);
        return result ?? new T();
    }

    /// <summary>
    /// 讀取 ZIP 內文字檔案。
    /// </summary>
    private static async Task<string> ReadTextAsync(ZipArchive archive, string suffix, CancellationToken ct)
    {
        ZipArchiveEntry entry = FindRequiredEntry(archive, suffix);
        using StreamReader reader = new(entry.Open(), Encoding.UTF8, true);
        return await reader.ReadToEndAsync(ct);
    }

    /// <summary>
    /// 尋找 manifest JSON 檔。
    /// </summary>
    private static ZipArchiveEntry FindManifestEntry(ZipArchive archive)
    {
        return archive.Entries.FirstOrDefault(p => NormalizeZipPath(p.FullName).EndsWith("_manifest.json", StringComparison.OrdinalIgnoreCase))
            ?? archive.Entries.FirstOrDefault(p => NormalizeZipPath(p.FullName).EndsWith("manifest.json", StringComparison.OrdinalIgnoreCase))
            ?? throw new FileNotFoundException("ZIP 內找不到 manifest JSON。 ");
    }

    /// <summary>
    /// 依結尾路徑尋找 ZIP entry。
    /// </summary>
    private static ZipArchiveEntry FindRequiredEntry(ZipArchive archive, string suffix)
    {
        return FindOptionalEntry(archive, suffix) ?? throw new FileNotFoundException($"ZIP 內找不到必要檔案：{suffix}");
    }

    /// <summary>
    /// 嘗試依結尾路徑尋找 ZIP entry。
    /// </summary>
    private static ZipArchiveEntry? FindOptionalEntry(ZipArchive archive, string suffix)
    {
        string normalizedSuffix = NormalizeZipPath(suffix);
        return archive.Entries.FirstOrDefault(p => NormalizeZipPath(p.FullName).EndsWith(normalizedSuffix, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// 組合 ZIP 內相對路徑。
    /// </summary>
    private static string BuildZipPath(params string?[] parts)
    {
        return string.Join("/", parts.Where(p => !string.IsNullOrWhiteSpace(p)).Select(p => NormalizeZipPath(p!)));
    }

    /// <summary>
    /// 正規化 ZIP 路徑。
    /// </summary>
    private static string NormalizeZipPath(string value)
    {
        return value.Replace("\\", "/").Trim().TrimStart('/');
    }

    /// <summary>
    /// 取得舊站 href 對應 key。
    /// </summary>
    private static string GetOldHrefKey(LegacyAcaFileLinkMapping mapping)
    {
        return mapping.NormalizedOldHref?.Trim() ?? mapping.OldHref?.Trim() ?? string.Empty;
    }

    /// <summary>
    /// 解析 Manifest 單筆資料夾路徑，支援 crawler itemFolder / itemDir 兩種欄位。
    /// </summary>
    private static string ResolveItemFolder(LegacyAcaManifestItem item)
    {
        string folder = FirstText(item.ItemFolder, item.ItemDir);
        if (!string.IsNullOrWhiteSpace(folder)) return folder;
        return Path.GetDirectoryName(item.ArticleJsonPath ?? string.Empty)?.Replace("\\", "/") ?? string.Empty;
    }

    /// <summary>
    /// 解析 ZIP 內下載檔案路徑，支援 crawler localPath / downloadFilePath 兩種欄位。
    /// </summary>
    private static string ResolveDownloadFilePath(LegacyAcaFileLinkMapping mapping)
    {
        return FirstText(mapping.DownloadFilePath, mapping.LocalPath);
    }

    /// <summary>
    /// 判斷對照檔是否真的有成功下載並可上傳。
    /// </summary>
    private static bool ShouldUploadMappingFile(LegacyAcaFileLinkMapping mapping)
    {
        if (mapping.DownloadOk == false) return false;
        return !string.IsNullOrWhiteSpace(ResolveDownloadFilePath(mapping));
    }

    /// <summary>
    /// 解析下載檔案名稱，支援 crawler fileName / downloadFileName 兩種欄位。
    /// </summary>
    private static string ResolveMappingFileName(LegacyAcaFileLinkMapping mapping)
    {
        return FirstText(mapping.FileName, mapping.DownloadFileName);
    }

    /// <summary>
    /// 解析上傳顯示檔名。
    /// </summary>
    private static string ResolveUploadFileName(LegacyAcaFileLinkMapping mapping, ZipArchiveEntry entry)
    {
        string fileName = ResolveMappingFileName(mapping);
        if (!string.IsNullOrWhiteSpace(fileName)) return fileName;
        return Path.GetFileName(entry.FullName);
    }

    /// <summary>
    /// 解析清單項目連結類型。
    /// </summary>
    private static LegacyAcaItemLinkType ResolveItemLinkType(LegacyAcaManifestItem item, LegacyAcaArticle article)
    {
        string value = FirstText(article.ItemLinkType, article.LinkType, item.ItemLinkType, item.LinkType);
        if (IsDownloadType(value)) return LegacyAcaItemLinkType.DownloadFile;
        if (IsExternalType(value)) return LegacyAcaItemLinkType.ExternalLink;
        if (IsDeadLinkType(value)) return LegacyAcaItemLinkType.DeadLink;
        return LegacyAcaItemLinkType.Article;
    }

    /// <summary>
    /// 解析清單連結型公告的網址。
    /// </summary>
    private static string ResolveLegacyUrl(LegacyAcaManifestItem item, LegacyAcaArticle article)
    {
        return FirstText(article.LinkUrl, article.Url, article.SourceArticleUrl, item.LinkUrl, item.Url, item.SourceArticleUrl);
    }

    /// <summary>
    /// 取得第一個非空文字。
    /// </summary>
    private static string FirstText(params string?[] values)
    {
        return values.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p))?.Trim() ?? string.Empty;
    }

    /// <summary>
    /// 判斷是否為直接下載檔案類型。
    /// </summary>
    private static bool IsDownloadType(string value)
    {
        return value.Contains("下載", StringComparison.OrdinalIgnoreCase) || value.Equals("downloadFile", StringComparison.OrdinalIgnoreCase) || value == "3";
    }

    /// <summary>
    /// 判斷是否為外部連結類型。
    /// </summary>
    private static bool IsExternalType(string value)
    {
        return value.Contains("外部", StringComparison.OrdinalIgnoreCase) || value.Equals("externalLink", StringComparison.OrdinalIgnoreCase) || value == "2";
    }

    /// <summary>
    /// 判斷是否為死連結類型。
    /// </summary>
    private static bool IsDeadLinkType(string value)
    {
        return value.Contains("404", StringComparison.OrdinalIgnoreCase) || value.Equals("deadLink", StringComparison.OrdinalIgnoreCase) || value == "4";
    }

    /// <summary>
    /// 解析發布日期。
    /// </summary>
    private static DateTime ParsePublishDate(string? value)
    {
        if (DateTime.TryParse(value, out DateTime result)) return result;
        return DateTime.Today;
    }

    /// <summary>
    /// 解析下架日期；歷年清單預設為上架隔一天。
    /// </summary>
    private static DateTime? ResolveValidateEndDate(LegacyAcaArticle article, DateTime publishDate)
    {
        if (DateTime.TryParse(article.UnpublishDate, out DateTime endDate)) return endDate;
        if (article.IsHistorySection == true) return publishDate.AddDays(1);
        string sectionTitle = FirstText(article.ListSectionTitle, article.SectionTitle, article.GroupTitle);
        return IsHistoryListSection(sectionTitle) ? publishDate.AddDays(1) : null;
    }

    /// <summary>
    /// 判斷是否為歷年清單區塊。
    /// </summary>
    private static bool IsHistoryListSection(string value)
    {
        return value.Contains("歷年", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 將 Manifest 摘要資料補到單篇公告資料。
    /// </summary>
    private static void ApplyManifestItemToArticle(LegacyAcaArticle article, LegacyAcaManifestItem item)
    {
        article.SourceArticleId = FirstText(article.SourceArticleId, item.SourceArticleId);
        article.SourceArticleUrl = FirstText(article.SourceArticleUrl, item.SourceArticleUrl);
        article.Title = FirstText(article.Title, item.Title);
        article.PublishDate = FirstText(article.PublishDate, item.PublishDate);
        article.UnpublishDate = FirstText(article.UnpublishDate, item.UnpublishDate);
        article.ListSectionTitle = FirstText(article.ListSectionTitle, item.ListSectionTitle, item.SectionTitle, item.GroupTitle);
        article.SectionTitle = FirstText(article.SectionTitle, item.SectionTitle);
        article.GroupTitle = FirstText(article.GroupTitle, item.GroupTitle);
        article.IsHistorySection ??= item.IsHistorySection;
    }

    /// <summary>
    /// 嘗試設定 Spec 客製欄位。
    /// </summary>
    private static void TrySetProperty(object target, string propertyName, object? value)
    {
        if (value == null) return;
        var prop = target.GetType().GetProperty(propertyName);
        if (prop == null || !prop.CanWrite) return;
        Type targetType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
        prop.SetValue(target, Convert.ChangeType(value, targetType));
    }

    /// <summary>
    /// 建立整包匯入結果。
    /// </summary>
    private static LegacyAcaPackageImportResult CreatePackageResult(LegacyAcaPackageManifest manifest)
    {
        return new LegacyAcaPackageImportResult
        {
            CategoryCode = manifest.CategoryCode ?? string.Empty,
            CategoryName = manifest.CategoryName ?? string.Empty,
            SourceListUrl = manifest.SourceListUrl ?? string.Empty,
            TotalCount = manifest.Items.Count,
        };
    }

    /// <summary>
    /// 建立單篇匯入結果。
    /// </summary>
    private static LegacyAcaArticleImportResult CreateItemResult(LegacyAcaManifestItem item)
    {
        return new LegacyAcaArticleImportResult
        {
            SourceArticleId = item.SourceArticleId ?? string.Empty,
            SourceArticleUrl = item.SourceArticleUrl ?? string.Empty,
            Title = item.Title ?? string.Empty,
        };
    }

    /// <summary>
    /// 取得目前錯誤訊息文字。
    /// </summary>
    private string GetErrorMessageText()
    {
        return string.Join("；", Message.Messages.Where(p => p.Status == MessageStatus.Error).Select(p => p.Message));
    }

    /// <summary>
    /// 類別包 Manifest。
    /// </summary>
    private sealed class LegacyAcaPackageManifest
    {
        public string? SourceListUrl { get; set; }
        public string? CategoryCode { get; set; }
        public string? CategoryName { get; set; }
        public List<LegacyAcaManifestItem> Items { get; set; } = [];
    }

    /// <summary>
    /// Manifest 內的單篇公告摘要。
    /// </summary>
    private sealed class LegacyAcaManifestItem
    {
        public string ItemFolder { get; set; } = string.Empty;
        public string? ItemDir { get; set; }
        public string? ArticleJsonPath { get; set; }
        public string? SourceArticleId { get; set; }
        public string? SourceArticleUrl { get; set; }
        public string? Title { get; set; }
        public string? PublishDate { get; set; }
        public string? UnpublishDate { get; set; }
        public string? ListSectionTitle { get; set; }
        public string? SectionTitle { get; set; }
        public string? GroupTitle { get; set; }
        public bool? IsHistorySection { get; set; }
        public string? LinkType { get; set; }
        public string? ItemLinkType { get; set; }
        public string? LinkUrl { get; set; }
        public string? Url { get; set; }
    }

    /// <summary>
    /// 單篇公告資料。
    /// </summary>
    private sealed class LegacyAcaArticle
    {
        public string ItemFolder { get; set; } = string.Empty;
        public string? CategoryCode { get; set; }
        public string? SourceArticleId { get; set; }
        public string? Title { get; set; }
        public string? PublishDate { get; set; }
        public string? UnpublishDate { get; set; }
        public string? ListSectionTitle { get; set; }
        public string? SectionTitle { get; set; }
        public string? GroupTitle { get; set; }
        public bool? IsHistorySection { get; set; }
        public int ViewCount { get; set; }
        public string? LinkType { get; set; }
        public string? ItemLinkType { get; set; }
        public string? LinkUrl { get; set; }
        public string? Url { get; set; }
        public string? UrlDescription { get; set; }
        /// <summary>
        /// 舊站文章來源網址。
        /// </summary>
        public string? SourceArticleUrl { get; set; }
        public string? ContentFile { get; set; } = "content_original.html";
        public string? FileLinkMappingFile { get; set; } = "file_link_mapping.json";
    }

    /// <summary>
    /// 舊站檔案連結對照資料。
    /// </summary>
    private sealed class LegacyAcaFileLinkMapping
    {
        public string? OldHref { get; set; }
        public string? NormalizedOldHref { get; set; }
        public string? DownloadFilePath { get; set; }
        public string? LocalPath { get; set; }
        public string? FileName { get; set; }
        public string? DownloadFileName { get; set; }
        public bool? DownloadOk { get; set; }
        public string? DownloadError { get; set; }
        public string? LinkText { get; set; }
    }

    /// <summary>
    /// 類別包匯入結果。
    /// </summary>
    private sealed class LegacyAcaPackageImportResult
    {
        public string SourceListUrl { get; set; } = string.Empty;
        public string CategoryCode { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public int TotalCount { get; set; }
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public List<LegacyAcaArticleImportResult> Items { get; set; } = [];
    }

    /// <summary>
    /// 單篇公告匯入結果。
    /// </summary>
    private sealed class LegacyAcaArticleImportResult
    {
        public string SourceArticleId { get; set; } = string.Empty;
        public string SourceArticleUrl { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string AnnouncementId { get; set; } = string.Empty;
        public string InternalId { get; set; } = string.Empty;
        public string LinkType { get; set; } = string.Empty;
        public string LinkUrl { get; set; } = string.Empty;
        public bool ManualReviewRequired { get; set; }
        public int UploadedFileCount { get; set; }
        public int AttachedFileCount { get; set; }
        public int ReplacedLinkCount { get; set; }
        public int SiteViewCount { get; set; }
        public LegacyImportStatus Status { get; set; } = LegacyImportStatus.Pending;
        public string ErrorMessage { get; set; } = string.Empty;
        public Dictionary<string, string> FileInternalIdMap { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 舊站清單連結類型。
    /// </summary>
    private enum LegacyAcaItemLinkType
    {
        Article,
        DownloadFile,
        ExternalLink,
        DeadLink,
    }

    /// <summary>
    /// 舊站匯入狀態。
    /// </summary>
    private enum LegacyImportStatus
    {
        Pending,
        Success,
        Failed,
    }
    #endregion
}
