using System.Text.Json;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1821._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1821.WEB.SpecHomePage;

/// <summary>
/// 1821 招生首頁設定商業邏輯。
/// </summary>
[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.HomePageSetting)]
public class SpecHomePage1821_Biz(BizDeps bizDeps) : BizService<SpecHomePage1821>(bizDeps)
{
    #region Property
    private static readonly JsonSerializerOptions OptionsJsonSerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
    #endregion

    #region Protected Virtual
    /// <summary>
    /// 儲存前整理首頁 FormModel 並執行 1821 業務檢查。
    /// </summary>
    protected override async Task BeforeUpdate(SpecHomePage1821 data, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(data, act, ct);
        if (act is not (FuncAction.Create or FuncAction.Update)) return;
        NormalizeData(data);
        CheckData(data);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 檢查首頁 Root、Banner、Shortcut 與其 SubDetail。
    /// </summary>
    protected void CheckData(SpecHomePage1821 data)
    {
        CheckHeader(data);
        CheckBanner(data._SpecHomePage1821_Banner);
        CheckShortcut(data._SpecHomePage1821_Shortcut);
        CheckShortcutModuleItems(data._SpecHomePage1821_Shortcut);
    }

    /// <summary>
    /// 正規化首頁 Root、Detail 與 SubDetail 資料。
    /// </summary>
    protected static void NormalizeData(SpecHomePage1821 data)
    {
        data.LinkOptions = NormalizeOptionsJson(data.LinkOptions);
        NormalizeShortcut(data._SpecHomePage1821_Shortcut);
    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查首頁 Root 必填欄位、連結格式與查詢條件。
    /// </summary>
    private void CheckHeader(SpecHomePage1821 header)
    {
        CheckRequired(header.Lang, I18n.GetLabel<SpecHomePage1821>(x => x.Lang));
        CheckRequired(header.Card1Title, I18n.GetLabel<SpecHomePage1821>(x => x.Card1Title));
        CheckRequired(header.Card1PicId, I18n.GetLabel<SpecHomePage1821>(x => x.Card1PicId));
        CheckRequired(header.Card2Title, I18n.GetLabel<SpecHomePage1821>(x => x.Card2Title));
        CheckRequired(header.Card2PicId, I18n.GetLabel<SpecHomePage1821>(x => x.Card2PicId));
        CheckRequired(header.Section4Title, I18n.GetLabel<SpecHomePage1821>(x => x.Section4Title));
        CheckRequired(header.Section4SubTitle, I18n.GetLabel<SpecHomePage1821>(x => x.Section4SubTitle));
        CheckRequired(header.LinkViewMore, I18n.GetLabel<SpecHomePage1821>(x => x.LinkViewMore));
        CheckUrl(header.Card1Link);
        CheckUrl(header.Card2Link);
        CheckUrl(header.LinkViewMore);
        CheckOptionsJson(header.LinkOptions, I18n.GetLabel<SpecHomePage1821>(x => x.LinkOptions));
    }

    /// <summary>
    /// 檢查 Banner 圖片與連結格式。
    /// </summary>
    private void CheckBanner(IEnumerable<SpecHomePage1821_Banner> rows)
    {
        foreach (SpecHomePage1821_Banner row in rows)
        {
            CheckRequired(row.BannerFileId, I18n.GetLabel<SpecHomePage1821_Banner>(x => x.BannerFileId));
            CheckUrl(row.Link);
        }
    }

    /// <summary>
    /// 檢查 Shortcut 主項目與 Link／Module 模式條件。
    /// </summary>
    private void CheckShortcut(IEnumerable<SpecHomePage1821_Shortcut> rows)
    {
        foreach (SpecHomePage1821_Shortcut row in rows)
        {
            CheckRequired(row.IconFileId, I18n.GetLabel<SpecHomePage1821_Shortcut>(x => x.IconFileId));
            CheckRequired(row.Title, I18n.GetLabel<SpecHomePage1821_Shortcut>(x => x.Title));
            CheckShortcutAction(row);
        }
    }

    /// <summary>
    /// 依 Shortcut 模式檢查連結欄位或模組子項。
    /// </summary>
    private void CheckShortcutAction(SpecHomePage1821_Shortcut row)
    {
        if (!row.IsLink)
        {
            if (row._SpecHomePage1821_ShortcutModuleItem.Count == 0)
                Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem>());
            return;
        }
        CheckRequired(row.Link, I18n.GetLabel<SpecHomePage1821_Shortcut>(x => x.Link));
        CheckRequired(row.LinkPicId, I18n.GetLabel<SpecHomePage1821_Shortcut>(x => x.LinkPicId));
        CheckUrl(row.Link);
    }

    /// <summary>
    /// 檢查所有 Shortcut 底下的模組 SubDetail。
    /// </summary>
    private void CheckShortcutModuleItems(IEnumerable<SpecHomePage1821_Shortcut> shortcuts)
    {
        IEnumerable<SpecHomePage1821_ShortcutModuleItem> rows = shortcuts
            .Where(item => !item.IsLink)
            .SelectMany(item => item._SpecHomePage1821_ShortcutModuleItem);
        foreach (SpecHomePage1821_ShortcutModuleItem row in rows) CheckShortcutModuleItem(row);
    }

    /// <summary>
    /// 檢查單一模組子項的標題、條件、連結與模組類型。
    /// </summary>
    private void CheckShortcutModuleItem(SpecHomePage1821_ShortcutModuleItem row)
    {
        CheckRequired(row.Title, I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem>(x => x.Title));
        CheckRequired(row.ModuleOptions, I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem>(x => x.ModuleOptions));
        CheckRequired(row.MoreViewLink, I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem>(x => x.MoreViewLink));
        CheckModuleType(row.ModuleType);
        CheckOptionsJson(row.ModuleOptions, I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem>(x => x.ModuleOptions));
        CheckUrl(row.MoreViewLink);
    }

    /// <summary>
    /// 整理 Shortcut 的 Link／Module 專屬欄位。
    /// </summary>
    private static void NormalizeShortcut(IEnumerable<SpecHomePage1821_Shortcut> rows)
    {
        foreach (SpecHomePage1821_Shortcut row in rows)
            NormalizeShortcutAction(row);
    }

    /// <summary>
    /// 依 Shortcut 模式清理互斥欄位並整理 SubDetail。
    /// </summary>
    private static void NormalizeShortcutAction(SpecHomePage1821_Shortcut row)
    {
        if (row.IsLink)
        {
            row._SpecHomePage1821_ShortcutModuleItem.Clear();
            return;
        }
        row.Link = string.Empty;
        row.LinkPicId = null;
        NormalizeShortcutModuleItems(row._SpecHomePage1821_ShortcutModuleItem);
    }

    /// <summary>
    /// 整理單一 Shortcut 底下的模組 SubDetail 查詢條件。
    /// </summary>
    private static void NormalizeShortcutModuleItems(IEnumerable<SpecHomePage1821_ShortcutModuleItem> rows)
    {
        foreach (SpecHomePage1821_ShortcutModuleItem row in rows)
            row.ModuleOptions = NormalizeOptionsJson(row.ModuleOptions);
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
    /// 將首頁查詢條件轉換為統一 JSON 格式。
    /// </summary>
    private static string SerializeOptions(HomePageOptions options)
    {
        return JsonSerializer.Serialize(options, OptionsJsonSerializerOptions);
    }

    /// <summary>
    /// 檢查字串欄位是否有填寫。
    /// </summary>
    private void CheckRequired(string? value, string fieldName)
    {
        if (value.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, fieldName);
    }

    /// <summary>
    /// 檢查網址是否為 HTTP(S) 或站內相對路徑。
    /// </summary>
    private void CheckUrl(string? url)
    {
        if (!url.IsNullOrEmpty() && !LibData.UrlChecks.IsHttpOrRelativeUrl(url!))
            Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00027, url!);
    }

    /// <summary>
    /// 檢查 Shortcut 模組類型是否為允許的首頁模組。
    /// </summary>
    private void CheckModuleType(SpecHomePageModuleType moduleType)
    {
        if (moduleType is SpecHomePageModuleType.Announcement or SpecHomePageModuleType.FileArchive) return;
        string fieldName = I18n.GetLabel<SpecHomePage1821_ShortcutModuleItem>(x => x.ModuleType);
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00000, $"{fieldName}只允許公告或檔案室。");
    }

    /// <summary>
    /// 檢查查詢條件 JSON 是否可解析。
    /// </summary>
    private void CheckOptionsJson(string options, string fieldName)
    {
        if (options.IsNullOrEmpty() || TryParseOptions(options, out _)) return;
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00035, fieldName);
    }

    /// <summary>
    /// 嘗試將查詢條件 JSON 解析為首頁條件物件。
    /// </summary>
    private static bool TryParseOptions(string options, out HomePageOptions result)
    {
        result = new HomePageOptions();
        if (options.IsNullOrEmpty()) return false;
        try
        {
            result = JsonSerializer.Deserialize<HomePageOptions>(options, OptionsJsonSerializerOptions) ?? new HomePageOptions();
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
    #region Property
    /// <summary>
    /// 類別代碼集合字串。
    /// </summary>
    public string CategoryIds { get; set; } = string.Empty;
    /// <summary>
    /// 標籤代碼集合字串。
    /// </summary>
    public string TagIds { get; set; } = string.Empty;
    #endregion
}
