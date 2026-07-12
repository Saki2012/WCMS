using WCMS.Features.COMM.Category;
using WCMS.Features.COMM.Tag;
using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.Banner;
using WCMS.Features.WEB.Gallery;
using WCMS.Features.WEB.WebResource;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecHomePageSetting;

/// <summary>
/// 1810 首頁初始化資料。
/// </summary>
public class SpecHomePageInitialData_DTO
{
    #region Property
    /// <summary>
    /// 首頁 Banner 資料。
    /// </summary>
    public SpecHomePageBannerSection_DTO BannerSlider { get; set; } = new();

    /// <summary>
    /// 最新消息分頁資料。
    /// </summary>
    public SpecHomePageCategoryTabsSection_DTO CategoryTabs { get; set; } = new();

    /// <summary>
    /// 活動資訊資料。
    /// </summary>
    public SpecHomePageEventSection_DTO EventSession { get; set; } = new();

    /// <summary>
    /// 活動花絮資料。
    /// </summary>
    public SpecHomePageGallerySection_DTO GallerySession { get; set; } = new();

    /// <summary>
    /// 影音專區資料。
    /// </summary>
    public SpecHomePageVideoSection_DTO VideoSession { get; set; } = new();
    #endregion
}

/// <summary>
/// 1810 首頁 Banner 區塊資料。
/// </summary>
public class SpecHomePageBannerSection_DTO
{
    #region Property
    /// <summary>
    /// Banner 主資料。
    /// </summary>
    public BannerSet_DTO? Banner { get; set; }
    #endregion
}

/// <summary>
/// 1810 首頁最新消息分頁資料。
/// </summary>
public class SpecHomePageCategoryTabsSection_DTO
{
    #region Property
    /// <summary>
    /// 最新公告資料，置頂優先後由一般資料補滿。
    /// </summary>
    public List<AnnouncementSet_DTO> AllNews { get; set; } = [];

    /// <summary>
    /// 計畫徵求資料，置頂優先後由一般資料補滿。
    /// </summary>
    public List<AnnouncementSet_DTO> ProjectNews { get; set; } = [];

    /// <summary>
    /// 法規公告資料，置頂優先後由一般資料補滿。
    /// </summary>
    public List<AnnouncementSet_DTO> LegalNews { get; set; } = [];

    /// <summary>
    /// 活動公告資料，置頂優先後由一般資料補滿。
    /// </summary>
    public List<AnnouncementSet_DTO> EventNews { get; set; } = [];

    /// <summary>
    /// 獲獎公告資料，置頂優先後由一般資料補滿。
    /// </summary>
    public List<AnnouncementSet_DTO> AwardNews { get; set; } = [];

    /// <summary>
    /// 專題與媒體報導資料，置頂優先後由一般資料補滿。
    /// </summary>
    public List<AnnouncementSet_DTO> MediaNews { get; set; } = [];

    /// <summary>
    /// 公告類別資料。
    /// </summary>
    public List<CategoryDataSet_DTO> Categories { get; set; } = [];

    /// <summary>
    /// 公告標籤資料。
    /// </summary>
    public List<TagSet_DTO> Tags { get; set; } = [];
    #endregion
}

/// <summary>
/// 1810 首頁活動資訊資料。
/// </summary>
public class SpecHomePageEventSection_DTO
{
    #region Property
    /// <summary>
    /// 活動公告資料。
    /// </summary>
    public List<AnnouncementSet_DTO> Announcements { get; set; } = [];

    /// <summary>
    /// 活動標籤資料。
    /// </summary>
    public List<TagSet_DTO> Tags { get; set; } = [];
    #endregion
}

/// <summary>
/// 1810 首頁活動花絮資料。
/// </summary>
public class SpecHomePageGallerySection_DTO
{
    #region Property
    /// <summary>
    /// 相簿資料。
    /// </summary>
    public List<GallerySet_DTO> Galleries { get; set; } = [];

    /// <summary>
    /// 相簿分類資料。
    /// </summary>
    public List<CategoryDataSet_DTO> Categories { get; set; } = [];
    #endregion
}

/// <summary>
/// 1810 首頁影音專區資料。
/// </summary>
public class SpecHomePageVideoSection_DTO
{
    #region Property
    /// <summary>
    /// 影音網站資源資料。
    /// </summary>
    public List<WebResourceSet_DTO> WebResources { get; set; } = [];
    #endregion
}
