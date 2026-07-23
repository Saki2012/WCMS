using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SpecFeatures.Spec1820._Resx;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.SpecFeatures.Spec1820.WEB.SpecHomePage;

/// <summary>
/// 1820 首頁基礎設定與各區塊明細聚合根。
/// </summary>
public class SpecHomePage1820 : HeaderModel
{
    /// <summary>
    /// 首頁設定代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.HomePageId)]
    public string HomePageId { get; set; } = string.Empty;
    /// <summary>
    /// 首頁內容語系。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Lang, DisplayName.Common_Lang)]
    public string Lang { get; set; } = string.Empty;

    #region Section1 欄位
    /// <summary>
    /// 橫幅左側標語。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.Section1Title_L)]
    public string Section1Title_L { get; set; } = string.Empty;
    /// <summary>
    /// 橫幅中間標語。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.Section1Title_M)]
    public string Section1Title_M { get; set; } = string.Empty;
    /// <summary>
    /// 橫幅右側標語。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.Section1Title_R)]
    public string Section1Title_R { get; set; } = string.Empty;
    #endregion

    #region Section2 欄位
    /// <summary>
    /// 主視覺文案。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.HeroText)]
    public string HeroText { get; set; } = string.Empty;
    /// <summary>
    /// 主視覺文案查看更多連結。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.HeroTextUrl)]
    public string HeroText_ViewMoreLink { get; set; } = string.Empty;
    #endregion

    #region Section3 欄位
    /// <summary>
    /// 公告區塊標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.AnnouncementTitle)]
    public string AnnouncementTitle { get; set; } = string.Empty;
    /// <summary>
    /// 公告區塊副標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.AnnouncementSubTitle)]
    public string AnnouncementSubTitle { get; set; } = string.Empty;
    /// <summary>
    /// 公告類別篩選條件。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, SpecModelDisplayName.AnnouncementCategoryIds)]
    public string AnnouncementCategoryIds { get; set; } = string.Empty;
    /// <summary>
    /// 公告區塊查看更多連結。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.Announcement_ViewMoreLink)]
    public string Announcement_ViewMoreLink { get; set; } = string.Empty;
    #endregion

    #region Section6 欄位
    /// <summary>
    /// 資源區塊標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.Resource_Title)]
    public string Resource_Title { get; set; } = string.Empty;
    /// <summary>
    /// 資源區塊副標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.Resource_SubTitle)]
    public string Resource_SubTitle { get; set; } = string.Empty;
    #endregion

    #region 主子表關聯
    /// <summary>
    /// 首頁 Banner 媒體明細。
    /// </summary>
    [InverseProperty(nameof(SpecHomePage1820_BannerMedia._SpecHomePage1820))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecHomePage1820_BannerMedia> _SpecHomePage1820_BannerMedia { get; set; } = [];
    /// <summary>
    /// 首頁介紹內容明細。
    /// </summary>
    [InverseProperty(nameof(SpecHomePage1820_Detail._SpecHomePage1820))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecHomePage1820_Detail> _SpecHomePage1820_Detail { get; set; } = [];
    /// <summary>
    /// 首頁跑馬燈明細。
    /// </summary>
    [InverseProperty(nameof(SpecHomePage1820_Marquee._SpecHomePage1820))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecHomePage1820_Marquee> _SpecHomePage1820_Marquee { get; set; } = [];
    /// <summary>
    /// 首頁資源連結明細。
    /// </summary>
    [InverseProperty(nameof(SpecHomePage1820_Resource._SpecHomePage1820))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecHomePage1820_Resource> _SpecHomePage1820_Resource { get; set; } = [];
    #endregion
}

/// <summary>
/// 1820 首頁 Banner 媒體設定。
/// </summary>
public class SpecHomePage1820_BannerMedia : FormDetailModel
{
    /// <summary>
    /// 首頁設定代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.HomePageId)]
    public string HomePageId { get; set; } = string.Empty;
    /// <summary>
    /// Banner 媒體檔案。
    /// </summary>
    [ForeignKey(nameof(BannerFileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? BannerFile { get; set; }
    /// <summary>
    /// Banner 媒體檔案代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.BannerFileId)]
    public string? BannerFileId { get; set; }
    /// <summary>
    /// Banner 媒體替代說明。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.BannerFileDescription)]
    public string BannerFileDescription { get; set; } = string.Empty;

    #region 主子表關聯
    /// <summary>
    /// 所屬首頁設定。
    /// </summary>
    [ForeignKey(nameof(HomePageId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecHomePage1820 _SpecHomePage1820 { get; set; } = null!;
    #endregion
}

/// <summary>
/// 1820 首頁介紹內容設定。
/// </summary>
public class SpecHomePage1820_Detail : FormDetailModel
{
    /// <summary>
    /// 首頁設定代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.HomePageId)]
    public string HomePageId { get; set; } = string.Empty;
    /// <summary>
    /// 內容標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, DisplayName.Common_Title)]
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 內容副標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, DisplayName.Common_SubTitle)]
    public string SubTitle { get; set; } = string.Empty;
    /// <summary>
    /// 主視覺圖片。
    /// </summary>
    [ForeignKey(nameof(MainPictureId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? MainPicture { get; set; }
    /// <summary>
    /// 主視覺圖片代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.MainPic)]
    public string? MainPictureId { get; set; }
    /// <summary>
    /// 主視覺圖片替代說明。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.MainPicDescription)]
    public string MainPictureDescription { get; set; } = string.Empty;
    /// <summary>
    /// 延伸視覺圖片。
    /// </summary>
    [ForeignKey(nameof(SubPictureId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? SubPicture { get; set; }
    /// <summary>
    /// 延伸視覺圖片代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.SubPic)]
    public string? SubPictureId { get; set; }
    /// <summary>
    /// 延伸視覺圖片替代說明。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.SubPicDescription)]
    public string SubPictureDescription { get; set; } = string.Empty;
    /// <summary>
    /// 內容介紹文字。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, SpecModelDisplayName.ContentInfo)]
    public string Intro { get; set; } = string.Empty;
    /// <summary>
    /// 主連結標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, SpecModelDisplayName.MainLinkTitle)]
    public string MainLinkTitle { get; set; } = string.Empty;
    /// <summary>
    /// 主連結網址。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.MainLinkUrl)]
    public string MainLink { get; set; } = string.Empty;
    /// <summary>
    /// 第一組子連結標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, SpecModelDisplayName.SubLinkTitle1)]
    public string SubLinkTitle1 { get; set; } = string.Empty;
    /// <summary>
    /// 第一組子連結網址。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.SubLinkUrl1)]
    public string SubLink1 { get; set; } = string.Empty;
    /// <summary>
    /// 第二組子連結標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, SpecModelDisplayName.SubLinkTitle2)]
    public string SubLinkTitle2 { get; set; } = string.Empty;
    /// <summary>
    /// 第二組子連結網址。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.SubLinkUrl2)]
    public string SubLink2 { get; set; } = string.Empty;
    /// <summary>
    /// 第三組子連結標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, SpecModelDisplayName.SubLinkTitle3)]
    public string SubLinkTitle3 { get; set; } = string.Empty;
    /// <summary>
    /// 第三組子連結網址。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, SpecModelDisplayName.SubLinkUrl3)]
    public string SubLink3 { get; set; } = string.Empty;

    #region 主子表關聯
    /// <summary>
    /// 所屬首頁設定。
    /// </summary>
    [ForeignKey(nameof(HomePageId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecHomePage1820 _SpecHomePage1820 { get; set; } = null!;
    #endregion
}

/// <summary>
/// 1820 首頁跑馬燈設定。
/// </summary>
public class SpecHomePage1820_Marquee : FormDetailModel
{
    /// <summary>
    /// 首頁設定代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.HomePageId)]
    public string HomePageId { get; set; } = string.Empty;
    /// <summary>
    /// 跑馬燈圖片。
    /// </summary>
    [ForeignKey(nameof(PictureId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? Picture { get; set; }
    /// <summary>
    /// 跑馬燈圖片代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, DisplayName.Gallery_PicSrcId)]
    public string? PictureId { get; set; }
    /// <summary>
    /// 跑馬燈圖片標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Title)]
    public string PictureTitle { get; set; } = string.Empty;
    /// <summary>
    /// 是否隱藏此跑馬燈項目。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_IsHide)]
    public bool IsHide { get; set; }

    #region 主子表關聯
    /// <summary>
    /// 所屬首頁設定。
    /// </summary>
    [ForeignKey(nameof(HomePageId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecHomePage1820 _SpecHomePage1820 { get; set; } = null!;
    #endregion
}

/// <summary>
/// 1820 首頁資源連結設定。
/// </summary>
public class SpecHomePage1820_Resource : FormDetailModel
{
    /// <summary>
    /// 首頁設定代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.HomePageId)]
    public string HomePageId { get; set; } = string.Empty;
    /// <summary>
    /// 資源標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, DisplayName.Common_Title)]
    public string PicTitle { get; set; } = string.Empty;
    /// <summary>
    /// 資源副標題。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, DisplayName.Common_SubTitle)]
    public string PicSubTitle { get; set; } = string.Empty;
    /// <summary>
    /// 資源圖片。
    /// </summary>
    [ForeignKey(nameof(PicFileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? PicFile { get; set; }
    /// <summary>
    /// 資源圖片代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.ResourcePictureId)]
    public string? PicFileId { get; set; }
    /// <summary>
    /// 資源圖片替代說明。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title_en, SpecModelDisplayName.ResourcePictureDescription)]
    public string PicFileDescription { get; set; } = string.Empty;
    /// <summary>
    /// 資源連結網址。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, DisplayName.Common_Url)]
    public string Link { get; set; } = string.Empty;

    #region 主子表關聯
    /// <summary>
    /// 所屬首頁設定。
    /// </summary>
    [ForeignKey(nameof(HomePageId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecHomePage1820 _SpecHomePage1820 { get; set; } = null!;
    #endregion
}
