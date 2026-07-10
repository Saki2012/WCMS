using System.Globalization;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.Features.COMM.Tag;
using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.Banner;
using WCMS.Features.WEB.Gallery;
using WCMS.Features.WEB.WebResource;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.Model;
using static WCMS.SysCore.QueryListParam;

namespace WCMS.SpecFeatures.Spec1810.WEB.SpecHomePageSetting;

/// <summary>
/// 1810 首頁資料聚合 Biz。
/// </summary>
public class SpecHomePageSettingBiz(
    BizDeps bizDeps,
    IBizService<Banner> bannerService,
    IBizService<Announcement> announcementService,
    IBizService<Category> categoryService,
    IBizService<TagData> tagService,
    IBizService<Gallery> galleryService,
    IBizService<WebResource> webResourceService) : BizBase(bizDeps)
{
    #region Property
    private readonly IBizService<Banner> _bannerService = bannerService;
    private readonly IBizService<Announcement> _announcementService = announcementService;
    private readonly IBizService<Category> _categoryService = categoryService;
    private readonly IBizService<TagData> _tagService = tagService;
    private readonly IBizService<Gallery> _galleryService = galleryService;
    private readonly IBizService<WebResource> _webResourceService = webResourceService;

    private const int CategoryTabsPageSize = 6;
    private const int EventPageSize = 6;
    private const int GalleryPageSize = 10;
    private const int VideoPageSize = 10;

    private static readonly string[] BannerSliderFields =
    [
        nameof(Banner.InternalId),
        nameof(Banner.BannerId),
        nameof(Banner.BannerCategoryName),
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail.BannerId)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail.RowId)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail.PicSrcId)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail.FontColor)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail.Validate_Start)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail.Validate_End)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail.Sort)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail._BannerDetailInfo)}.{nameof(BannerDetailInfo.BannerId)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail._BannerDetailInfo)}.{nameof(BannerDetailInfo.ParentRowId)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail._BannerDetailInfo)}.{nameof(BannerDetailInfo.RowId)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail._BannerDetailInfo)}.{nameof(BannerDetailInfo.Lang)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail._BannerDetailInfo)}.{nameof(BannerDetailInfo.Title)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail._BannerDetailInfo)}.{nameof(BannerDetailInfo.Content)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail._BannerDetailInfo)}.{nameof(BannerDetailInfo.URL)}",
        $"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail._BannerDetailInfo)}.{nameof(BannerDetailInfo.URL_Open)}",
    ];

    private static readonly string[] CategoryTabsNewsFields =
    [
        nameof(Announcement.AnnouncementId),
        nameof(Announcement.InternalId),
        nameof(Announcement.Categories),
        nameof(Announcement.Tags),
        nameof(Announcement.ContentStatus),
        nameof(Announcement.Validate_Start),
        $"{nameof(Announcement._AnnouncementDetail)}.{nameof(AnnouncementDetail.Lang)}",
        $"{nameof(Announcement._AnnouncementDetail)}.{nameof(AnnouncementDetail.Title)}",
    ];

    private static readonly string[] EventFields =
    [
        nameof(Announcement.AnnouncementId),
        nameof(Announcement.InternalId),
        nameof(Announcement.Tags),
        nameof(Announcement.Validate_Start),
        nameof(Announcement.PictureId),
        nameof(Announcement.PicDescription),
        nameof(Announcement.ContentStatus),
        $"{nameof(Announcement._AnnouncementDetail)}.{nameof(AnnouncementDetail.Lang)}",
        $"{nameof(Announcement._AnnouncementDetail)}.{nameof(AnnouncementDetail.Title)}",
    ];

    private static readonly string[] CategoryFields =
    [
        nameof(Category.CategoryId),
        $"{nameof(Category._CategoryDetail)}.{nameof(CategoryDetail.Lang)}",
        $"{nameof(Category._CategoryDetail)}.{nameof(CategoryDetail.CategoryName)}",
    ];

    private static readonly string[] TagFields =
    [
        nameof(TagData.TagId),
        $"{nameof(TagData._TagDetail)}.{nameof(TagDetail.Lang)}",
        $"{nameof(TagData._TagDetail)}.{nameof(TagDetail.TagName)}",
    ];

    private static readonly string[] GalleryFields =
    [
        nameof(Gallery.GalleryId),
        nameof(Gallery.InternalId),
        nameof(Gallery.Categories),
        nameof(Gallery.CoverPicSrcId),
        nameof(Gallery.CreateTime),
        nameof(Gallery.Validate_Start),
        $"{nameof(Gallery._GalleryInfo)}.{nameof(GalleryInfo.Lang)}",
        $"{nameof(Gallery._GalleryInfo)}.{nameof(GalleryInfo.Title)}",
    ];

    private static readonly string[] VideoFields =
    [
        nameof(WebResource.InternalId),
        nameof(WebResource.WebResourceId),
        nameof(WebResource.Categories),
        $"{nameof(WebResource._WebResourceInfo)}.{nameof(WebResourceInfo.Lang)}",
        $"{nameof(WebResource._WebResourceInfo)}.{nameof(WebResourceInfo.Title)}",
        $"{nameof(WebResource._WebResourceInfo)}.{nameof(WebResourceInfo.ResUrl)}",
        $"{nameof(WebResource._WebResourceInfo)}.{nameof(WebResourceInfo.Url_OpenType)}",
    ];
    #endregion

    #region Public
    /// <summary>
    /// 取得首頁初始化資料。
    /// </summary>
    /// <param name="ct">取消權杖。</param>
    /// <returns>首頁初始化資料。</returns>
    public async Task<SpecHomePageInitialData_DTO> GetInitialDataAsync(CancellationToken ct = default)
    {
        string nowIsoLocal = GetNowIsoLocal();
        SpecHomePageInitialData_DTO result = new()
        {
            BannerSlider = await GetBannerSliderAsync(ct),
            CategoryTabs = await GetCategoryTabsAsync(nowIsoLocal, ct),
            EventSession = await GetEventSessionAsync(nowIsoLocal, ct),
            GallerySession = await GetGallerySessionAsync(ct),
            VideoSession = await GetVideoSessionAsync(ct),
        };

        return result;
    }
    #endregion

    #region Private
    /// <summary>
    /// 取得首頁 Banner 資料。
    /// </summary>
    private async Task<SpecHomePageBannerSection_DTO> GetBannerSliderAsync(CancellationToken ct)
    {
        List<Banner_DTO> banners = await QueryListAsync<Banner, Banner_DTO>(_bannerService, BuildBannerSliderParam(), ct);
        SpecHomePageBannerSection_DTO result = new() { Banner = banners.FirstOrDefault() };

        return result;
    }

    /// <summary>
    /// 取得最新消息分頁資料。
    /// </summary>
    private async Task<SpecHomePageCategoryTabsSection_DTO> GetCategoryTabsAsync(string nowIsoLocal, CancellationToken ct)
    {
        SpecHomePageCategoryTabsSection_DTO result = new()
        {
            AllNews = await QueryCategoryTabsNewsAsync(nowIsoLocal, null, ct),
            ProjectNews = await QueryCategoryTabsNewsAsync(nowIsoLocal, "3,4,5", ct),
            LegalNews = await QueryCategoryTabsNewsAsync(nowIsoLocal, "6", ct),
            EventNews = await QueryCategoryTabsNewsAsync(nowIsoLocal, "8,10", ct),
            AwardNews = await QueryCategoryTabsNewsAsync(nowIsoLocal, "45", ct),
            MediaNews = await QueryCategoryTabsNewsAsync(nowIsoLocal, "46", ct),
            Categories = await QueryCategorySetsAsync(ProgKeys.WEB.Announcement, ct),
            Tags = await QueryTagDatasAsync(ProgKeys.WEB.Announcement, ct),
        };

        return result;
    }

    /// <summary>
    /// 取得活動資訊資料。
    /// </summary>
    private async Task<SpecHomePageEventSection_DTO> GetEventSessionAsync(string nowIsoLocal, CancellationToken ct)
    {
        SpecHomePageEventSection_DTO result = new()
        {
            Announcements = await QueryListAsync<Announcement, Announcement_DTO>(_announcementService, BuildEventListParam(nowIsoLocal), ct),
            Tags = await QueryTagDatasAsync(ProgKeys.WEB.Announcement, ct),
        };

        return result;
    }

    /// <summary>
    /// 取得活動花絮資料。
    /// </summary>
    private async Task<SpecHomePageGallerySection_DTO> GetGallerySessionAsync(CancellationToken ct)
    {
        SpecHomePageGallerySection_DTO result = new()
        {
            Galleries = await QueryListAsync<Gallery, Gallery_DTO>(_galleryService, BuildGalleryListParam(), ct),
            Categories = await QueryCategorySetsAsync(ProgKeys.WEB.Gallery, ct),
        };

        return result;
    }

    /// <summary>
    /// 取得影音專區資料。
    /// </summary>
    private async Task<SpecHomePageVideoSection_DTO> GetVideoSessionAsync(CancellationToken ct)
    {
        SpecHomePageVideoSection_DTO result = new()
        {
            WebResources = await QueryListAsync<WebResource, WebResource_DTO>(_webResourceService, BuildVideoListParam(), ct),
        };

        return result;
    }

    /// <summary>
    /// 查詢最新消息分頁資料。
    /// </summary>
    private async Task<List<Announcement_DTO>> QueryCategoryTabsNewsAsync(string nowIsoLocal, string? categories, CancellationToken ct)
    {
        QueryListParam param = BuildCategoryTabsNewsParam(nowIsoLocal, categories);
        List<Announcement_DTO> result = await QueryListAsync<Announcement, Announcement_DTO>(_announcementService, param, ct);

        return result;
    }

    /// <summary>
    /// 查詢公告或相簿分類資料。
    /// </summary>
    private async Task<List<Category_DTO>> QueryCategorySetsAsync(string progId, CancellationToken ct)
    {
        QueryListParam param = BuildCategoryParam(progId);
        List<Category_DTO> result = await QueryListAsync<Category, Category_DTO>(_categoryService, param, ct);

        return result;
    }

    /// <summary>
    /// 查詢公告標籤資料。
    /// </summary>
    private async Task<List<TagData_DTO>> QueryTagDatasAsync(string progId, CancellationToken ct)
    {
        QueryListParam param = BuildTagParam(progId);
        List<TagData_DTO> result = await QueryListAsync<TagData, TagData_DTO>(_tagService, param, ct);

        return result;
    }

    /// <summary>
    /// 查詢資料並轉換成 DTO 清單。
    /// </summary>
    private static async Task<List<TSet_DTO>> QueryListAsync<TSet, TSet_DTO>(IBizService<TSet> service, QueryListParam param, CancellationToken ct)
        where TSet : DbModel, ITSet
        where TSet_DTO : ITSet_DTO
    {
        IList<TSet> queryResult = await service.BizQueryListAsync(param, ct);
        List<TSet_DTO> result = queryResult.Select(DTOHelper.MapToDTO<TSet, TSet_DTO>).ToList();

        return result;
    }

    /// <summary>
    /// 建立首頁 Banner 查詢參數。
    /// </summary>
    private static QueryListParam BuildBannerSliderParam()
    {
        QueryListParam result = new()
        {
            Fields = BannerSliderFields,
            Condition = $"{nameof(Banner.BannerId)} = 1",
            OrderBy = [new OrderBySpec($"{nameof(Banner._BannerDetail)}.{nameof(BannerDetail.Sort)}")],
            PageNumber = 1,
            PageSize = 1,
        };

        return result;
    }

    /// <summary>
    /// 建立最新消息分頁查詢參數。
    /// </summary>
    private static QueryListParam BuildCategoryTabsNewsParam(string nowIsoLocal, string? categories)
    {
        QueryListParam result = new()
        {
            Fields = CategoryTabsNewsFields,
            Condition = BuildCategoryTabsNewsCondition(nowIsoLocal, categories),
            RankGroups = [new RankGroupsSpec($"{nameof(Announcement.ContentStatus)} & 1", null)],
            OrderBy = [new OrderBySpec(nameof(Announcement.Validate_Start), true)],
            PageNumber = 1,
            PageSize = CategoryTabsPageSize,
        };

        return result;
    }

    /// <summary>
    /// 建立最新消息分頁查詢條件。
    /// </summary>
    private static string BuildCategoryTabsNewsCondition(string nowIsoLocal, string? categories)
    {
        List<string> conditions =
        [
            $"{nameof(Announcement.ContentStatus)} !& 4",
            $"{nameof(Announcement.Validate_Start)} <= {nowIsoLocal}",
        ];
        AddCategoryCondition(conditions, categories);

        return string.Join(" And ", conditions);
    }

    /// <summary>
    /// 建立活動資訊查詢參數。
    /// </summary>
    private static QueryListParam BuildEventListParam(string nowIsoLocal)
    {
        QueryListParam result = new()
        {
            Fields = EventFields,
            Condition = BuildEventListCondition(nowIsoLocal),
            RankGroups = [new RankGroupsSpec($"{nameof(Announcement.ContentStatus)} & 1", null)],
            OrderBy = [new OrderBySpec(nameof(Announcement.Validate_Start), true)],
            PageNumber = 1,
            PageSize = EventPageSize,
        };

        return result;
    }

    /// <summary>
    /// 建立活動資訊查詢條件。
    /// </summary>
    private static string BuildEventListCondition(string nowIsoLocal)
    {
        List<string> conditions =
        [
            $"{nameof(Announcement.Validate_Start)} <= {nowIsoLocal}",
            $"({nameof(Announcement.Validate_End)} >= {nowIsoLocal} Or {nameof(Announcement.Validate_End)} is null)",
            $"{nameof(Announcement.Categories)} HasAny [8]",
            $"{nameof(Announcement.ContentStatus)} !& 4",
        ];

        return string.Join(" And ", conditions);
    }

    /// <summary>
    /// 建立活動花絮查詢參數。
    /// </summary>
    private static QueryListParam BuildGalleryListParam()
    {
        QueryListParam result = new()
        {
            Fields = GalleryFields,
            OrderBy = [new OrderBySpec(nameof(Gallery.Validate_Start), true)],
            PageNumber = 1,
            PageSize = GalleryPageSize,
        };

        return result;
    }

    /// <summary>
    /// 建立影音專區查詢參數。
    /// </summary>
    private static QueryListParam BuildVideoListParam()
    {
        QueryListParam result = new()
        {
            Fields = VideoFields,
            Condition = $"{nameof(WebResource.Categories)} HasAny [29,30,31,32] And {nameof(WebResource.ContentStatus)} !& 4",
            RankGroups = [new RankGroupsSpec($"{nameof(WebResource.ContentStatus)} & 1", null)],
            OrderBy = [new OrderBySpec(nameof(WebResource.CreateTime), true)],
            PageNumber = 1,
            PageSize = VideoPageSize,
        };

        return result;
    }

    /// <summary>
    /// 建立分類查詢參數。
    /// </summary>
    private static QueryListParam BuildCategoryParam(string progId)
    {
        QueryListParam result = new()
        {
            Fields = CategoryFields,
            Condition = $"{nameof(Category.ProgId)} = {progId}",
            PageNumber = 0,
            PageSize = 0,
        };

        return result;
    }

    /// <summary>
    /// 建立標籤查詢參數。
    /// </summary>
    private static QueryListParam BuildTagParam(string progId)
    {
        QueryListParam result = new()
        {
            Fields = TagFields,
            Condition = $"{nameof(TagData.ProgId)} = {progId}",
            PageNumber = 0,
            PageSize = 0,
        };

        return result;
    }

    /// <summary>
    /// 加入公告分類條件。
    /// </summary>
    private static void AddCategoryCondition(List<string> conditions, string? categories)
    {
        if (string.IsNullOrWhiteSpace(categories)) return;

        conditions.Add($"{nameof(Announcement.Categories)} HasAny [{categories}]");
    }

    /// <summary>
    /// 取得目前本機時間字串。
    /// </summary>
    private static string GetNowIsoLocal()
    {
        string result = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);

        return result;
    }
    #endregion
}
