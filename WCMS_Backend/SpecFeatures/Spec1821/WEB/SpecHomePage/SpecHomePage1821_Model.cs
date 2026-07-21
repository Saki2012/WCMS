using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SpecFeatures.Spec1821._Resx;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.SpecFeatures.Spec1821.WEB.SpecHomePage;

/// <summary>
/// 1821 招生首頁基礎設定
/// </summary>
public class SpecHomePage1821 : HeaderModel
{
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.HomePageId)]
    public string HomePageId { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Lang, DisplayName.Common_Lang)]
    public string Lang { get; set; } = string.Empty;

    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.Section3Title)]
    public string Section3Title { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.Section3SubTitle)]
    public string Section3SubTitle { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.Card1Title)]
    public string Card1Title { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.Card1Link)]
    public string Card1Link { get; set; } = string.Empty;
    [ForeignKey(nameof(Card1PicId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? Card1Pic { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.Card1PicId)]
    public string? Card1PicId { get; set; }

    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.Card2Title)]
    public string Card2Title { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.Card2Link)]
    public string Card2Link { get; set; } = string.Empty;
    [ForeignKey(nameof(Card2PicId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? Card2Pic { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.Card2PicId)]
    public string? Card2PicId { get; set; }

    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.Section4Title)]
    public string Section4Title { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.Section4SubTitle)]
    public string Section4SubTitle { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.LinkOptions)]
    public string LinkOptions { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.LinkViewMore)]
    public string LinkViewMore { get; set; } = string.Empty;

    #region 主子表關聯
    [InverseProperty(nameof(SpecHomePage1821_Banner._SpecHomePage1821))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecHomePage1821_Banner> _SpecHomePage1821_Banner { get; set; } = [];
    [InverseProperty(nameof(SpecHomePage1821_Shortcut._SpecHomePage1821))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecHomePage1821_Shortcut> _SpecHomePage1821_Shortcut { get; set; } = [];
    #endregion
}

/// <summary>
/// Section1 Banner 明細
/// </summary>
public class SpecHomePage1821_Banner : FormDetailModel
{
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.HomePageId)]
    public string HomePageId { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Title)]
    public string Title { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, DisplayName.Common_SubTitle)]
    public string SubTitle { get; set; } = string.Empty;
    [ForeignKey(nameof(BannerFileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? BannerFile { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.BannerFileId)]
    public string? BannerFileId { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.BannerFileDescription)]
    public string BannerFileDescription { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, DisplayName.Common_Url)]
    public string Link { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecHomePage1821 _SpecHomePage1821 { get; set; }
    #endregion
}

/// <summary>
/// Section2 固定快捷按鈕明細，功能串聯暫定
/// </summary>
public class SpecHomePage1821_Shortcut : FormDetailModel
{
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.HomePageId)]
    public string HomePageId { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, SpecModelDisplayName.ShortcutCode)]
    public string ShortcutCode { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Title)]
    public string Title { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_SubTitle)]
    public string SubTitle { get; set; } = string.Empty;
    [ForeignKey(nameof(IconFileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? IconFile { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.IconFileId)]
    public string? IconFileId { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.IconFileDescription)]
    public string IconFileDescription { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, SpecModelDisplayName.ActionType)]
    public string ActionType { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, SpecModelDisplayName.ActionValue)]
    public string ActionValue { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.IsLink)]
    public bool IsLink { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, DisplayName.Common_Url)]
    public string Link { get; set; } = string.Empty;
    [ForeignKey(nameof(LinkPicId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? LinkPic { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.LinkPicId)]
    public string? LinkPicId { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecHomePage1821 _SpecHomePage1821 { get; set; }
    [InverseProperty(nameof(SpecHomePage1821_ShortcutModuleItem._SpecHomePage1821_Shortcut))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecHomePage1821_ShortcutModuleItem> _SpecHomePage1821_ShortcutModuleItem { get; set; } = [];
    #endregion
}

/// <summary>
/// Section2 Tabs 模組子項目
/// </summary>
public class SpecHomePage1821_ShortcutModuleItem : FormDetailModel
{
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.HomePageId)]
    public string HomePageId { get; set; } = string.Empty;
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
    public int ParentRowId { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Title)]
    public string Title { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_SubTitle)]
    public string SubTitle { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.ModuleType)]
    public SpecHomePageModuleType ModuleType { get; set; }
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.ModuleOptions)]
    public string ModuleOptions { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.MoreViewLink)]
    public string MoreViewLink { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey($@"{nameof(HomePageId)},{nameof(ParentRowId)}")]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecHomePage1821_Shortcut _SpecHomePage1821_Shortcut { get; set; }
    #endregion
}
