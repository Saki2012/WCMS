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
/// 1821招生首頁設定表單
/// </summary>
public class SpecHomePage1821Set : ITSet
{
    [LibDesc(SpecModelDisplayName.SpecHomePage1821)] public SpecHomePage1821Model SpecHomePage1821 { get; set; }
    [LibDesc(SpecModelDisplayName.SpecHomePage1821_Banner)] public List<SpecHomePage1821_Banner> SpecHomePage1821_Banner { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecHomePage1821_Shortcut)] public List<SpecHomePage1821_Shortcut> SpecHomePage1821_Shortcut { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecHomePage1821_ShortcutModuleItem)] public List<SpecHomePage1821_ShortcutModuleItem> SpecHomePage1821_ShortcutModuleItem { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecHomePage1821_FeatureCard)] public List<SpecHomePage1821_FeatureCard> SpecHomePage1821_FeatureCard { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecHomePage1821_RelatedLink)] public List<SpecHomePage1821_RelatedLink> SpecHomePage1821_RelatedLink { get; set; } = [];
}

/// <summary>
/// 1821招生首頁基礎設定
/// </summary>
public class SpecHomePage1821Model : MasterDataModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_Lang), StringLength(SysLengthParam.Lang)] public string Lang { get; set; }
    [LibDesc(SpecModelDisplayName.Section3Title), StringLength(SysLengthParam.Title)] public string Section3Title { get; set; }
    [LibDesc(SpecModelDisplayName.Section3SubTitle), StringLength(SysLengthParam.Title_en)] public string Section3SubTitle { get; set; }
    [LibDesc(SpecModelDisplayName.Card1Title), StringLength(SysLengthParam.Title)] public string Card1Title { get; set; }
    [ForeignKey(nameof(Card1PicId))] public FileManageModel Card1Pic { get; set; }
    [LibDesc(SpecModelDisplayName.Card1PicId), StringLength(SysLengthParam.InternalId)] public string Card1PicId { get; set; }
    [LibDesc(SpecModelDisplayName.Card2Title), StringLength(SysLengthParam.Title)] public string Card2Title { get; set; }
    [ForeignKey(nameof(Card2PicId))] public FileManageModel Card2Pic { get; set; }
    [LibDesc(SpecModelDisplayName.Card2PicId), StringLength(SysLengthParam.InternalId)] public string Card2PicId { get; set; }
    [LibDesc(SpecModelDisplayName.Section4Title), StringLength(SysLengthParam.Title)] public string Section4Title { get; set; }
    [LibDesc(SpecModelDisplayName.Section4SubTitle), StringLength(SysLengthParam.Title_en)] public string Section4SubTitle { get; set; }
    [LibDesc(SpecModelDisplayName.LinkOptions)] public string LinkOptions { get; set; }
    [LibDesc(SpecModelDisplayName.LinkViewMore), StringLength(SysLengthParam.Url)] public string LinkViewMore { get; set; }

    #region 主子表關聯
    [InverseProperty(nameof(SpecHomePage1821_Banner._SpecHomePage1821))] public List<SpecHomePage1821_Banner> _SpecHomePage1821_Banner { get; set; }
    [InverseProperty(nameof(SpecHomePage1821_Shortcut._SpecHomePage1821))] public List<SpecHomePage1821_Shortcut> _SpecHomePage1821_Shortcut { get; set; }
    [InverseProperty(nameof(SpecHomePage1821_FeatureCard._SpecHomePage1821))] public List<SpecHomePage1821_FeatureCard> _SpecHomePage1821_FeatureCard { get; set; }
    [InverseProperty(nameof(SpecHomePage1821_RelatedLink._SpecHomePage1821))] public List<SpecHomePage1821_RelatedLink> _SpecHomePage1821_RelatedLink { get; set; }
    #endregion
}

/// <summary>
/// Section1 Banner 明細
/// </summary>
public class SpecHomePage1821_Banner : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    [LibDesc(SpecModelDisplayName.RowNo)] public int RowNo { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string Title { get; set; }
    [LibDesc(ModelDisplayName.Common_SubTitle), StringLength(SysLengthParam.Title_en)] public string SubTitle { get; set; }
    [ForeignKey(nameof(BannerFileId))] public FileManageModel BannerFile { get; set; }
    [LibDesc(SpecModelDisplayName.BannerFileId), StringLength(SysLengthParam.InternalId)] public string BannerFileId { get; set; }
    [LibDesc(SpecModelDisplayName.BannerFileDescription), StringLength(SysLengthParam.Title_en)] public string BannerFileDescription { get; set; }
    [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string Link { get; set; }
    [LibDesc(ModelDisplayName.Common_IsHide)] public bool IsHide { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1821Model _SpecHomePage1821 { get; set; }
    #endregion
}

/// <summary>
/// Section2 固定快捷按鈕明細；功能串聯暫定
/// </summary>
public class SpecHomePage1821_Shortcut : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    [LibDesc(SpecModelDisplayName.RowNo)] public int RowNo { get; set; }
    [LibDesc(SpecModelDisplayName.ShortcutCode), StringLength(SysLengthParam.ID)] public string ShortcutCode { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string Title { get; set; }
    [LibDesc(ModelDisplayName.Common_SubTitle), StringLength(SysLengthParam.Title)] public string SubTitle { get; set; }
    [ForeignKey(nameof(IconFileId))] public FileManageModel IconFile { get; set; }
    [LibDesc(SpecModelDisplayName.IconFileId), StringLength(SysLengthParam.InternalId)] public string IconFileId { get; set; }
    [LibDesc(SpecModelDisplayName.IconFileDescription), StringLength(SysLengthParam.Title_en)] public string IconFileDescription { get; set; }
    [LibDesc(SpecModelDisplayName.ActionType), StringLength(SysLengthParam.Info)] public string ActionType { get; set; }
    [LibDesc(SpecModelDisplayName.ActionValue), StringLength(SysLengthParam.Memo)] public string ActionValue { get; set; }
    [LibDesc(SpecModelDisplayName.IsLink)] public bool IsLink { get; set; }
    [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string Link { get; set; }
    [ForeignKey(nameof(LinkPicId))] public FileManageModel LinkPic { get; set; }
    [LibDesc(SpecModelDisplayName.LinkPicId), StringLength(SysLengthParam.InternalId)] public string LinkPicId { get; set; }
    [LibDesc(ModelDisplayName.Common_IsHide)] public bool IsHide { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1821Model _SpecHomePage1821 { get; set; }
    [InverseProperty(nameof(SpecHomePage1821_ShortcutModuleItem._SpecHomePage1821_Shortcut))] public List<SpecHomePage1821_ShortcutModuleItem> _SpecHomePage1821_ShortcutModuleItem { get; set; }
    #endregion
}

/// <summary>
/// Section2 Tabs 模組子項目
/// </summary>
public class SpecHomePage1821_ShortcutModuleItem : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_ParentRowId), Key] public int ParentRowId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    [LibDesc(SpecModelDisplayName.RowNo)] public int RowNo { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string Title { get; set; }
    [LibDesc(ModelDisplayName.Common_SubTitle), StringLength(SysLengthParam.Title)] public string SubTitle { get; set; }
    [LibDesc(SpecModelDisplayName.ModuleType)] public SpecHomePageModuleType ModuleType { get; set; }
    [LibDesc(SpecModelDisplayName.ModuleOptions)] public string ModuleOptions { get; set; }
    [LibDesc(SpecModelDisplayName.MoreViewLink), StringLength(SysLengthParam.Url)] public string MoreViewLink { get; set; }
    [LibDesc(ModelDisplayName.Common_IsHide)] public bool IsHide { get; set; }

    #region 主子表關聯
    [ForeignKey($@"{nameof(HomePageId)},{nameof(ParentRowId)}")] public SpecHomePage1821_Shortcut _SpecHomePage1821_Shortcut { get; set; }
    #endregion
}

/// <summary>
/// Section3 招生特色卡片明細
/// </summary>
public class SpecHomePage1821_FeatureCard : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string Title { get; set; }
    [LibDesc(ModelDisplayName.Common_SubTitle), StringLength(SysLengthParam.Title)] public string SubTitle { get; set; }
    [ForeignKey(nameof(PictureId))] public FileManageModel Picture { get; set; }
    [LibDesc(SpecModelDisplayName.PictureId), StringLength(SysLengthParam.InternalId)] public string PictureId { get; set; }
    [LibDesc(SpecModelDisplayName.PictureDescription), StringLength(SysLengthParam.Title_en)] public string PictureDescription { get; set; }
    [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string Link { get; set; }
    [LibDesc(ModelDisplayName.Common_IsHide)] public bool IsHide { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1821Model _SpecHomePage1821 { get; set; }
    #endregion
}

/// <summary>
/// Section4 相關連結明細
/// </summary>
public class SpecHomePage1821_RelatedLink : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string Title { get; set; }
    [ForeignKey(nameof(PictureId))] public FileManageModel Picture { get; set; }
    [LibDesc(SpecModelDisplayName.PictureId), StringLength(SysLengthParam.InternalId)] public string PictureId { get; set; }
    [LibDesc(SpecModelDisplayName.PictureDescription), StringLength(SysLengthParam.Title_en)] public string PictureDescription { get; set; }
    [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string Link { get; set; }
    [LibDesc(ModelDisplayName.Common_IsHide)] public bool IsHide { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1821Model _SpecHomePage1821 { get; set; }
    #endregion
}
