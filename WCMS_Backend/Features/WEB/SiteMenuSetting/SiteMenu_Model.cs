using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.WEB.Banner;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.SiteMenuSetting;

/// <summary>
/// 
/// </summary>
public class SiteMenu_IndexModel: HeaderModel
{
    /// <summary>
    /// 首頁代碼
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.SiteMenu_SiteIndex)]
public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// Goole分析碼
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, DisplayName.SiteMenu_GoogleAnalytics)]
public string GoogleAnalytics { get; set; } = string.Empty;
    /// <summary>
    /// 是否啟用站台
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_Enable)]
public bool Enable { get; set; }= true;
    /// <summary>
    /// 預設語系
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Enum_DefaultLang)]
public LangCode DefaultLang { get; set; }
    /// <summary>
    /// 支援語系
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, DisplayName.Enum_SupportLang)]
public string SupportLangs { get; set; } = string.Empty;

    #region 主子表關聯
[InverseProperty(nameof(SiteMenu_IndexInfoModel._SiteMenu_Index))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SiteMenu_IndexInfoModel> _SiteMenu_IndexInfo { get; set; } = [];
[InverseProperty(nameof(SiteMenu_Item._SiteMenu_Index))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SiteMenu_Item> _SiteMenu_Item { get; set; } = [];
    #endregion
}
/// <summary>
/// 
/// </summary>
public class SiteMenu_IndexInfoModel : DetailModel
{
    /// <summary>
    /// 首頁代碼
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.SiteMenu_SiteIndex)]
public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// 
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
public LangCode Lang { get; set; }
    /// <summary>
    /// 網站標題
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.SiteMenu_SiteTitle)]
public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 網站描述
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, DisplayName.SiteMenu_SiteDescription)]
public string Description { get; set; } = string.Empty;
    /// <summary>
    /// Header
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_SiteHeader)]
public string SiteHeader { get; set; } = string.Empty;
    /// <summary>
    /// Footer
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_SiteFooter)]
public string SiteFooter { get; set; } = string.Empty;
    /// <summary>
    /// 網站關鍵字
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, DisplayName.SiteMenu_Keyword)]
public string Keyword { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(SiteIndex))]
[LibField(ApiFieldMode.ReadOnly)]
public SiteMenu_IndexModel _SiteMenu_Index { get; set; }
    #endregion
}
/// <summary>
/// 
/// </summary>
[Index(nameof(SiteIndex), nameof(FullUrl), IsUnique = true, Name = "UX_SiteMenu_Item_NaturalKey")]
public class SiteMenu_Item: DetailModel
{
    /// <summary>
    /// 主站Url，最主要的會是Empty，新的子站則是https://xxx.com/{SiteIndex}
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.SiteMenu_SiteIndex)]
public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// url主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 上層url外鍵(一定會跟著SiteIndex一起)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_ParentRowId)]
public int ParentRowId { get; set; }
    /// <summary>
    /// 當前頁面Url E.x.:AllNews
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, DisplayName.SiteMenu_ItemSiteUrl)]
public string ItemSiteUrl { get; set; } = string.Empty;
    /// <summary>
    /// 完整的Url，整個系統唯一值，後端賦值處理
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, DisplayName.SiteMenu_FullUrl)]
public string FullUrl { get; set; } = string.Empty;
    /// <summary>
    /// 層級
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_Level)]
public byte Level { get; set; }
    /// <summary>
    /// 順序(Key:同Parent底下做排序)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_DisplayOrder)]
public byte DisplayOrder { get; set; }
    /// <summary>
    /// 屬於function或是url連結?
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_ItemType)]
public MenuUrlType ItemType { get; set; }
    
    #region 主子表關聯
[ForeignKey(nameof(SiteIndex))]
[LibField(ApiFieldMode.ReadOnly)]
public SiteMenu_IndexModel _SiteMenu_Index { get; set; }
[InverseProperty(nameof(SiteMenu_Item_Title._SiteMenu_Index))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SiteMenu_Item_Title> _SiteMenu_Item_Title { get; set; } = [];
[InverseProperty(nameof(SiteMenu_Item_Title._SiteMenu_Index))]
[LibField(ApiFieldMode.ReadOnly)]
public SiteMenu_Item_Url _SiteMenu_Item_Url { get; set; }
[InverseProperty(nameof(SiteMenu_Item_Title._SiteMenu_Index))]
[LibField(ApiFieldMode.ReadOnly)]
public SiteMenu_Item_Module _SiteMenu_Item_Module { get; set; }
    #endregion
}
/// <summary>
/// 
/// </summary>
public class SiteMenu_Item_Title : DetailModel
{
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.SiteMenu_SiteIndex)]
public string SiteIndex { get; set; } = string.Empty;
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int ItemRowId { get; set; }
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
public LangCode Lang { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.SiteMenu_MenuTitle)]
public string Title { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_IsShowOnMenu)]
public bool IsShowOnMenu { get; set; }

    #region 主子表關聯
[ForeignKey($@"{nameof(SiteIndex)},{nameof(ItemRowId)}")]
[LibField(ApiFieldMode.ReadOnly)]
public SiteMenu_Item _SiteMenu_Index { get; set; }
    #endregion
}
/// <summary>
/// 
/// </summary>
public class SiteMenu_Item_Url : DetailModel
{
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.SiteMenu_SiteIndex)]
public string SiteIndex { get; set; } = string.Empty;
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int ItemRowId { get; set; }
[LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_RedirectType)]
public MenuUrlType RedirectType { get; set; } //待考慮，該欄位應該可以移除
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, DisplayName.Common_Url)]
public string RedirectUrl { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey($@"{nameof(SiteIndex)},{nameof(ItemRowId)}")]
[LibField(ApiFieldMode.ReadOnly)]
public SiteMenu_Item _SiteMenu_Index { get; set; }
    #endregion
}
/// <summary>
/// 
/// </summary>
public class SiteMenu_Item_Module : DetailModel
{
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.SiteMenu_SiteIndex)]
public string SiteIndex { get; set; } = string.Empty;
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int ItemRowId { get; set; }
[ForeignKey(nameof(BannerId))]
[LibField(ApiFieldMode.ReadOnly)]
public Banner.Banner? Banner { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ID, DisplayName.BannerId)]
public string? BannerId { get; set; }
[LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_ItemType)]
public ModulePageType PageType { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ProgId, DisplayName.SiteMenu_ModuleProgId)]
public string ModuleProgId { get; set; } = string.Empty; //功能代碼
[LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_ModuleOptions)]
public string ModuleOptions { get; set; } = string.Empty; //動態參數，存Json格式

    #region 主子表關聯
[ForeignKey($@"{nameof(SiteIndex)},{nameof(ItemRowId)}")]
[LibField(ApiFieldMode.ReadOnly)]
public SiteMenu_Item _SiteMenu_Index { get; set; }
    #endregion
}

/// <summary>
/// SiteMenu_Func參數
/// </summary>
public class ModuleOptions
{
    /// <summary>
    /// 檔案室參數
    /// </summary>
    public class FileArchive
    {
        /// <summary>
        /// 類別
        /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public string Category { get; set; } = string.Empty;
        /// <summary>
        /// 標籤
        /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public string Tag { get; set; } = string.Empty;
        /// <summary>
        /// 樣式
        /// </summary>
[AllowedEnum(ModuleDisplayStyle.List)]
[LibField(ApiFieldMode.ReadWrite)]
public ModuleDisplayStyle Style { get; set; }
    }
    /// <summary>
    /// 相簿參數
    /// </summary>
    public class Gallery 
    {
        /// <summary>
        /// 類別
        /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public string Category { get; set; } = string.Empty;
        /// <summary>
        /// 標籤
        /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public string Tag { get; set; } = string.Empty;
        /// <summary>
        /// 樣式
        /// </summary>
[AllowedEnum(ModuleDisplayStyle.List)]
[LibField(ApiFieldMode.ReadWrite)]
public ModuleDisplayStyle Style { get; set; }
    }
    /// <summary>
    /// 頁面參數
    /// </summary>
    public class PageManagement 
    {
        /// <summary>
        /// 對應頁面功能
        /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public string PageId { get; set; } = string.Empty;
    }
    /// <summary>
    /// 公告參數
    /// </summary>
    public class Announcement 
    {
        /// <summary>
        /// 類別
        /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public string Category { get; set; } = string.Empty;
        /// <summary>
        /// 標籤
        /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public string Tag { get; set; } = string.Empty;
        /// <summary>
        /// 樣式
        /// </summary>
[AllowedEnum(ModuleDisplayStyle.List, ModuleDisplayStyle.PictureList,ModuleDisplayStyle.QAList)]
[LibField(ApiFieldMode.ReadWrite)]
public ModuleDisplayStyle Style { get; set; }
    }
    /// <summary>
    /// 網路資源參數
    /// </summary>
    public class WebResource 
    {
        /// <summary>
        /// 類別
        /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public string Category { get; set; } = string.Empty;
        /// <summary>
        /// 標籤
        /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public string Tag { get; set; } = string.Empty;
        /// <summary>
        /// 樣式
        /// </summary>
[AllowedEnum(ModuleDisplayStyle.List, ModuleDisplayStyle.PictureList, ModuleDisplayStyle.Youtube)]
[LibField(ApiFieldMode.ReadWrite)]
public ModuleDisplayStyle Style { get; set; }
    }
}
