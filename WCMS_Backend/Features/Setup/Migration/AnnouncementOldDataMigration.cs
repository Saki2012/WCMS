using System.Data;
using WCMS.Features.WEB.Announcement;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Runtime;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 將舊站 News 資料轉為標準公告資料。
/// </summary>
internal static class AnnouncementOldDataMigration
{
    #region Public
    /// <summary>
    /// 轉換並建立舊站公告資料。
    /// </summary>
    public static async Task MigrateAsync(IBizService<Announcement> service, IList<FileManageModel> sourceFiles, CancellationToken ct)
    {
        List<FileManageModel> usedFiles = [];
        Announcement[] data = ConvertToModels(sourceFiles, usedFiles);
        OldDataMigrationSource.MarkFiles(usedFiles, service.ProgId);
        await service.BizInitCreateDatasAsync(data, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊站公告資料轉為目前資料模型。
    /// </summary>
    private static Announcement[] ConvertToModels(IList<FileManageModel> sourceFiles, List<FileManageModel> usedFiles)
    {
        DataSet dataSet = GetMigrationData();
        Dictionary<string, string> fileMap = OldDataMigrationSource.BuildFilePathMap(sourceFiles);
        List<Announcement> result = [];
        foreach (DataRow row in dataSet.Tables["Announcement"]!.Rows)
            result.Add(BuildAnnouncement(row, dataSet, sourceFiles, fileMap, usedFiles));
        return [.. result];
    }
    /// <summary>
    /// 讀取舊站公告主檔與多語明細。
    /// </summary>
    private static DataSet GetMigrationData()
    {
        Dictionary<string, string> sqls = new()
        {
            { "Announcement", "SELECT * FROM News" },
            { "AnnouncementDetail", "SELECT * FROM News_Lang" },
        };
        return OldDataMigrationSource.GetOldData(sqls);
    }
    /// <summary>
    /// 建立單筆舊站公告與所屬明細。
    /// </summary>
    private static Announcement BuildAnnouncement(DataRow row, DataSet dataSet, IList<FileManageModel> sourceFiles, Dictionary<string, string> fileMap, List<FileManageModel> usedFiles)
    {
        Announcement data = CreateAnnouncementHeader(row);
        ApplyPicture(data, row, sourceFiles, usedFiles);
        data._AnnouncementDetail = BuildDetails(data.AnnouncementId, dataSet, sourceFiles, fileMap, usedFiles);
        return data;
    }
    /// <summary>
    /// 建立舊站公告主檔欄位。
    /// </summary>
    private static Announcement CreateAnnouncementHeader(DataRow row)
    {
        return new Announcement
        {
            AnnouncementId = row["Sn"].ToString(),
            Categories = row["Category"].ToString(),
            Tags = row["Tag"].ToString(),
            ContentStatus = OldDataMigrationSource.ParseContentStatus(row["Status"].ToString()),
            Validate_Start = Convert.ToDateTime(row["StartDate"]),
            Validate_End = Convert.ToDateTime(row["EndDate"]),
            CreateTime = Convert.ToDateTime(row["CreateTime"]),
            ModifyTime = Convert.ToDateTime(row["UpdateTime"]),
            PicDescription = row["PicDescription"].ToString(),
        };
    }
    /// <summary>
    /// 綁定公告代表圖片與描述。
    /// </summary>
    private static void ApplyPicture(Announcement data, DataRow row, IList<FileManageModel> sourceFiles, List<FileManageModel> usedFiles)
    {
        string fileName = row["Pic"].ToString();
        if (fileName.IsNullOrEmpty()) return;
        FileManageModel? file = OldDataMigrationSource.FindImportedFile(sourceFiles, $"File/News/{fileName}");
        if (file == null) return;
        file.FileName = fileName;
        if (!data.PicDescription.IsNullOrEmpty()) file.FileDescription = data.PicDescription;
        data.PictureId = file.InternalId;
        usedFiles.Add(file);
    }
    /// <summary>
    /// 建立公告多語明細與附件。
    /// </summary>
    private static List<AnnouncementDetail> BuildDetails(string announcementId, DataSet dataSet, IList<FileManageModel> sourceFiles, Dictionary<string, string> fileMap, List<FileManageModel> usedFiles)
    {
        List<AnnouncementDetail> result = [];
        IEnumerable<DataRow> rows = dataSet.Tables["AnnouncementDetail"]!.AsEnumerable().Where(row => row["Sn"].ToString() == announcementId);
        foreach (DataRow row in rows)
        {
            AnnouncementDetail? detail = BuildDetail(announcementId, result.Count + 1, row, sourceFiles, fileMap, usedFiles);
            if (detail != null) result.Add(detail);
        }
        return result;
    }
    /// <summary>
    /// 建立單一公告語系明細。
    /// </summary>
    private static AnnouncementDetail? BuildDetail(string announcementId, int rowId, DataRow row, IList<FileManageModel> sourceFiles, Dictionary<string, string> fileMap, List<FileManageModel> usedFiles)
    {
        if (row["Title"].IsNullOrEmpty() || row["Content"].IsNullOrEmpty()) return null;
        string content = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(row["Content"].ToString(), fileMap, out List<string> usedIds);
        usedFiles.AddRange(sourceFiles.Where(file => usedIds.Contains(file.InternalId)));
        _ = LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
        AnnouncementDetail detail = new() { AnnouncementId = announcementId, RowId = rowId, Lang = lang, Title = row["Title"].ToString(), Content = content, SubTitle = row["SubTitle"].ToString(), Url = row["Url"].ToString() };
        detail._AnnouncementDetailFile = BuildDetailFiles(announcementId, rowId, row, sourceFiles, usedFiles);
        return detail;
    }
    /// <summary>
    /// 建立單一公告明細的附件集合。
    /// </summary>
    private static List<AnnouncementDetailFile> BuildDetailFiles(string announcementId, int parentRowId, DataRow row, IList<FileManageModel> sourceFiles, List<FileManageModel> usedFiles)
    {
        List<AnnouncementDetailFile> result = [];
        for (int rowId = 1; rowId < 10; rowId++)
        {
            AnnouncementDetailFile? detail = BuildDetailFile(announcementId, parentRowId, rowId, row, sourceFiles, usedFiles);
            if (detail != null) result.Add(detail);
        }
        return result;
    }
    /// <summary>
    /// 建立單一公告附件資料。
    /// </summary>
    private static AnnouncementDetailFile? BuildDetailFile(string announcementId, int parentRowId, int rowId, DataRow row, IList<FileManageModel> sourceFiles, List<FileManageModel> usedFiles)
    {
        string fileName = row[$"Filename{rowId}"].ToString();
        string sourceName = row[$"File{rowId}"].ToString();
        if (fileName.IsNullOrEmpty() || sourceName.IsNullOrEmpty()) return null;
        FileManageModel? file = OldDataMigrationSource.FindImportedFile(sourceFiles, $"File/News/{sourceName}");
        if (file == null) return null;
        file.FileName = fileName;
        file.FileDescription = fileName;
        usedFiles.Add(file);
        return new() { AnnouncementId = announcementId, ParentRowId = parentRowId, RowId = rowId, FileId = file.InternalId, FileName = fileName };
    }
    #endregion
}
