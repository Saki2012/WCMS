using WCMS.Features.COMM.Category;
using WCMS.Features.COMM.Tag;
using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.Banner;
using WCMS.Features.WEB.FileArchive;
using WCMS.Features.WEB.Gallery;
using WCMS.Features.WEB.PageManagement;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.Features.WEB.WebResource;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 協調標準 Feature 舊資料與實體檔案的匯入順序。
/// </summary>
public sealed class OldDataMigrationService(
    IBizService<FileManageModel> fileService,
    IBizService<Announcement> announcementService,
    IBizService<Banner> bannerService,
    IBizService<Category> categoryService,
    IBizService<FileArchive> fileArchiveService,
    IBizService<Gallery> galleryService,
    IBizService<PageManagement> pageService,
    IBizService<TagData> tagService,
    IBizService<WebResource> webResourceService,
    IBizService<SiteMenu_IndexModel> siteMenuService)
{
    #region Property
    /// <summary>
    /// 提供舊檔案壓縮包匯入能力的實體服務。
    /// </summary>
    private FileManagementBiz FileService => fileService as FileManagementBiz
        ?? throw new InvalidOperationException($"{nameof(IBizService<FileManageModel>)} 必須由 {nameof(FileManagementBiz)} 實作。");
    #endregion

    #region Public
    /// <summary>
    /// 匯入標準 Feature 舊資料；SpecFeatures 資料不在此流程處理。
    /// </summary>
    public async Task MigrateAsync(string importLabel, CancellationToken ct = default)
    {
        IList<FileManageModel> sourceFiles = await ImportFilesAsync(importLabel, ct);
        await MigrateFeatureDataAsync(sourceFiles, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 匯入壓縮檔並讀取該批次的完整檔案資料。
    /// </summary>
    private async Task<IList<FileManageModel>> ImportFilesAsync(string importLabel, CancellationToken ct)
    {
        await FileService.ImportZip(importLabel);
        QueryListParam param = new()
        {
            Fields = [nameof(FileManageModel.InternalId)],
            Condition = $"{nameof(FileManageModel.ImportLabel)} = {importLabel}",
        };
        IList<FileManageModel> fileIds = await fileService.BizQueryListAsync(param, ct);
        return await LoadFilesAsync(fileIds, ct);
    }
    /// <summary>
    /// 依檔案 InternalId 讀取完整檔案 Graph。
    /// </summary>
    private async Task<IList<FileManageModel>> LoadFilesAsync(IEnumerable<FileManageModel> fileIds, CancellationToken ct)
    {
        List<FileManageModel> result = [];
        foreach (FileManageModel file in fileIds)
        {
            FileManageModel data = await fileService.BizQueryDataAsync(file.InternalId, ct);
            if (data != null) result.Add(data);
        }
        return result;
    }
    /// <summary>
    /// 依既有順序匯入標準 Feature 資料。
    /// </summary>
    private async Task MigrateFeatureDataAsync(IList<FileManageModel> sourceFiles, CancellationToken ct)
    {
        await AnnouncementOldDataMigration.MigrateAsync(announcementService, sourceFiles, ct);
        await BannerOldDataMigration.MigrateAsync(bannerService, sourceFiles, ct);
        await CategoryOldDataMigration.MigrateAsync(categoryService, ct);
        await FileArchiveOldDataMigration.MigrateAsync(fileArchiveService, sourceFiles, ct);
        await GalleryOldDataMigration.MigrateAsync(galleryService, sourceFiles, ct);
        await PageManagementOldDataMigration.MigrateAsync(pageService, sourceFiles, ct);
        await TagOldDataMigration.MigrateAsync(tagService, ct);
        await WebResourceOldDataMigration.MigrateAsync(webResourceService, sourceFiles, ct);
        await SiteMenuOldDataMigration.MigrateAsync(siteMenuService, pageService, ct);
    }
    #endregion
}
