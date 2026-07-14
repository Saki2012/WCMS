using System.Text.Json;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1821._Resx;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.SpecFeatures.Spec1821.WEB.SpecHomePage;

/// <summary>
/// 1821招生首頁設定商業邏輯
/// </summary>
[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.HomePageSetting)]
public class SpecHomePage1821_Biz(BizDeps bizDeps) : BizService<SpecHomePage1821Model>(bizDeps), IBizService<SpecHomePage1821Model>
{
    #region Property
    private static readonly JsonSerializerOptions OptionsJsonSerializerOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    #endregion

    #region Protected Virtual
    /// <summary>
    /// 儲存前整理首頁設定資料並執行 1821 業務檢查。
    /// </summary>
    protected override async Task BeforeUpdate(SpecHomePage1821Model set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                NormalizeData(set);
                CheckData(set);
                break;
        }
    }
    #endregion


    #region Protected
    /// <summary>
    /// 檢查首頁設定 Header、Banner、Shortcut 與 ModuleItem 資料。
    /// </summary>
    protected void CheckData(SpecHomePage1821Model set)
    {
        CheckHeader(set.SpecHomePage1821);
        CheckBanner(set.SpecHomePage1821_Banner);
        CheckShortcut(set.SpecHomePage1821_Shortcut, set.SpecHomePage1821_ShortcutModuleItem);
        CheckShortcutModuleItem(set.SpecHomePage1821_ShortcutModuleItem);
    }

    /// <summary>
    /// 整理首頁設定明細集合與 JSON 條件資料。
    /// </summary>
    protected static void NormalizeData(SpecHomePage1821Model set)
    {
        set.SpecHomePage1821_Banner ??= [];
        set.SpecHomePage1821_Shortcut ??= [];
        set.SpecHomePage1821_ShortcutModuleItem ??= [];
        if (set.SpecHomePage1821 != null) set.SpecHomePage1821.LinkOptions = NormalizeOptionsJson(set.SpecHomePage1821.LinkOptions);
        NormalizeBanner(set.SpecHomePage1821_Banner);
        NormalizeShortcut(set.SpecHomePage1821_Shortcut);
        NormalizeShortcutModuleItem(set.SpecHomePage1821_ShortcutModuleItem, set.SpecHomePage1821_Shortcut);
    }

    #endregion

    #region Private
    /// <summary>
    /// 檢查首頁設定 Header 必填欄位、連結格式與相關連結條件。
    /// </summary>
    private void CheckHeader(SpecHomePage1821Model header)
    {
        if (header == null)
        {
            Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.SpecHomePage1821));
            return;
        }
        CheckRequired(header.Lang, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.Lang));
        CheckRequired(header.Card1Title, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.Card1Title));
        CheckRequired(header.Card1PicId, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.Card1PicId));
        CheckRequired(header.Card2Title, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.Card2Title));
        CheckRequired(header.Card2PicId, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.Card2PicId));
        CheckRequired(header.Section4Title, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.Section4Title));
        CheckRequired(header.Section4SubTitle, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.Section4SubTitle));
        CheckRequired(header.LinkViewMore, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.LinkViewMore));
        CheckUrl(header.Card1Link);
        CheckUrl(header.Card2Link);
        CheckUrl(header.LinkViewMore);
        CheckOptionsJson(header.LinkOptions, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.LinkOptions));
    }
    /// <summary>
    /// 檢查 Banner 圖片與連結格式。
    /// </summary>
    private void CheckBanner(List<SpecHomePage1821_Banner> rows)
    {
        foreach (var row in rows)
        {
            CheckRequired(row.BannerFileId, I18n.GetLabel<SpecHomePage1821_Banner_DTO>(x => x.BannerFileId));
            CheckUrl(row.Link);
        }
    }
    /// <summary>
    /// 檢查 Shortcut 主項目與連結 / 模組資料的條件關係。
    /// </summary>
    private void CheckShortcut(List<SpecHomePage1821_Shortcut> rows, List<SpecHomePage1821_ShortcutModuleItem> moduleItems)
    {
        foreach (var row in rows)
        {
            CheckRequired(row.IconFileId, I18n.GetLabel<SpecHomePage1821_Shortcut_DTO>(x => x.IconFileId));
            CheckRequired(row.Title, I18n.GetLabel<SpecHomePage1821_Shortcut_DTO>(x => x.Title));
            if (row.IsLink)
            {
                CheckRequired(row.Link, I18n.GetLabel<SpecHomePage1821_Shortcut_DTO>(x => x.Link));
                CheckRequired(row.LinkPicId, I18n.GetLabel<SpecHomePage1821_Shortcut_DTO>(x => x.LinkPicId));
                CheckUrl(row.Link);
                continue;
            }
            bool hasVisibleModuleItem = moduleItems.Any(item => item.ParentRowId == row.RowId);
            if (!hasVisibleModuleItem) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<SpecHomePage1821Model_DTO>(x => x.SpecHomePage1821_ShortcutModuleItem));
        }
    }
    /// <summary>
    /// 檢查 Shortcut 模組項目的標題、條件、查看更多連結與模組類型。
    /// </summary>
    private void CheckShortcutModuleItem(List<SpecHomePage1821_ShortcutModuleItem> rows)
    {
        foreach (var row in rows)
        {
            CheckRequired(row.Title, I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.Title));
            CheckRequired(row.ModuleOptions, I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.ModuleOptions));
            CheckRequired(row.MoreViewLink, I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.MoreViewLink));
            CheckModuleType(row.ModuleType);
            CheckOptionsJson(row.ModuleOptions, I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.ModuleOptions));
            CheckUrl(row.MoreViewLink);
        }
    }
    /// <summary>
    /// 整理 Banner 明細排序預設值。
    /// </summary>
    private static void NormalizeBanner(List<SpecHomePage1821_Banner> rows)
    {
        for (int i = 0; i < rows.Count; i++)
        {
            if (rows[i].RowNo <= 0) rows[i].RowNo = i + 1;
        }
    }
    /// <summary>
    /// 整理 Shortcut 明細排序與非連結模式欄位。
    /// </summary>
    private static void NormalizeShortcut(List<SpecHomePage1821_Shortcut> rows)
    {
        for (int i = 0; i < rows.Count; i++)
        {
            if (rows[i].RowNo <= 0) rows[i].RowNo = i + 1;
            if (rows[i].IsLink) continue;

        }
    }
    /// <summary>
    /// 整理 Shortcut 模組項目排序、移除連結 Shortcut 的子項並正規化查詢條件。
    /// </summary>
    private static void NormalizeShortcutModuleItem(List<SpecHomePage1821_ShortcutModuleItem> rows, List<SpecHomePage1821_Shortcut> shortcuts)
    {
        HashSet<int> linkParentRowIds = shortcuts.Where(item => item.IsLink).Select(item => item.RowId).ToHashSet();
        rows.RemoveAll(item => linkParentRowIds.Contains(item.ParentRowId));
        Dictionary<int, int> rowIndexByParent = [];
        foreach (var row in rows)
        {
            row.ModuleOptions = NormalizeOptionsJson(row.ModuleOptions);
            if (!rowIndexByParent.ContainsKey(row.ParentRowId)) rowIndexByParent[row.ParentRowId] = 0;
            rowIndexByParent[row.ParentRowId]++;
            if (row.RowNo <= 0) row.RowNo = rowIndexByParent[row.ParentRowId];
        }
    }
    /// <summary>
    /// 正規化首頁查詢條件 JSON 的類別與標籤欄位。
    /// </summary>
    private static string NormalizeOptionsJson(string options)
    {
        if (options.IsNullOrEmpty()) return SerializeOptions(new HomePageOptions());
        if (!TryParseOptions(options, out HomePageOptions parsed)) return options;
        parsed.CategoryIds = parsed.CategoryIds.Remerge(",");
        parsed.TagIds = parsed.TagIds.Remerge(",");
        return SerializeOptions(parsed);
    }
    /// <summary>
    /// 將首頁查詢條件轉換為統一格式的 JSON 字串。
    /// </summary>
    private static string SerializeOptions(HomePageOptions options)
    {
        return JsonSerializer.Serialize(options, OptionsJsonSerializerOptions);
    }
    /// <summary>
    /// 檢查字串欄位是否有填寫。
    /// </summary>
    private void CheckRequired(string value, string fieldName)
    {
        if (value.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, fieldName);
    }
    /// <summary>
    /// 檢查網址是否為 HTTP(S) 或站內相對路徑。
    /// </summary>
    private void CheckUrl(string url)
    {
        if (!url.IsNullOrEmpty() && !LibData.UrlChecks.IsHttpOrRelativeUrl(url)) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00027, url);
    }
    /// <summary>
    /// 檢查 Shortcut 模組類型是否為允許的首頁模組。
    /// </summary>
    private void CheckModuleType(SpecHomePageModuleType moduleType)
    {
        if (moduleType is SpecHomePageModuleType.Announcement or SpecHomePageModuleType.FileArchive) return;
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00000, $"{I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem_DTO>(x => x.ModuleType)}只允許公告或檔案室。");
    }
    /// <summary>
    /// 檢查查詢條件 JSON 是否可被解析。
    /// </summary>
    private void CheckOptionsJson(string options, string fieldName)
    {
        if (options.IsNullOrEmpty()) return;
        if (TryParseOptions(options, out _)) return;
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00035, fieldName);
    }
    /// <summary>
    /// 嘗試將查詢條件 JSON 解析為首頁條件物件。
    /// </summary>
    private static bool TryParseOptions(string options, out HomePageOptions result)
    {
        result = new();
        if (options.IsNullOrEmpty()) return false;

        try
        {
            result = JsonSerializer.Deserialize<HomePageOptions>(options, OptionsJsonSerializerOptions) ?? new();
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
    #endregion
}

/// <summary>
/// 首頁模組與相關連結的查詢條件。
/// </summary>
internal sealed class HomePageOptions
{
    /// <summary>
    /// 類別代碼集合字串。
    /// </summary>
    public string CategoryIds { get; set; } = string.Empty;
    /// <summary>
    /// 標籤代碼集合字串。
    /// </summary>
    public string TagIds { get; set; } = string.Empty;
}
