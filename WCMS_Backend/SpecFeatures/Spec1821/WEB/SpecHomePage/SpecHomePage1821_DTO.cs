using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1821._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
namespace WCMS.SpecFeatures.Spec1821.WEB.SpecHomePage;

/// <summary>
/// 1821招生首頁設定表單 DTO
/// </summary>
public class SpecHomePage1821Set_DTO : ITSet_DTO
{
    [LibDesc(SpecModelDisplayName.SpecHomePage1821)] public SpecHomePage1821Model_DTO? SpecHomePage1821 { get; set; }
    [LibDesc(SpecModelDisplayName.SpecHomePage1821_Banner)] public List<SpecHomePage1821_Banner_DTO>? SpecHomePage1821_Banner { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecHomePage1821_Shortcut)] public List<SpecHomePage1821_Shortcut_DTO>? SpecHomePage1821_Shortcut { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecHomePage1821_FeatureCard)] public List<SpecHomePage1821_FeatureCard_DTO>? SpecHomePage1821_FeatureCard { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecHomePage1821_RelatedLink)] public List<SpecHomePage1821_RelatedLink_DTO>? SpecHomePage1821_RelatedLink { get; set; } = [];
}

/// <summary>
/// 1821招生首頁基礎設定 DTO
/// </summary>
public class SpecHomePage1821Model_DTO : DTOBasicDataModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string? HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_Lang), StringLength(SysLengthParam.Lang)] public string? Lang { get; set; }
    [LibDesc(SpecModelDisplayName.Section3Title), StringLength(SysLengthParam.Title)] public string? Section3Title { get; set; }
    [LibDesc(SpecModelDisplayName.Section3SubTitle), StringLength(SysLengthParam.Title_en)] public string? Section3SubTitle { get; set; }
    [LibDesc(SpecModelDisplayName.Section4Title), StringLength(SysLengthParam.Title)] public string? Section4Title { get; set; }
    [LibDesc(SpecModelDisplayName.Section4SubTitle), StringLength(SysLengthParam.Title_en)] public string? Section4SubTitle { get; set; }

    #region 主子表關聯
    [InverseProperty(nameof(SpecHomePage1821_Banner_DTO._SpecHomePage1821))] public List<SpecHomePage1821_Banner_DTO>? _SpecHomePage1821_Banner { get; set; }
    [InverseProperty(nameof(SpecHomePage1821_Shortcut_DTO._SpecHomePage1821))] public List<SpecHomePage1821_Shortcut_DTO>? _SpecHomePage1821_Shortcut { get; set; }
    [InverseProperty(nameof(SpecHomePage1821_FeatureCard_DTO._SpecHomePage1821))] public List<SpecHomePage1821_FeatureCard_DTO>? _SpecHomePage1821_FeatureCard { get; set; }
    [InverseProperty(nameof(SpecHomePage1821_RelatedLink_DTO._SpecHomePage1821))] public List<SpecHomePage1821_RelatedLink_DTO>? _SpecHomePage1821_RelatedLink { get; set; }
    #endregion
}

/// <summary>
/// Section1 Banner 明細 DTO
/// </summary>
public class SpecHomePage1821_Banner_DTO : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string? HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string? Title { get; set; }
    [LibDesc(ModelDisplayName.Common_SubTitle), StringLength(SysLengthParam.Title_en)] public string? SubTitle { get; set; }
    [ForeignKey(nameof(BannerFileId))] public FileManageModel_DTO? BannerFile { get; set; }
    [LibDesc(SpecModelDisplayName.BannerFileId), StringLength(SysLengthParam.InternalId)] public string? BannerFileId { get; set; }
    [LibDesc(SpecModelDisplayName.BannerFileDescription), StringLength(SysLengthParam.Title_en)] public string? BannerFileDescription { get; set; }
    [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string? Link { get; set; }
    [LibDesc(ModelDisplayName.Common_IsHide)] public bool? IsHide { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1821Model_DTO? _SpecHomePage1821 { get; set; }
    #endregion
}

/// <summary>
/// Section2 固定快捷按鈕明細 DTO；功能串聯暫定
/// </summary>
public class SpecHomePage1821_Shortcut_DTO : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string? HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    [LibDesc(SpecModelDisplayName.ShortcutCode), StringLength(SysLengthParam.ID)] public string? ShortcutCode { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string? Title { get; set; }
    [LibDesc(ModelDisplayName.Common_SubTitle), StringLength(SysLengthParam.Title)] public string? SubTitle { get; set; }
    [ForeignKey(nameof(IconFileId))] public FileManageModel_DTO? IconFile { get; set; }
    [LibDesc(SpecModelDisplayName.IconFileId), StringLength(SysLengthParam.InternalId)] public string? IconFileId { get; set; }
    [LibDesc(SpecModelDisplayName.IconFileDescription), StringLength(SysLengthParam.Title_en)] public string? IconFileDescription { get; set; }
    [LibDesc(SpecModelDisplayName.ActionType), StringLength(SysLengthParam.Info)] public string? ActionType { get; set; }
    [LibDesc(SpecModelDisplayName.ActionValue), StringLength(SysLengthParam.Memo)] public string? ActionValue { get; set; }
    [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string? Link { get; set; }
    [LibDesc(ModelDisplayName.Common_IsHide)] public bool? IsHide { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1821Model_DTO? _SpecHomePage1821 { get; set; }
    #endregion
}

/// <summary>
/// Section3 招生特色卡片明細 DTO
/// </summary>
public class SpecHomePage1821_FeatureCard_DTO : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string? HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string? Title { get; set; }
    [LibDesc(ModelDisplayName.Common_SubTitle), StringLength(SysLengthParam.Title)] public string? SubTitle { get; set; }
    [ForeignKey(nameof(PictureId))] public FileManageModel_DTO? Picture { get; set; }
    [LibDesc(SpecModelDisplayName.PictureId), StringLength(SysLengthParam.InternalId)] public string? PictureId { get; set; }
    [LibDesc(SpecModelDisplayName.PictureDescription), StringLength(SysLengthParam.Title_en)] public string? PictureDescription { get; set; }
    [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string? Link { get; set; }
    [LibDesc(ModelDisplayName.Common_IsHide)] public bool? IsHide { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1821Model_DTO? _SpecHomePage1821 { get; set; }
    #endregion
}

/// <summary>
/// Section4 相關連結明細 DTO
/// </summary>
public class SpecHomePage1821_RelatedLink_DTO : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string? HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string? Title { get; set; }
    [ForeignKey(nameof(PictureId))] public FileManageModel_DTO? Picture { get; set; }
    [LibDesc(SpecModelDisplayName.PictureId), StringLength(SysLengthParam.InternalId)] public string? PictureId { get; set; }
    [LibDesc(SpecModelDisplayName.PictureDescription), StringLength(SysLengthParam.Title_en)] public string? PictureDescription { get; set; }
    [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string? Link { get; set; }
    [LibDesc(ModelDisplayName.Common_IsHide)] public bool? IsHide { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1821Model_DTO? _SpecHomePage1821 { get; set; }
    #endregion
}
