using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1820._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
namespace WCMS.SpecFeatures.Spec1820.WEB.SpecHomePage;



/// <summary>
/// 1820首頁設定表單
/// </summary>
public class SpecHomePage1820Set_DTO : ITSet_DTO
{
    [LibDesc(SpecModelDisplayName.SpecHomePage1820)] public SpecHomePage1820Model_DTO? SpecHomePage1820 { get; set; }
    [LibDesc(SpecModelDisplayName.SpecHomePage1820_BannerMedia)] public List<SpecHomePage1820_BannerMedia_DTO>? SpecHomePage1820_BannerMedia { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecHomePage1820_Detail)] public List<SpecHomePage1820_Detail_DTO>? SpecHomePage1820_Detail { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecHomePage1820_Marquee)] public List<SpecHomePage1820_Marquee_DTO>? SpecHomePage1820_Marquee { get; set; } = [];
    [LibDesc(SpecModelDisplayName.SpecHomePage1820_Resource)] public List<SpecHomePage1820_Resource_DTO>? SpecHomePage1820_Resource { get; set; } = [];
}
/// <summary>
/// 1820首頁基礎資料
/// </summary>
public class SpecHomePage1820Model_DTO : DTOBasicDataModel
{

    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string? HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_Lang), StringLength(SysLengthParam.Lang)] public string? Lang { get; set; }

    #region Section1 欄位
    [LibDesc(SpecModelDisplayName.Section1Title_L), StringLength(SysLengthParam.Title)] public string? Section1Title_L { get; set; }
    [LibDesc(SpecModelDisplayName.Section1Title_M), StringLength(SysLengthParam.Title)] public string? Section1Title_M { get; set; }
    [LibDesc(SpecModelDisplayName.Section1Title_R), StringLength(SysLengthParam.Title)] public string? Section1Title_R { get; set; }
    #endregion

    #region Section2 欄位
    [LibDesc(SpecModelDisplayName.HeroText)] public string? HeroText { get; set; }
    [LibDesc(SpecModelDisplayName.HeroTextUrl), StringLength(SysLengthParam.Url)] public string? HeroText_ViewMoreLink { get; set; }
    #endregion

    #region Section3 欄位
    [LibDesc(SpecModelDisplayName.AnnouncementTitle), StringLength(SysLengthParam.Title)] public string? AnnouncementTitle { get; set; }
    [LibDesc(SpecModelDisplayName.AnnouncementSubTitle), StringLength(SysLengthParam.Title_en)] public string? AnnouncementSubTitle { get; set; }
    [LibDesc(SpecModelDisplayName.AnnouncementCategoryIds), StringLength(SysLengthParam.Memo)] public string? AnnouncementCategoryIds { get; set; }
    [LibDesc(SpecModelDisplayName.Announcement_ViewMoreLink), StringLength(SysLengthParam.Url)] public string? Announcement_ViewMoreLink { get; set; }
    #endregion

    // Section4、Section5因為有多筆，所以放在子表

    #region Section6 欄位
    [LibDesc(SpecModelDisplayName.Resource_Title), StringLength(SysLengthParam.Title_en)] public string? Resource_Title { get; set; }
    [LibDesc(SpecModelDisplayName.Resource_SubTitle), StringLength(SysLengthParam.Title_en)] public string? Resource_SubTitle { get; set; }
    #endregion

    #region 主子表關聯
    [InverseProperty(nameof(SpecHomePage1820_BannerMedia_DTO._SpecHomePage1820))] public List<SpecHomePage1820_BannerMedia_DTO>? _SpecHomePage1820_BannerMedia { get; set; }
    [InverseProperty(nameof(SpecHomePage1820_Detail_DTO._SpecHomePage1820))] public List<SpecHomePage1820_Detail_DTO>? _SpecHomePage1820_Detail { get; set; }
    [InverseProperty(nameof(SpecHomePage1820_Marquee_DTO._SpecHomePage1820))] public List<SpecHomePage1820_Marquee_DTO>? _SpecHomePage1820_Marquee { get; set; }
    [InverseProperty(nameof(SpecHomePage1820_Resource_DTO._SpecHomePage1820))] public List<SpecHomePage1820_Resource_DTO>? _SpecHomePage1820_Resource { get; set; }
    #endregion
}
/// <summary>
/// 1820首頁Banner資源設定
/// </summary>
public class SpecHomePage1820_BannerMedia_DTO : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string? HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    [ForeignKey(nameof(BannerFileId))] public FileManageModel_DTO? BannerFile { get; set; }
    [LibDesc(SpecModelDisplayName.BannerFileId), StringLength(SysLengthParam.InternalId)] public string? BannerFileId { get; set; }
    [LibDesc(SpecModelDisplayName.BannerFileDescription), StringLength(SysLengthParam.Title_en)] public string? BannerFileDescription { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1820Model_DTO? _SpecHomePage1820 { get; set; }
    #endregion
}
/// <summary>
/// 1820首頁內容設定
/// </summary>
public class SpecHomePage1820_Detail_DTO : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string? HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title_en)] public string? Title { get; set; }
    [LibDesc(ModelDisplayName.Common_SubTitle), StringLength(SysLengthParam.Title_en)] public string? SubTitle { get; set; }
    [ForeignKey(nameof(MainPictureId))] public FileManageModel_DTO? MainPicture { get; set; }
    [LibDesc(SpecModelDisplayName.MainPic), StringLength(SysLengthParam.InternalId)] public string? MainPictureId { get; set; }
    [LibDesc(SpecModelDisplayName.MainPicDescription), StringLength(SysLengthParam.Title_en)] public string? MainPictureDescription { get; set; }
    [ForeignKey(nameof(SubPictureId))] public FileManageModel_DTO? SubPicture { get; set; }
    [LibDesc(SpecModelDisplayName.SubPic), StringLength(SysLengthParam.InternalId)] public string? SubPictureId { get; set; }
    [LibDesc(SpecModelDisplayName.SubPicDescription), StringLength(SysLengthParam.Title_en)] public string? SubPictureDescription { get; set; }
    [LibDesc(SpecModelDisplayName.ContentInfo), StringLength(SysLengthParam.Memo)] public string? Intro { get; set; }
    [LibDesc(SpecModelDisplayName.MainLinkTitle), StringLength(SysLengthParam.Info)] public string? MainLinkTitle { get; set; }
    [LibDesc(SpecModelDisplayName.MainLinkUrl), StringLength(SysLengthParam.Url)] public string? MainLink { get; set; }
    [LibDesc(SpecModelDisplayName.SubLinkTitle1), StringLength(SysLengthParam.Info)] public string? SubLinkTitle1 { get; set; }
    [LibDesc(SpecModelDisplayName.SubLinkUrl2), StringLength(SysLengthParam.Url)] public string? SubLink1 { get; set; }
    [LibDesc(SpecModelDisplayName.SubLinkTitle2), StringLength(SysLengthParam.Info)] public string? SubLinkTitle2 { get; set; }
    [LibDesc(SpecModelDisplayName.SubLinkUrl2), StringLength(SysLengthParam.Url)] public string? SubLink2 { get; set; }
    [LibDesc(SpecModelDisplayName.SubLinkTitle3), StringLength(SysLengthParam.Info)] public string? SubLinkTitle3 { get; set; }
    [LibDesc(SpecModelDisplayName.SubLinkUrl3), StringLength(SysLengthParam.Url)] public string? SubLink3 { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1820Model_DTO? _SpecHomePage1820 { get; set; }
    #endregion
}
/// <summary>
/// 1820首頁跑馬燈
/// </summary>
public class SpecHomePage1820_Marquee_DTO : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string? HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    [ForeignKey(nameof(PictureId))] public FileManageModel_DTO? Picture { get; set; }
    [LibDesc(ModelDisplayName.Gallery_PicSrcId), StringLength(SysLengthParam.InternalId)] public string? PictureId { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string? PictureTitle { get; set; }
    [LibDesc(ModelDisplayName.Common_IsHide)] public bool? IsHide { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1820Model_DTO? _SpecHomePage1820 { get; set; }
    #endregion
}
/// <summary>
/// 1820首頁資源檔設定
/// </summary>
public class SpecHomePage1820_Resource_DTO : DetailRowModel
{
    [LibDesc(SpecModelDisplayName.HomePageId), Key, StringLength(SysLengthParam.ID)] public string? HomePageId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
    [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title_en)] public string? PicTitle { get; set; }
    [LibDesc(ModelDisplayName.Common_SubTitle), StringLength(SysLengthParam.Title_en)] public string? PicSubTitle { get; set; }
    [ForeignKey(nameof(PicFileId))] public FileManageModel_DTO? PicFile { get; set; }
    [LibDesc(SpecModelDisplayName.ResoourcePictureId), StringLength(SysLengthParam.InternalId)] public string? PicFileId { get; set; }
    [LibDesc(SpecModelDisplayName.Spec_ResourcePictureDescription), StringLength(SysLengthParam.Title_en)] public string? PicFileDescription { get; set; }
    [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string? Link { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(HomePageId))] public SpecHomePage1820Model_DTO? _SpecHomePage1820 { get; set; }
    #endregion
}