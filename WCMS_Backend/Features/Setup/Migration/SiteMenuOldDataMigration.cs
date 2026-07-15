using Newtonsoft.Json;
using System.Data;
using System.Text.RegularExpressions;
using WCMS.Features.WEB.Content;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using PageManagementModel = WCMS.Features.WEB.PageManagement.PageManagement;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 將舊站 SiteInfo 與 Menu 資料轉為標準站台選單，並排除 Spec 模組。
/// </summary>
internal static class SiteMenuOldDataMigration
{
    #region Public
    /// <summary>
    /// 轉換並建立舊站站台與選單資料。
    /// </summary>
    public static async Task MigrateAsync(IBizService<SiteMenu_IndexModel> service, IBizService<PageManagementModel> pageService, CancellationToken ct)
    {
        SiteMenu_IndexModel data = await ConvertToModelAsync(pageService, ct);
        await service.BizInitCreateDatasAsync([data], ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊站站台與選單資料轉為目前資料模型。
    /// </summary>
    private static async Task<SiteMenu_IndexModel> ConvertToModelAsync(IBizService<PageManagementModel> pageService, CancellationToken ct)
    {
        DataSet dataSet = GetMigrationData();
        SiteMenu_IndexModel result = new();
        SetSiteIndex(result, dataSet.Tables["SiteInfo"]!, dataSet.Tables["SiteInfo_Lang"]!);
        await SetSideMenuAsync(result, dataSet.Tables["Menu"]!, dataSet.Tables["Menu_Lang"]!, pageService, ct);
        SetParentId(result._SiteMenu_Item, dataSet.Tables["Menu"]!);
        SetFullUrl(result._SiteMenu_Item);
        return result;
    }
    /// <summary>
    /// 讀取舊站站台與選單資料。
    /// </summary>
    private static DataSet GetMigrationData()
    {
        Dictionary<string, string> sqls = new()
        {
            { "SiteInfo", "SELECT * FROM SiteInfo" },
            { "SiteInfo_Lang", "SELECT * FROM SiteInfo_Lang" },
            { "Menu", "SELECT * FROM Menu" },
            { "Menu_Lang", "SELECT * FROM Menu_Lang" },
        };
        return OldDataMigrationSource.GetOldData(sqls);
    }
    /// <summary>
    /// 轉換舊站站台基本資訊。
    /// </summary>
    private static void SetSiteIndex(SiteMenu_IndexModel data, DataTable siteInfo, DataTable siteInfoLang)
    {
        DataRow? row = siteInfo.Select().FirstOrDefault();
        if (row == null) return;
        data.SiteIndex = row["SiteID"].ToString() ?? string.Empty;
        data.GoogleAnalytics = row["GoogleAnalysis"].ToString() ?? string.Empty;
        int rowId = 1;
        foreach (DataRow langRow in siteInfoLang.Rows)
            data._SiteMenu_IndexInfo.Add(BuildSiteIndexInfo(data.SiteIndex, rowId++, row, langRow));
    }
    /// <summary>
    /// 建立舊站站台多語資料。
    /// </summary>
    private static SiteMenu_IndexInfoModel BuildSiteIndexInfo(string siteIndex, int rowId, DataRow siteInfo, DataRow langRow)
    {
        _ = LangCodeExt.TryParse(langRow["Lang"].ToString(), out LangCode lang);
        return new SiteMenu_IndexInfoModel
        {
            SiteIndex = siteIndex,
            RowId = rowId,
            Lang = lang,
            Title = langRow["SiteTitle"].ToString() ?? string.Empty,
            SiteHeader = langRow["SiteHeader"].ToString() ?? string.Empty,
            SiteFooter = langRow["SiteFooter"].ToString() ?? string.Empty,
            Description = siteInfo["SiteDescription"].ToString() ?? string.Empty,
            Keyword = siteInfo["SiteKeyword"].ToString() ?? string.Empty,
        };
    }
    /// <summary>
    /// 轉換舊站選單資料。
    /// </summary>
    private static async Task SetSideMenuAsync(SiteMenu_IndexModel data, DataTable menu, DataTable menuLang, IBizService<PageManagementModel> pageService, CancellationToken ct)
    {
        int rowId = 1;
        foreach (DataRow row in menu.Select().Skip(1))
        {
            string type = row["Type"].ToString() ?? string.Empty;
            if (!type.In("url", "module") || IsSpecMenu(type, row)) continue;
            SiteMenu_Item item = BuildMenuItem(data.SiteIndex, rowId++, row);
            AddMenuTitles(item, menuLang.Select($"Sn={row["Sn"]}"));
            await SetMenuTargetAsync(item, type, row, menuLang, pageService, ct);
            data._SiteMenu_Item.Add(item);
        }
    }
    /// <summary>
    /// 判斷選單是否連向 Spec 模組。
    /// </summary>
    private static bool IsSpecMenu(string type, DataRow row)
    {
        return type == "module" && OldDataMigrationSource.IsSpecModule(row["ContentA_Module"].ToString());
    }
    /// <summary>
    /// 建立舊站選單項目。
    /// </summary>
    private static SiteMenu_Item BuildMenuItem(string siteIndex, int rowId, DataRow row)
    {
        string[] levels = (row["MenuLevel"].ToString() ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries);
        return new SiteMenu_Item
        {
            SiteIndex = siteIndex,
            RowId = rowId,
            ItemSiteUrl = row["Menu_ID"].ToString() ?? string.Empty,
            Level = levels.Length.ToByte(),
            DisplayOrder = levels.LastOrDefault().ToByte(),
        };
    }
    /// <summary>
    /// 加入舊站選單多語標題。
    /// </summary>
    private static void AddMenuTitles(SiteMenu_Item item, DataRow[] rows)
    {
        int rowId = 1;
        foreach (DataRow row in rows)
        {
            item.WindowTarget = row["URL_Open"].ToByte() == 1 ? WindowTarget.Self : WindowTarget.Blank;
            _ = LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
            item._SiteMenu_Item_Title.Add(BuildMenuTitle(item, rowId++, lang, row));
        }
    }
    /// <summary>
    /// 建立單筆選單多語標題。
    /// </summary>
    private static SiteMenu_Item_Title BuildMenuTitle(SiteMenu_Item item, int rowId, LangCode lang, DataRow row)
    {
        return new SiteMenu_Item_Title
        {
            SiteIndex = item.SiteIndex,
            ItemRowId = item.RowId,
            RowId = rowId,
            Lang = lang,
            Title = row["Title"].ToString() ?? string.Empty,
            IsShowOnMenu = Convert.ToBoolean(row["MenuDisplay"]),
        };
    }
    /// <summary>
    /// 建立舊站網址或模組設定。
    /// </summary>
    private static async Task SetMenuTargetAsync(SiteMenu_Item item, string type, DataRow row, DataTable menuLang, IBizService<PageManagementModel> pageService, CancellationToken ct)
    {
        if (type == "url")
        {
            item.ItemType = MenuUrlType.Url;
            item._SiteMenu_Item_Url = BuildMenuUrl(item, menuLang.Select($"Sn={row["Sn"]}"));
            return;
        }
        item.ItemType = MenuUrlType.Module;
        item._SiteMenu_Item_Module = await BuildMenuModuleAsync(item, row, pageService, ct);
    }
    /// <summary>
    /// 建立舊站網址設定。
    /// </summary>
    private static SiteMenu_Item_Url BuildMenuUrl(SiteMenu_Item item, DataRow[] rows)
    {
        SiteMenu_Item_Url result = new() { SiteIndex = item.SiteIndex, ItemRowId = item.RowId };
        foreach (DataRow row in rows) ApplyMenuUrl(result, row["Url"].ToString() ?? string.Empty);
        return result;
    }
    /// <summary>
    /// 套用舊站網址資料。
    /// </summary>
    private static void ApplyMenuUrl(SiteMenu_Item_Url target, string url)
    {
        if (!url.StartsWith("/Front", StringComparison.OrdinalIgnoreCase))
        {
            target.RedirectType = MenuUrlType.Url;
            target.RedirectUrl = url;
            return;
        }
        target.RedirectType = MenuUrlType.Module;
        string noFront = Regex.Replace(url, @"^/Front(?=/)", string.Empty, RegexOptions.IgnoreCase);
        target.RedirectUrl = Regex.Replace(noFront, @"/[^/]*\.(?:aspx|html)(?:\?.*)?$", string.Empty, RegexOptions.IgnoreCase).TrimEnd('/');
    }
    /// <summary>
    /// 建立舊站模組設定。
    /// </summary>
    private static async Task<SiteMenu_Item_Module> BuildMenuModuleAsync(SiteMenu_Item item, DataRow row, IBizService<PageManagementModel> pageService, CancellationToken ct)
    {
        string module = row["ContentA_Module"].ToString() ?? string.Empty;
        return new SiteMenu_Item_Module
        {
            SiteIndex = item.SiteIndex,
            ItemRowId = item.RowId,
            BannerId = row["Banner"].ToString(),
            ModuleProgId = ResolveProgId(module),
            ModuleOptions = await BuildModuleOptionsAsync(module, row, pageService, ct),
        };
    }
    /// <summary>
    /// 依舊站層級資料設定父選單 RowId。
    /// </summary>
    private static void SetParentId(List<SiteMenu_Item> items, DataTable menu)
    {
        Dictionary<string, string> levels = [];
        foreach (DataRow row in menu.Rows)
            levels[row["Menu_ID"].ToString() ?? string.Empty] = row["MenuLevel"].ToString() ?? string.Empty;
        foreach (SiteMenu_Item item in items) SetParentId(item, items, levels);
    }
    /// <summary>
    /// 設定單筆選單的父選單 RowId。
    /// </summary>
    private static void SetParentId(SiteMenu_Item item, List<SiteMenu_Item> items, IReadOnlyDictionary<string, string> levels)
    {
        if (!levels.TryGetValue(item.ItemSiteUrl, out string? level)) return;
        string[] parts = level.Split(',', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length <= 1) return;
        string parentLevel = string.Join(",", parts.Take(parts.Length - 1));
        string? parentUrl = levels.FirstOrDefault(pair => pair.Value == parentLevel).Key;
        SiteMenu_Item? parent = items.FirstOrDefault(value => value.ItemSiteUrl == parentUrl);
        if (parent != null) item.ParentRowId = parent.RowId;
    }
    /// <summary>
    /// 依層級重算舊站選單完整網址。
    /// </summary>
    private static void SetFullUrl(List<SiteMenu_Item> source)
    {
        List<SiteMenu_Item> items = source.OrderBy(item => item.Level).ThenBy(item => item.DisplayOrder).ToList();
        foreach (SiteMenu_Item item in items)
        {
            SiteMenu_Item? parent = items.FirstOrDefault(value => value.SiteIndex == item.SiteIndex && value.RowId == item.ParentRowId);
            item.FullUrl = "/" + LibData.Merge("/", false, parent?.FullUrl?.Trim('/') ?? string.Empty, item.ItemSiteUrl.Trim('/'));
        }
    }
    /// <summary>
    /// 將舊站模組名稱轉為目前標準 ProgId。
    /// </summary>
    private static string ResolveProgId(string module)
    {
        return module switch
        {
            "page" => "PageManagement",
            "gallery" => "Gallery",
            "news" => "Announcement",
            "archive" => "FileArchive",
            "webresource" => "WebResource",
            _ => module,
        };
    }
    /// <summary>
    /// 建立舊站模組選項 JSON。
    /// </summary>
    private static async Task<string> BuildModuleOptionsAsync(string module, DataRow row, IBizService<PageManagementModel> pageService, CancellationToken ct)
    {
        return module switch
        {
            "page" => await BuildPageOptionsAsync(row, pageService, ct),
            "gallery" => BuildGalleryOptions(row),
            "news" => BuildAnnouncementOptions(row),
            "archive" => BuildFileArchiveOptions(row),
            "webresource" => BuildWebResourceOptions(row),
            _ => module,
        };
    }
    /// <summary>
    /// 建立頁面維護模組選項。
    /// </summary>
    private static async Task<string> BuildPageOptionsAsync(DataRow row, IBizService<PageManagementModel> pageService, CancellationToken ct)
    {
        string pageId = row["ContentA_Page"].ToString();
        IList<PageManagementModel> data = await pageService.BizQueryListAsync(
            [nameof(PageManagementModel.InternalId)],
            $"{nameof(PageManagementModel.PageId)} = '{EscapeSqlValue(pageId)}'",
            [], [], 0, 0, ct);
        ModuleOptions.PageManagement option = new() { PageId = data.FirstOrDefault()?.InternalId ?? string.Empty };
        return JsonConvert.SerializeObject(option, Formatting.None);
    }
    /// <summary>
    /// 建立相簿模組選項。
    /// </summary>
    private static string BuildGalleryOptions(DataRow row)
    {
        ModuleOptions.Gallery option = new()
        {
            Category = row["ContentA_Category"].ToString().Remerge(","),
            Tag = row["ContentA_Tag"].ToString().Remerge(","),
        };
        if (row["ContentA_Template"].ToString() == "gallery_template1") option.Style = ModuleDisplayStyle.List;
        if (row["ContentA_Template"].ToString() == "gallery_template2") option.Style = ModuleDisplayStyle.Waterfall;
        return JsonConvert.SerializeObject(option, Formatting.None);
    }
    /// <summary>
    /// 建立公告模組選項。
    /// </summary>
    private static string BuildAnnouncementOptions(DataRow row)
    {
        ModuleOptions.Announcement option = new()
        {
            Category = row["ContentA_Category"].ToString().Remerge(","),
            Tag = row["ContentA_Tag"].ToString().Remerge(","),
        };
        if (row["ContentA_Template"].ToString() == "news_template1") option.Style = ModuleDisplayStyle.List;
        if (row["ContentA_Template"].ToString() == "news_template2") option.Style = ModuleDisplayStyle.PictureList;
        if (row["ContentA_Template"].ToString() == "news_template3") option.Style = ModuleDisplayStyle.QAList;
        return JsonConvert.SerializeObject(option, Formatting.None);
    }
    /// <summary>
    /// 建立檔案室模組選項。
    /// </summary>
    private static string BuildFileArchiveOptions(DataRow row)
    {
        ModuleOptions.FileArchive option = new()
        {
            Category = row["ContentA_Category"].ToString().Remerge(","),
            Tag = row["ContentA_Tag"].ToString().Remerge(","),
        };
        if (row["ContentA_Template"].ToString() == "archive_template1") option.Style = ModuleDisplayStyle.List;
        if (row["ContentA_Template"].ToString() == "archive_template2") option.Style = ModuleDisplayStyle.Expand_Category;
        if (row["ContentA_Template"].ToString() == "archive_template3") option.Style = ModuleDisplayStyle.Expand_Tag;
        return JsonConvert.SerializeObject(option, Formatting.None);
    }
    /// <summary>
    /// 建立網路資源模組選項。
    /// </summary>
    private static string BuildWebResourceOptions(DataRow row)
    {
        ModuleOptions.WebResource option = new()
        {
            Category = row["ContentA_Category"].ToString().Remerge(","),
            Tag = row["ContentA_Tag"].ToString().Remerge(","),
        };
        if (row["ContentA_Template"].ToString() == "webresource_template1") option.Style = ModuleDisplayStyle.List;
        if (row["ContentA_Template"].ToString() == "webresource_template2") option.Style = ModuleDisplayStyle.PictureList;
        if (row["ContentA_Template"].ToString() == "webresource_template3") option.Style = ModuleDisplayStyle.Youtube;
        return JsonConvert.SerializeObject(option, Formatting.None);
    }
    /// <summary>
    /// 跳脫舊資料查詢使用的 SQL 字串值。
    /// </summary>
    private static string EscapeSqlValue(string? value)
    {
        return (value ?? string.Empty).Replace("'", "''", StringComparison.Ordinal);
    }
    #endregion
}
