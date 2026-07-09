using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1821._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using WCMS.SysCore.FeatureDriver.Resx;
namespace WCMS.SpecFeatures.Spec1821.WEB.SpecHomePage;

/// <summary>
/// 1821 招生首頁基礎設定
/// </summary>
public class SpecHomePage1821Model : MasterDataModel
{
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.HomePageId)]
public string HomePageId { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Lang, DisplayName.Common_Lang)]
public string Lang { get; set; } = string.Empty;

[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Section3Title)]
public string Section3Title { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.Section3SubTitle)]
public string Section3SubTitle { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Card1Title)]
public string Card1Title { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.Card1Link)]
public string Card1Link { get; set; } = string.Empty;
[ForeignKey(nameof(Card1PicId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? Card1Pic { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.Card1PicId)]
public string? Card1PicId { get; set; }

[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Card2Title)]
public string Card2Title { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.Card2Link)]
public string Card2Link { get; set; } = string.Empty;
[ForeignKey(nameof(Card2PicId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? Card2Pic { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.Card2PicId)]
public string? Card2PicId { get; set; }

[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Section4Title)]
public string Section4Title { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.Section4SubTitle)]
public string Section4SubTitle { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.LinkOptions)]
public string LinkOptions { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.LinkViewMore)]
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
public class SpecHomePage1821_Banner : DetailRowModel
{
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.HomePageId)]
public string HomePageId { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.RowNo)]
public int RowNo { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Title)]
public string Title { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, DisplayName.Common_SubTitle)]
public string SubTitle { get; set; } = string.Empty;
[ForeignKey(nameof(BannerFileId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? BannerFile { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.BannerFileId)]
public string? BannerFileId { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.BannerFileDescription)]
public string BannerFileDescription { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, DisplayName.Common_Url)]
public string Link { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(HomePageId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecHomePage1821Model _SpecHomePage1821 { get; set; }
    #endregion
}

/// <summary>
/// Section2 固定快捷按鈕明細，功能串聯暫定
/// </summary>
public class SpecHomePage1821_Shortcut : DetailRowModel
{
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.HomePageId)]
public string HomePageId { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.RowNo)]
public int RowNo { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ID, SpecDisplayName.ShortcutCode)]
public string ShortcutCode { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Title)]
public string Title { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_SubTitle)]
public string SubTitle { get; set; } = string.Empty;
[ForeignKey(nameof(IconFileId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? IconFile { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.IconFileId)]
public string? IconFileId { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.IconFileDescription)]
public string IconFileDescription { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.ActionType)]
public string ActionType { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, SpecDisplayName.ActionValue)]
public string ActionValue { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.IsLink)]
public bool IsLink { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, DisplayName.Common_Url)]
public string Link { get; set; } = string.Empty;
[ForeignKey(nameof(LinkPicId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? LinkPic { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.LinkPicId)]
public string? LinkPicId { get; set; }

    #region 主子表關聯
[ForeignKey(nameof(HomePageId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecHomePage1821Model _SpecHomePage1821 { get; set; }
[InverseProperty(nameof(SpecHomePage1821_ShortcutModuleItem._SpecHomePage1821_Shortcut))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecHomePage1821_ShortcutModuleItem> _SpecHomePage1821_ShortcutModuleItem { get; set; } = [];
    #endregion
}

/// <summary>
/// Section2 Tabs 模組子項目
/// </summary>
public class SpecHomePage1821_ShortcutModuleItem : DetailRowModel
{
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.HomePageId)]
public string HomePageId { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
public int ParentRowId { get; set; }
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.RowNo)]
public int RowNo { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Title)]
public string Title { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_SubTitle)]
public string SubTitle { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.ModuleType)]
public SpecHomePageModuleType ModuleType { get; set; }
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.ModuleOptions)]
public string ModuleOptions { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.MoreViewLink)]
public string MoreViewLink { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey($@"{nameof(HomePageId)},{nameof(ParentRowId)}")]
[LibField(ApiFieldMode.ReadOnly)]
public SpecHomePage1821_Shortcut _SpecHomePage1821_Shortcut { get; set; }
    #endregion
}
