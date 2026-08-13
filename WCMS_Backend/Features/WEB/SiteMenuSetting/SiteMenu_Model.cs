using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.WEB.Content;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Metadata;
using BannerModel = WCMS.Features.WEB.Banner.Banner;
namespace WCMS.Features.WEB.SiteMenuSetting;

/// <summary>
/// 網站選單與站台資訊表單模型。
/// </summary>
[LibDesc(DisplayName.SiteMenu_Index)]
public class SiteMenu_Index : HeaderModel
{
    #region Property
    /// <summary>
    /// 站台代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.SiteMenu_SiteIndex)]
    public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// Google Analytics 設定。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.SiteMenu_GoogleAnalytics)]
    public string GoogleAnalytics { get; set; } = string.Empty;
    /// <summary>
    /// 是否啟用站台。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_Enable)]
    public bool Enable { get; set; } = true;
    /// <summary>
    /// 預設語系。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Enum_DefaultLang)]
    public LangCode DefaultLang { get; set; }
    /// <summary>
    /// 支援語系 JSON。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.Enum_SupportLang)]
    public string SupportLangs { get; set; } = string.Empty;
    /// <summary>
    /// 站台多語資訊。
    /// </summary>
    [InverseProperty(nameof(SiteMenu_IndexInfo._SiteMenu_Index))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SiteMenu_IndexInfo> _SiteMenu_IndexInfo { get; set; } = [];
    /// <summary>
    /// 站台選單項目。
    /// </summary>
    [InverseProperty(nameof(SiteMenu_Item._SiteMenu_Index))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SiteMenu_Item> _SiteMenu_Item { get; set; } = [];
    #endregion
}

/// <summary>
/// 站台多語資訊。
/// </summary>
[LibDesc(DisplayName.SiteMenu_IndexInfo)]
public class SiteMenu_IndexInfo : FormDetailModel
{
    #region Property
    /// <summary>
    /// 站台代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.SiteMenu_SiteIndex)]
    public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// 語系。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 網站標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.SiteMenu_SiteTitle)]
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 網站描述。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.SiteMenu_SiteDescription)]
    public string Description { get; set; } = string.Empty;
    /// <summary>
    /// Header 內容。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_SiteHeader)]
    public string SiteHeader { get; set; } = string.Empty;
    /// <summary>
    /// Footer 內容。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_SiteFooter)]
    public string SiteFooter { get; set; } = string.Empty;
    /// <summary>
    /// 網站關鍵字。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.SiteMenu_Keyword)]
    public string Keyword { get; set; } = string.Empty;
    /// <summary>
    /// 語系頁首 Banner。
    /// </summary>
    [ForeignKey(nameof(BannerId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public BannerModel? Banner { get; set; }
    /// <summary>
    /// 語系頁首 Banner ID。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, DisplayName.BannerId)]
    public string? BannerId { get; set; }
    /// <summary>
    /// 所屬站台。
    /// </summary>
    [ForeignKey(nameof(SiteIndex))]
    [LibField(ApiFieldMode.Ignore)]
    public SiteMenu_Index? _SiteMenu_Index { get; set; }
    #endregion
}

/// <summary>
/// 站台選單項目。
/// </summary>
[Index(nameof(SiteIndex), nameof(FullUrl), IsUnique = true, Name = "UX_SiteMenu_Item_NaturalKey")]
[LibDesc(DisplayName.SiteMenu_Item)]
public class SiteMenu_Item : FormDetailModel
{
    #region Property
    /// <summary>
    /// 站台代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.SiteMenu_SiteIndex)]
    public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// 上層選單項目代碼；根節點為 null。
    /// </summary>
    [LibNum(ApiFieldMode.ReadWrite, DisplayName.Common_ParentRowId)]
    public int? ParentRowId { get; set; }
    /// <summary>
    /// 當前頁面網址代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, DisplayName.SiteMenu_ItemSiteUrl)]
    public string ItemSiteUrl { get; set; } = string.Empty;
    /// <summary>
    /// 完整網址，由後端計算。
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.Url, DisplayName.SiteMenu_FullUrl)]
    public string FullUrl { get; set; } = string.Empty;
    /// <summary>
    /// 選單層級，由後端計算。
    /// </summary>
    [LibNum(ApiFieldMode.ReadOnly, DisplayName.SiteMenu_Level)]
    public byte Level { get; set; }
    /// <summary>
    /// 同層顯示順序。
    /// </summary>
    [LibNum(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_DisplayOrder)]
    public byte DisplayOrder { get; set; }
    /// <summary>
    /// 選單項目類型。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_ItemType)]
    public MenuUrlType ItemType { get; set; }
    /// <summary>
    /// 連結開啟方式。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_WindowTarget)]
    public WindowTarget WindowTarget { get; set; }
    /// <summary>
    /// 所屬站台。
    /// </summary>
    [ForeignKey(nameof(SiteIndex))]
    [LibField(ApiFieldMode.Ignore)]
    public SiteMenu_Index? _SiteMenu_Index { get; set; }
    /// <summary>
    /// 選單多語標題。
    /// </summary>
    [InverseProperty(nameof(SiteMenu_Item_Title._SiteMenu_Item))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SiteMenu_Item_Title> _SiteMenu_Item_Title { get; set; } = [];
    /// <summary>
    /// 網址型選單設定。
    /// </summary>
    [InverseProperty(nameof(SiteMenu_Item_Url._SiteMenu_Item))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SiteMenu_Item_Url? _SiteMenu_Item_Url { get; set; }
    /// <summary>
    /// 模組型選單設定。
    /// </summary>
    [InverseProperty(nameof(SiteMenu_Item_Module._SiteMenu_Item))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SiteMenu_Item_Module? _SiteMenu_Item_Module { get; set; }
    #endregion
}

/// <summary>
/// 選單多語標題。
/// </summary>
[LibDesc(DisplayName.SiteMenu_Item_Title)]
public class SiteMenu_Item_Title : FormDetailModel
{
    #region Property
    /// <summary>
    /// 站台代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.SiteMenu_SiteIndex)]
    public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// 所屬選單項目代碼。
    /// </summary>
    [Key]
    [LibNum(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int ItemRowId { get; set; }
    /// <summary>
    /// 語系。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 選單標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.SiteMenu_MenuTitle)]
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 是否顯示於選單。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_IsShowOnMenu)]
    public bool IsShowOnMenu { get; set; }
    /// <summary>
    /// 所屬選單項目。
    /// </summary>
    [ForeignKey($"{nameof(SiteIndex)},{nameof(ItemRowId)}")]
    [LibField(ApiFieldMode.Ignore)]
    public SiteMenu_Item? _SiteMenu_Item { get; set; }
    #endregion
}

/// <summary>
/// 網址型選單設定。
/// </summary>
[LibDesc(DisplayName.SiteMenu_Item_Url)]
public class SiteMenu_Item_Url : DetailModel
{
    #region Property
    /// <summary>
    /// 站台代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.SiteMenu_SiteIndex)]
    public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// 所屬選單項目代碼。
    /// </summary>
    [Key]
    [LibNum(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int ItemRowId { get; set; }
    /// <summary>
    /// 導向類型。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_RedirectType)]
    public MenuUrlType RedirectType { get; set; }
    /// <summary>
    /// 導向網址。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, DisplayName.Common_Url)]
    public string RedirectUrl { get; set; } = string.Empty;
    /// <summary>
    /// 所屬選單項目。
    /// </summary>
    [ForeignKey($"{nameof(SiteIndex)},{nameof(ItemRowId)}")]
    [LibField(ApiFieldMode.Ignore)]
    public SiteMenu_Item? _SiteMenu_Item { get; set; }
    #endregion
}

/// <summary>
/// 模組型選單設定。
/// </summary>
[LibDesc(DisplayName.SiteMenu_Item_Module)]
public class SiteMenu_Item_Module : DetailModel
{
    #region Property
    /// <summary>
    /// 站台代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.SiteMenu_SiteIndex)]
    public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// 所屬選單項目代碼。
    /// </summary>
    [Key]
    [LibNum(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int ItemRowId { get; set; }
    /// <summary>
    /// Banner 關聯資料。
    /// </summary>
    [ForeignKey(nameof(BannerId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public BannerModel? Banner { get; set; }
    /// <summary>
    /// Banner ID。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, DisplayName.BannerId)]
    public string? BannerId { get; set; }
    /// <summary>
    /// 模組頁面類型。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_ItemType)]
    public ModulePageType PageType { get; set; }
    /// <summary>
    /// 功能代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ProgId, DisplayName.SiteMenu_ModuleProgId)]
    public string ModuleProgId { get; set; } = string.Empty;
    /// <summary>
    /// 模組 JSON 參數。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_ModuleOptions)]
    public string ModuleOptions { get; set; } = string.Empty;
    /// <summary>
    /// 所屬選單項目。
    /// </summary>
    [ForeignKey($"{nameof(SiteIndex)},{nameof(ItemRowId)}")]
    [LibField(ApiFieldMode.Ignore)]
    public SiteMenu_Item? _SiteMenu_Item { get; set; }
    #endregion
}

/// <summary>
/// SiteMenu 模組參數模型。
/// </summary>
public class ModuleOptions
{
    /// <summary>
    /// 檔案室參數。
    /// </summary>
    public class FileArchive
    {
        [LibField(ApiFieldMode.ReadWrite)]
        public string Category { get; set; } = string.Empty;
        [LibField(ApiFieldMode.ReadWrite)]
        public string Tag { get; set; } = string.Empty;
        [AllowedEnum(ModuleDisplayStyle.List)]
        [LibField(ApiFieldMode.ReadWrite)]
        public ModuleDisplayStyle Style { get; set; }
    }

    /// <summary>
    /// 相簿參數。
    /// </summary>
    public class Gallery
    {
        [LibField(ApiFieldMode.ReadWrite)]
        public string Category { get; set; } = string.Empty;
        [LibField(ApiFieldMode.ReadWrite)]
        public string Tag { get; set; } = string.Empty;
        [AllowedEnum(ModuleDisplayStyle.List)]
        [LibField(ApiFieldMode.ReadWrite)]
        public ModuleDisplayStyle Style { get; set; }
    }

    /// <summary>
    /// 頁面參數。
    /// </summary>
    public class PageManagement
    {
        [LibField(ApiFieldMode.ReadWrite)]
        public string PageId { get; set; } = string.Empty;
    }

    /// <summary>
    /// 公告參數。
    /// </summary>
    public class Announcement
    {
        [LibField(ApiFieldMode.ReadWrite)]
        public string Category { get; set; } = string.Empty;
        [LibField(ApiFieldMode.ReadWrite)]
        public string Tag { get; set; } = string.Empty;
        [AllowedEnum(ModuleDisplayStyle.List, ModuleDisplayStyle.PictureList, ModuleDisplayStyle.QAList)]
        [LibField(ApiFieldMode.ReadWrite)]
        public ModuleDisplayStyle Style { get; set; }
    }

    /// <summary>
    /// 網路資源參數。
    /// </summary>
    public class WebResource
    {
        [LibField(ApiFieldMode.ReadWrite)]
        public string Category { get; set; } = string.Empty;
        [LibField(ApiFieldMode.ReadWrite)]
        public string Tag { get; set; } = string.Empty;
        [AllowedEnum(ModuleDisplayStyle.List, ModuleDisplayStyle.PictureList, ModuleDisplayStyle.Youtube)]
        [LibField(ApiFieldMode.ReadWrite)]
        public ModuleDisplayStyle Style { get; set; }
    }
}
