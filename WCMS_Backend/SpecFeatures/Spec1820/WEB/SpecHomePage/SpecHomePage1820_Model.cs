using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1820._Resx;
using WCMS.SysCore.PlatformServices.FileManagement;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SpecFeatures.Spec1817._Resx;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.SpecFeatures.Spec1820.WEB.SpecHomePage;

/// <summary>
/// 1820首頁設定表單
/// </summary>
public class SpecHomePage1820Set : ITSet
{
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecHomePage1820)]
public SpecHomePage1820 SpecHomePage1820 { get; set; }
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecHomePage1820_BannerMedia)]
public List<SpecHomePage1820_BannerMedia> SpecHomePage1820_BannerMedia { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecHomePage1820_Detail)]
public List<SpecHomePage1820_Detail> SpecHomePage1820_Detail { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecHomePage1820_Marquee)]
public List<SpecHomePage1820_Marquee> SpecHomePage1820_Marquee { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecHomePage1820_Resource)]
public List<SpecHomePage1820_Resource> SpecHomePage1820_Resource { get; set; }= [];
}
/// <summary>
/// 1820首頁基礎資料
/// </summary>
public class SpecHomePage1820 : MasterDataModel
{

[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.HomePageId)]
public string HomePageId { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Lang, DisplayName.Common_Lang)]
public string Lang { get; set; } = string.Empty;

    #region Section1 欄位
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Section1Title_L)]
public string Section1Title_L { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Section1Title_M)]
public string Section1Title_M { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Section1Title_R)]
public string Section1Title_R { get; set; } = string.Empty;
    #endregion

    #region Section2 欄位
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.HeroText)]
public string HeroText { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.HeroTextUrl)]
public string HeroText_ViewMoreLink { get; set; } = string.Empty;
    #endregion

    #region Section3 欄位
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.AnnouncementTitle)]
public string AnnouncementTitle { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.AnnouncementSubTitle)]
public string AnnouncementSubTitle { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, SpecDisplayName.AnnouncementCategoryIds)]
public string AnnouncementCategoryIds { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.Announcement_ViewMoreLink)]
public string Announcement_ViewMoreLink { get; set; } = string.Empty;
    #endregion

    // Section4、Section5因為有多筆，所以放在子表

    #region Section6 欄位
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.Resource_Title)]
public string Resource_Title { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.Resource_SubTitle)]
public string Resource_SubTitle { get; set; } = string.Empty;
    #endregion

    #region 主子表關聯
[InverseProperty(nameof(SpecHomePage1820_BannerMedia._SpecHomePage1820))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecHomePage1820_BannerMedia> _SpecHomePage1820_BannerMedia { get; set; } = [];
[InverseProperty(nameof(SpecHomePage1820_Detail._SpecHomePage1820))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecHomePage1820_Detail> _SpecHomePage1820_Detail { get; set; } = [];
[InverseProperty(nameof(SpecHomePage1820_Marquee._SpecHomePage1820))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecHomePage1820_Marquee> _SpecHomePage1820_Marquee { get; set; } = [];
[InverseProperty(nameof(SpecHomePage1820_Resource._SpecHomePage1820))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecHomePage1820_Resource> _SpecHomePage1820_Resource { get; set; } = [];
    #endregion
}
/// <summary>
/// 1820首頁Banner資源設定
/// </summary>
public class SpecHomePage1820_BannerMedia: DetailRowModel
{
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.HomePageId)]
public string HomePageId { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
[ForeignKey(nameof(BannerFileId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManage? BannerFile { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.BannerFileId)]
public string? BannerFileId { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.BannerFileDescription)]
public string BannerFileDescription { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(HomePageId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecHomePage1820 _SpecHomePage1820 { get; set; }
    #endregion
}
/// <summary>
/// 1820首頁內容設定
/// </summary>
public class SpecHomePage1820_Detail: DetailRowModel
{
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.HomePageId)]
public string HomePageId { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, DisplayName.Common_Title)]
public string Title { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, DisplayName.Common_SubTitle)]
public string SubTitle { get; set; } = string.Empty;
[ForeignKey(nameof(MainPictureId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManage MainPicture { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.MainPic)]
public string? MainPictureId { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.MainPicDescription)]
public string MainPictureDescription { get; set; } = string.Empty;
[ForeignKey(nameof(SubPictureId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManage SubPicture { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.SubPic)]
public string? SubPictureId { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.SubPicDescription)]
public string SubPictureDescription { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, SpecDisplayName.ContentInfo)]
public string Intro { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.MainLinkTitle)]
public string MainLinkTitle { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.MainLinkUrl)]
public string MainLink { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.SubLinkTitle1)]
public string SubLinkTitle1 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.SubLinkUrl2)]
public string SubLink1 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.SubLinkTitle2)]
public string SubLinkTitle2 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.SubLinkUrl2)]
public string SubLink2 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.SubLinkTitle3)]
public string SubLinkTitle3 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, SpecDisplayName.SubLinkUrl3)]
public string SubLink3 { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(HomePageId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecHomePage1820 _SpecHomePage1820 { get; set; }
    #endregion
}
/// <summary>
/// 1820首頁跑馬燈
/// </summary>
public class SpecHomePage1820_Marquee : DetailRowModel
{
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.HomePageId)]
public string HomePageId { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
[ForeignKey(nameof(PictureId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManage Picture { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Gallery_PicSrcId)]
public string? PictureId { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Title)]
public string PictureTitle { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_IsHide)]
public bool IsHide { get; set; }

    #region 主子表關聯
[ForeignKey(nameof(HomePageId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecHomePage1820 _SpecHomePage1820 { get; set; }
    #endregion
}
/// <summary>
/// 1820首頁資源檔設定
/// </summary>
public class SpecHomePage1820_Resource : DetailRowModel
{
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.HomePageId)]
public string HomePageId { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, DisplayName.Common_Title)]
public string PicTitle { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, DisplayName.Common_SubTitle)]
public string PicSubTitle { get; set; } = string.Empty;
[ForeignKey(nameof(PicFileId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManage PicFile { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.ResoourcePictureId)]
public string? PicFileId { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title_en, SpecDisplayName.ResoourcePictureId)]
public string PicFileDescription { get; set; } = string.Empty;

[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, DisplayName.Common_Url)]
public string Link { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(HomePageId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecHomePage1820 _SpecHomePage1820 { get; set; }
    #endregion
}
