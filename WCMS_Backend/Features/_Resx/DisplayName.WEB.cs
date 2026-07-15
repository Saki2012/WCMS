using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.Banner;
using WCMS.Features.WEB.FileArchive;
using WCMS.Features.WEB.Timeline;
namespace WCMS.SysCore.FeatureDriver.Resx;

public static partial class DisplayName
{
    #region 公告
    /// <summary>
    /// 中：公告
    /// 英：Announcement
    /// </summary>
    public const string Announcement = nameof(Announcement);
    /// <summary>
    /// 中：公告附件明細
    /// 英：Announcement Files
    /// </summary>
    public const string AnnouncementDetailFile = nameof(AnnouncementDetailFile);
    /// <summary>
    /// 中：公告代碼
    /// 英：Announcement ID
    /// </summary>
    public const string AnnouncementId = nameof(AnnouncementId);
    /// <summary>
    /// 中：未設定（Announcement_SubTitle 缺少 zh-TW resx）
    /// 英：未設定（Announcement_SubTitle missing en resx）
    /// </summary>
    public const string Announcement_SubTitle = nameof(Announcement_SubTitle);
    /// <summary>
    /// 中：封面圖片
    /// 英：Cover Image
    /// </summary>
    public const string Announcement_CoverPictureId = nameof(Announcement_CoverPictureId);
    /// <summary>
    /// 中：圖片說明
    /// 英：Image Description
    /// </summary>
    public const string Announcement_PicDescription = nameof(Announcement_PicDescription);
    /// <summary>
    /// 中：公告日期
    /// 英：Announcement Date
    /// </summary>
    public const string Announcement_StartDate = nameof(Announcement_StartDate);
    /// <summary>
    /// 中：下架日期
    /// 英：Unpublish Date
    /// </summary>
    public const string Announcement_EndDate = nameof(Announcement_EndDate);
    /// <summary>
    /// 中：新增日期
    /// 英：Created Date
    /// </summary>
    public const string Announcement_CreationDate = nameof(Announcement_CreationDate);
    /// <summary>
    /// 中：附件
    /// 英：Attachment
    /// </summary>
    public const string Announcement_FileId = nameof(Announcement_FileId);
    /// <summary>
    /// 中：附件名稱
    /// 英：Attachment Name
    /// </summary>
    public const string Announcement_FileName = nameof(Announcement_FileName);

    #endregion 

    #region 廣告輪播
    /// <summary>
    /// 橫幅表單
    /// </summary>
    public const string BannerSet = nameof(BannerSet);
    /// <summary>
    /// 橫幅明細
    /// </summary>
    public const string BannerDetail = nameof(BannerDetail);
    /// <summary>
    /// 中：橫幅廣告
    /// 英：Banner Ad
    /// </summary>
    public const string BannerId = nameof(BannerId);
    /// <summary>
    /// 中：橫幅類別名稱
    /// 英：Banner Category Name
    /// </summary>
    public const string Banner_CategoryName = nameof(Banner_CategoryName);
    /// <summary>
    /// 中：轉換間隔(s)
    /// 英：Interval (s)
    /// </summary>
    public const string Banner_Interval = nameof(Banner_Interval);
    /// <summary>
    /// 中：轉換速度(ms)
    /// 英：Speed (ms)
    /// </summary>
    public const string Banner_Speed = nameof(Banner_Speed);
    /// <summary>
    /// 中：圖片高度(px)
    /// 英：Image Height (px)
    /// </summary>
    public const string Banner_Height = nameof(Banner_Height);
    /// <summary>
    /// 中：圖片寬度(px)
    /// 英：Image Width (px)
    /// </summary>
    public const string Banner_Width = nameof(Banner_Width);
    /// <summary>
    /// 中：輪播效果
    /// 英：Carousel Effect
    /// </summary>
    public const string Banner_Effect = nameof(Banner_Effect);
    /// <summary>
    /// 中：圖片來源
    /// 英：Image Source
    /// </summary>
    public const string Banner_PicSrcId = nameof(Banner_PicSrcId);
    /// <summary>
    /// 中：標題顏色
    /// 英：Title Color
    /// </summary>
    public const string Banner_FontColor = nameof(Banner_FontColor);
    /// <summary>
    /// 中：上架日期
    /// 英：Start Date
    /// </summary>
    public const string Banner_StartDate = nameof(Banner_StartDate);
    /// <summary>
    /// 中：下架日期
    /// 英：End Date
    /// </summary>
    public const string Banner_EndDate = nameof(Banner_EndDate);
    /// <summary>
    /// 中：新增日期
    /// 英：Created Date
    /// </summary>
    public const string Banner_CreationDate = nameof(Banner_CreationDate);
    /// <summary>
    /// 中：排序編號
    /// 英：Sort Order
    /// </summary>
    public const string Banner_Sort = nameof(Banner_Sort);
    /// <summary>
    /// 中：內容
    /// 英：Content
    /// </summary>
    public const string Banner_Content = nameof(Banner_Content);
    #endregion 

    #region 類別
    /// <summary>
    /// 中：類別
    /// 英：Category
    /// </summary>
    public const string CategoryId = nameof(CategoryId);
    /// <summary>
    /// 中：功能類別對應模組
    /// 英：Category-Module Mapping
    /// </summary>
    public const string Category_Module = nameof(Category_Module);
    /// <summary>
    /// 中：功能類別明細
    /// 英：Category Details
    /// </summary>
    public const string Category_Detail = nameof(Category_Detail);
    /// <summary>
    /// 中：客製化
    /// 英：Customized
    /// </summary>
    public const string Category_CustomMade = nameof(Category_CustomMade);
    /// <summary>
    /// 中：類別名稱
    /// 英：Category Name
    /// </summary>
    public const string Category_CategoryName = nameof(Category_CategoryName);


    #endregion

    #region 檔案室

    /// <summary>
    /// 檔案室
    /// </summary>
    public const string FileArchiveSet = nameof(FileArchiveSet);
    /// <summary>
    /// 檔案明細
    /// </summary>
    public const string FileArchiveDetail = nameof(FileArchiveDetail);
    /// <summary>
    /// 超連結明細
    /// </summary>
    public const string FileArchiveUrlDetail = nameof(FileArchiveUrlDetail);


    /// <summary>
    /// 中：檔案室代碼
    /// 英：File Archive Code
    /// </summary>
    public const string FileArchiveId = nameof(FileArchiveId);
    /// <summary>
    /// 中：未設定（FileArchive_ContentStatus 缺少 zh-TW resx）
    /// 英：未設定（FileArchive_ContentStatus missing en resx）
    /// </summary>
    public const string FileArchive_ContentStatus = nameof(FileArchive_ContentStatus);
    /// <summary>
    /// 中：類別
    /// 英：Categories
    /// </summary>
    public const string FileArchive_Categories = nameof(FileArchive_Categories);
    /// <summary>
    /// 中：標籤
    /// 英：Tags
    /// </summary>
    public const string FileArchive_Tags = nameof(FileArchive_Tags);
    /// <summary>
    /// 中：客製化
    /// 英：Customized
    /// </summary>
    public const string FileArchive_CustomMade = nameof(FileArchive_CustomMade);
    /// <summary>
    /// 中：檔案來源
    /// 英：File Source
    /// </summary>
    public const string FileArchive_FileSrcId = nameof(FileArchive_FileSrcId);
    /// <summary>
    /// 中：檔案名稱
    /// 英：File Name
    /// </summary>
    public const string FileArchive_FileName = nameof(FileArchive_FileName);
    /// <summary>
    /// 中：上架日期
    /// 英：Start Date
    /// </summary>
    public const string FileArchive_StartDate = nameof(FileArchive_StartDate);
    /// <summary>
    /// 中：下架日期
    /// 英：End Date
    /// </summary>
    public const string FileArchive_EndDate = nameof(FileArchive_EndDate);
    /// <summary>
    /// 中：新增日期
    /// 英：Created Date
    /// </summary>
    public const string FileArchive_CreationDate = nameof(FileArchive_CreationDate);
    /// <summary>
    /// 中：排序編號
    /// 英：Sort Order
    /// </summary>
    public const string FileArchive_Sort = nameof(FileArchive_Sort);
    /// <summary>
    /// 中：下載次數
    /// 英：Download Count
    /// </summary>
    public const string FileArchive_DownloadCount = nameof(FileArchive_DownloadCount);
    #endregion

    #region 相簿
    /// <summary>
    /// 相簿
    /// </summary>
    public const string GallerySet = nameof(GallerySet);

    /// <summary>
    /// 中：相簿
    /// 英：Gallery
    /// </summary>
    public const string GalleryId = nameof(GalleryId);
    /// <summary>
    /// 中：類別
    /// 英：Categories
    /// </summary>
    public const string Gallery_Categories = nameof(Gallery_Categories);
    /// <summary>
    /// 中：標籤
    /// 英：Tags
    /// </summary>
    public const string Gallery_Tags = nameof(Gallery_Tags);
    /// <summary>
    /// 中：未設定（Gallery_ContentStatus 缺少 zh-TW resx）
    /// 英：未設定（Gallery_ContentStatus missing en resx）
    /// </summary>
    public const string Gallery_ContentStatus = nameof(Gallery_ContentStatus);
    /// <summary>
    /// 中：相簿封面圖
    /// 英：Cover Image
    /// </summary>
    public const string Gallery_CoverPicSrcId = nameof(Gallery_CoverPicSrcId);
    /// <summary>
    /// 中：排序編號
    /// 英：Sort Order
    /// </summary>
    public const string Gallery_Sort = nameof(Gallery_Sort);
    /// <summary>
    /// 中：相簿資訊
    /// 英：Gallery Info
    /// </summary>
    public const string Gallery_GalleryInfo = nameof(Gallery_GalleryInfo);
    /// <summary>
    /// 中：相片
    /// 英：Photos
    /// </summary>
    public const string Gallery_Photos = nameof(Gallery_Photos);
    /// <summary>
    /// 中：相片說明
    /// 英：Photo Description
    /// </summary>
    public const string Gallery_PhotosInfo = nameof(Gallery_PhotosInfo);
    /// <summary>
    /// 中：內容
    /// 英：Content
    /// </summary>
    public const string Gallery_Content = nameof(Gallery_Content);
    /// <summary>
    /// 中：相片來源
    /// 英：Photo Source
    /// </summary>
    public const string Gallery_PicSrcId = nameof(Gallery_PicSrcId);
    #endregion

    #region 頁面

    /// <summary>
    /// 頁面內容
    /// Page Content
    /// </summary>
    public const string PageManagementSet = nameof(PageManagementSet);

    /// <summary>
    /// 中：頁面
    /// 英：Page
    /// </summary>
    public const string PageId = nameof(PageId);

    /// <summary>
    /// 中：所屬模塊
    /// 英：Page Prog
    /// </summary>
    public const string Page_Prog = nameof(Page_Prog);

    /// <summary>
    /// 中：類別
    /// 英：Categories
    /// </summary>
    public const string Page_Categories = nameof(Page_Categories);
    /// <summary>
    /// 中：客製化
    /// 英：Customized
    /// </summary>
    public const string Page_CustomMade = nameof(Page_CustomMade);
    /// <summary>
    /// 中：內容
    /// 英：Content
    /// </summary>
    public const string Page_Content = nameof(Page_Content);
    #endregion

    #region 標籤
    /// <summary>
    /// 中：標籤功能
    /// 英：Tag Feature
    /// </summary>
    public const string TagId = nameof(TagId);
    /// <summary>
    /// 中：標籤資料
    /// 英：Tag Data
    /// </summary>
    public const string Tag_Data = nameof(Tag_Data);
    /// <summary>
    /// 中：未設定（Tag_Detail 缺少 zh-TW resx）
    /// 英：未設定（Tag_Detail missing en resx）
    /// </summary>
    public const string Tag_Detail = nameof(Tag_Detail);
    /// <summary>
    /// 中：標籤功能對應模組
    /// 英：Tag-Module Mapping
    /// </summary>
    public const string Tag_Module = nameof(Tag_Module);
    /// <summary>
    /// 中：標籤名稱
    /// 英：Tag Name
    /// </summary>
    public const string Tag_TagName = nameof(Tag_TagName);
    /// <summary>
    /// 中：客製化
    /// 英：Customized
    /// </summary>
    public const string Tag_CustomMade = nameof(Tag_CustomMade);
    #endregion

    #region 網路資源

    /// <summary>
    /// 網路資源
    /// </summary>
    public const string WebResourceSet = nameof(WebResourceSet);

    /// <summary>
    /// 中：網路資源
    /// 英：Web Resource
    /// </summary>
    public const string WebResourceId = nameof(WebResourceId);
    /// <summary>
    /// 中：網路資源資訊
    /// 英：Web Resource Info
    /// </summary>
    public const string WebResource_WebResourceInfo = nameof(WebResource_WebResourceInfo);
    /// <summary>
    /// 中：類別
    /// 英：Categories
    /// </summary>
    public const string WebResource_Categories = nameof(WebResource_Categories);
    /// <summary>
    /// 中：標籤
    /// 英：Tags
    /// </summary>
    public const string WebResource_Tags = nameof(WebResource_Tags);
    /// <summary>
    /// 中：未設定（WebResource_ContentStatus 缺少 zh-TW resx）
    /// 英：未設定（WebResource_ContentStatus missing en resx）
    /// </summary>
    public const string WebResource_ContentStatus = nameof(WebResource_ContentStatus);
    /// <summary>
    /// 中：封面圖片
    /// 英：Cover Image
    /// </summary>
    public const string WebResource_PicId = nameof(WebResource_PicId);
    /// <summary>
    /// 中：圖片說明
    /// 英：Image Description
    /// </summary>
    public const string WebResource_PicDescription = nameof(WebResource_PicDescription);
    /// <summary>
    /// 中：內容
    /// 英：Content
    /// </summary>
    public const string WebResource_Content = nameof(WebResource_Content);
    #endregion

    #region 紀事表


    /// <summary>
    /// 紀事表單
    /// </summary>
    public const string TimelineSet = nameof(TimelineSet);
    /// <summary>
    /// 語系資料
    /// </summary>
    public const string TimelineLangDetail = nameof(TimelineLangDetail);

    /// <summary>
    /// 中：紀事表Id
    /// 英：Timeline ID
    /// </summary>
    public const string TimelineId = nameof(TimelineId);
    /// <summary>
    /// 中：紀事表名稱
    /// 英：Timeline Name
    /// </summary>
    public const string TimelineName = nameof(TimelineName);
    /// <summary>
    /// 中：事件標題
    /// 英：Timeline Title
    /// </summary>
    public const string Timeline_Title = nameof(Timeline_Title);
    /// <summary>
    /// 中：事件內容
    /// 英：Timeline Content
    /// </summary>
    public const string Timeline_Content = nameof(Timeline_Content);
    #endregion

    #region 問卷設計
    /// <summary>
    /// 問卷設計表單
    /// </summary>
    public const string SurveySet = nameof(SurveySet);

    /// <summary>
    /// 中：問卷代號
    /// 英：Survey ID
    /// </summary>
    public const string SurveyId = nameof(SurveyId);
    /// <summary>
    /// 中：問卷名稱
    /// 英：Survey Name
    /// </summary>
    public const string SurveyName = nameof(SurveyName);
    /// <summary>
    /// 中：問卷描述
    /// 英：Survey Description
    /// </summary>
    public const string SurveyDescription = nameof(SurveyDescription);
    /// <summary>
    /// 中：問卷提交成功後的顯示內容
    /// 英：Survey Description
    /// </summary>
    public const string SurveySuccessContent = nameof(SurveySuccessContent);
    /// <summary>
    /// 中：問卷回覆 ID
    /// 英：Survey Submission ID
    /// </summary>
    public const string SurveySubmissionId = nameof(SurveySubmissionId);
    /// <summary>
    /// 動態欄位資料
    /// </summary>
    public const string Survey_SubmitFormData = nameof(Survey_SubmitFormData);
    /// <summary>
    /// 動態欄位快照
    /// </summary>
    public const string Survey_FieldSnapshot = nameof(Survey_FieldSnapshot);
    /// <summary>
    /// 送出時間 (UTC)
    /// </summary>
    public const string Survey_SubmitTime_UTC = nameof(Survey_SubmitTime_UTC);
    /// <summary>
    /// 回覆狀態
    /// </summary>
    public const string Survey_ReplyStatus = nameof(Survey_ReplyStatus);
    #endregion

    #region 網站結構設定
    /// <summary>
    /// 中：首頁代碼
    /// 英：Homepage Code
    /// </summary>
    public const string SiteMenu_SiteIndex = nameof(SiteMenu_SiteIndex);
    /// <summary>
    /// 中：Google分析碼
    /// 英：Google Analytics Code
    /// </summary>
    public const string SiteMenu_GoogleAnalytics = nameof(SiteMenu_GoogleAnalytics);
    /// <summary>
    /// 中：是否啟用站台
    /// 英：Enable Site
    /// </summary>
    public const string SiteMenu_Enable = nameof(SiteMenu_Enable);
    /// <summary>
    /// 中：選單名稱
    /// 英：Menu Name
    /// </summary>
    public const string SiteMenu_SiteTitle = nameof(SiteMenu_SiteTitle);
    /// <summary>
    /// 中：網站描述
    /// 英：Site Description
    /// </summary>
    public const string SiteMenu_SiteDescription = nameof(SiteMenu_SiteDescription);
    /// <summary>
    /// 中：網站標頭
    /// 英：Site Header
    /// </summary>
    public const string SiteMenu_SiteHeader = nameof(SiteMenu_SiteHeader);
    /// <summary>
    /// 中：網站標尾
    /// 英：Site Footer
    /// </summary>
    public const string SiteMenu_SiteFooter = nameof(SiteMenu_SiteFooter);
    /// <summary>
    /// 中：關鍵字
    /// 英：Key words
    /// </summary>
    public const string SiteMenu_Keyword = nameof(SiteMenu_Keyword);
    /// <summary>
    /// 中：選單ID
    /// 英：Menu ID
    /// </summary>
    public const string SiteMenu_ItemSiteUrl = nameof(SiteMenu_ItemSiteUrl);
    /// <summary>
    /// 中：完整路徑
    /// 英：Full Path
    /// </summary>
    public const string SiteMenu_FullUrl = nameof(SiteMenu_FullUrl);
    /// <summary>
    /// 中：網頁項目層級
    /// 英：Menu Item Level
    /// </summary>
    public const string SiteMenu_Level = nameof(SiteMenu_Level);
    /// <summary>
    /// 中：網頁項目排序
    /// 英：Menu Item Order
    /// </summary>
    public const string SiteMenu_DisplayOrder = nameof(SiteMenu_DisplayOrder);
    /// <summary>
    /// 中：版面類型
    /// 英：Menu Type
    /// </summary>
    public const string SiteMenu_ItemType = nameof(SiteMenu_ItemType);
    /// <summary>
    /// 中：開啟方式
    /// 英：Open Method
    /// </summary>
    public const string SiteMenu_WindowTarget = nameof(SiteMenu_WindowTarget);
    /// <summary>
    /// 中：是否顯示在選單中
    /// 英：Show in Menu
    /// </summary>
    public const string SiteMenu_IsShowOnMenu = nameof(SiteMenu_IsShowOnMenu);
    /// <summary>
    /// 中：網頁項目標題
    /// 英：Menu Item Title
    /// </summary>
    public const string SiteMenu_MenuTitle = nameof(SiteMenu_MenuTitle);
    /// <summary>
    /// 中：轉址方式
    /// 英：Redirect Method
    /// </summary>
    public const string SiteMenu_RedirectType = nameof(SiteMenu_RedirectType);
    /// <summary>
    /// 中：未設定（SiteMenu_RedirectUrl 缺少 zh-TW resx）
    /// 英：未設定（SiteMenu_RedirectUrl missing en resx）
    /// </summary>
    public const string SiteMenu_RedirectUrl = nameof(SiteMenu_RedirectUrl);
    /// <summary>
    /// 中：模型功能
    /// 英：Module
    /// </summary>
    public const string SiteMenu_ModuleProgId = nameof(SiteMenu_ModuleProgId);
    /// <summary>
    /// 中：網頁模型參數
    /// 英：Module Options
    /// </summary>
    public const string SiteMenu_ModuleOptions = nameof(SiteMenu_ModuleOptions);
    #endregion
}
