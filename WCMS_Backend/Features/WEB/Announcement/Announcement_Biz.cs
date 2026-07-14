using System.Data;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.PlatformServices.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;
namespace WCMS.Features.WEB.Announcement;

/// <summary>
/// 公告資料維護與舊資料轉換。
/// </summary>
[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Announcement)]
public class AnnouncementBiz(BizDeps bizDeps) : BizService<Announcement>(bizDeps), IBizService<Announcement>
{
    #region Public
    /// <summary>
    /// 匯入舊站公告資料。
    /// </summary>
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageModel>? srcFiles = null)
    {
        _ = importFileLabel;
        Announcement[] data = ConvertToApiModel(srcFiles ?? []);
        await BizInitCreateDatasAsync(data);
    }
    #endregion

    #region Protected Virtual
    /// <summary>
    /// 保存前驗證並整理公告資料。
    /// </summary>
    protected override async Task BeforeUpdate(Announcement data, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(data, act, ct);
        if (act is not FuncAction.Create and not FuncAction.Update) return;
        CheckData(data);
        RemergeData(data);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 驗證公告日期、類別與 AA 內容。
    /// </summary>
    protected void CheckData(Announcement data)
    {
        CheckAAContent(data._AnnouncementDetail);
        CheckRequiredData(data);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊站公告資料轉為目前 API Model。
    /// </summary>
    private Announcement[] ConvertToApiModel(IList<FileManageModel> srcFiles)
    {
        DataSet dataSet = GetMigrationData();
        Dictionary<string, string> fileMap = BuildFilePathMap(srcFiles);
        List<FileManageModel> usedFiles = [];
        List<Announcement> result = [];
        foreach (DataRow row in dataSet.Tables["Announcement"].Rows)
            result.Add(BuildAnnouncement(row, dataSet, srcFiles, fileMap, usedFiles));
        foreach (FileManageModel file in usedFiles.Distinct()) file.ProgId = ProgId;
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
        return MigrateOldData.GetOldData(sqls);
    }
    /// <summary>
    /// 建立單筆舊站公告與所屬明細。
    /// </summary>
    private Announcement BuildAnnouncement(DataRow row, DataSet dataSet, IList<FileManageModel> srcFiles, Dictionary<string, string> fileMap, List<FileManageModel> usedFiles)
    {
        Announcement data = CreateAnnouncementHeader(row);
        ApplyPicture(data, row, srcFiles, usedFiles);
        data._AnnouncementDetail = BuildAnnouncementDetails(data.AnnouncementId, dataSet, srcFiles, fileMap, usedFiles);
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
            ContentStatus = GetContentStatus(row["Status"].ToString()),
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
    private static void ApplyPicture(Announcement data, DataRow row, IList<FileManageModel> srcFiles, List<FileManageModel> usedFiles)
    {
        string fileName = row["Pic"].ToString();
        if (fileName.IsNullOrEmpty()) return;
        FileManageModel? file = FindImportedFile(fileName, srcFiles, "File/News");
        if (file == null) return;
        file.FileName = fileName;
        if (!data.PicDescription.IsNullOrEmpty()) file.FileDescription = data.PicDescription;
        data.PictureId = file.InternalId;
        usedFiles.Add(file);
    }
    /// <summary>
    /// 建立公告多語明細與附件。
    /// </summary>
    private static List<AnnouncementDetail> BuildAnnouncementDetails(string announcementId, DataSet dataSet, IList<FileManageModel> srcFiles, Dictionary<string, string> fileMap, List<FileManageModel> usedFiles)
    {
        List<AnnouncementDetail> result = [];
        IEnumerable<DataRow> rows = dataSet.Tables["AnnouncementDetail"].AsEnumerable().Where(row => row["Sn"].ToString() == announcementId);
        foreach (DataRow row in rows)
        {
            AnnouncementDetail? detail = BuildAnnouncementDetail(announcementId, result.Count + 1, row, fileMap, usedFiles, srcFiles);
            if (detail != null) result.Add(detail);
        }
        return result;
    }
    /// <summary>
    /// 建立單一公告語系明細。
    /// </summary>
    private static AnnouncementDetail? BuildAnnouncementDetail(string announcementId, int rowId, DataRow row, Dictionary<string, string> fileMap, List<FileManageModel> usedFiles, IList<FileManageModel> srcFiles)
    {
        if (row["Title"].IsNullOrEmpty() || row["Content"].IsNullOrEmpty()) return null;
        string content = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(row["Content"].ToString(), fileMap, out List<string> usedIds);
        usedFiles.AddRange(srcFiles.Where(file => usedIds.Contains(file.InternalId)));
        LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
        AnnouncementDetail detail = new() { AnnouncementId = announcementId, RowId = rowId, Lang = lang, Title = row["Title"].ToString(), Content = content, SubTitle = row["SubTitle"].ToString(), Url = row["Url"].ToString() };
        detail._AnnouncementDetailFile = BuildDetailFiles(announcementId, rowId, row, srcFiles, usedFiles);
        return detail;
    }
    /// <summary>
    /// 建立單一公告明細的附件集合。
    /// </summary>
    private static List<AnnouncementDetailFile> BuildDetailFiles(string announcementId, int parentRowId, DataRow row, IList<FileManageModel> srcFiles, List<FileManageModel> usedFiles)
    {
        List<AnnouncementDetailFile> result = [];
        for (int rowId = 1; rowId < 10; rowId++)
        {
            string fileName = row[$"Filename{rowId}"].ToString();
            string sourceName = row[$"File{rowId}"].ToString();
            FileManageModel? file = FindImportedFile(sourceName, srcFiles, "File/News");
            if (fileName.IsNullOrEmpty() || sourceName.IsNullOrEmpty() || file == null) continue;
            file.FileName = fileName;
            file.FileDescription = fileName;
            usedFiles.Add(file);
            result.Add(new() { AnnouncementId = announcementId, ParentRowId = parentRowId, RowId = rowId, FileId = file.InternalId, FileName = fileName });
        }
        return result;
    }
    /// <summary>
    /// 建立來源完整路徑與檔案 InternalId 對照。
    /// </summary>
    private static Dictionary<string, string> BuildFilePathMap(IList<FileManageModel> files)
    {
        return files.SelectMany(file => file._FileManage_SyncInfo).GroupBy(info => info.SrcFullPath).ToDictionary(group => group.Key, group => group.First().InternalId);
    }
    /// <summary>
    /// 依舊站來源路徑取得匯入檔案。
    /// </summary>
    private static FileManageModel? FindImportedFile(string sourceName, IList<FileManageModel> files, string sourceFolder)
    {
        if (sourceName.IsNullOrEmpty()) return null;
        string sourcePath = $"{sourceFolder}/{sourceName}";
        return files.FirstOrDefault(file => file._FileManage_SyncInfo.Any(info => info.SrcFullPath.Equals(sourcePath, StringComparison.OrdinalIgnoreCase)));
    }
    /// <summary>
    /// 將舊站狀態字串轉為內容狀態旗標。
    /// </summary>
    private static ContentStatus GetContentStatus(string status)
    {
        ContentStatus result = ContentStatus.None;
        foreach (string item in status.Split(','))
        {
            result |= item.Trim().ToLowerInvariant() switch
            {
                "hide" => ContentStatus.Hidden,
                "hot" => ContentStatus.Hot,
                "top" => ContentStatus.Top,
                _ => ContentStatus.None,
            };
        }
        return result;
    }
    /// <summary>
    /// 檢查公告多語標題與內容 AA 規則。
    /// </summary>
    private void CheckAAContent(IEnumerable<AnnouncementDetail> details)
    {
        if (!SpecSettings.AACheck) return;
        foreach (AnnouncementDetail detail in details)
        {
            if (detail.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00003, detail.Lang.ToLabel(), I18n.GetLabel<AnnouncementDetail>(item => item.Title));
            if (LibAAData.CheckAAContent(detail.Content, Message, I18n, out string content)) detail.Content = content;
        }
    }
    /// <summary>
    /// 檢查公告日期與類別必填規則。
    /// </summary>
    private void CheckRequiredData(Announcement data)
    {
        if (data.Validate_Start == default) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<Announcement>(item => item.Validate_Start));
        if (data.Validate_End != default && data.Validate_Start >= data.Validate_End) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, I18n.GetLabel<Announcement>(item => item.Validate_End), I18n.GetLabel<Announcement>(item => item.Validate_Start));
        if (data.Categories.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<Announcement>(item => item.Categories));
    }
    /// <summary>
    /// 正規化公告類別與標籤字串。
    /// </summary>
    private static void RemergeData(Announcement data)
    {
        data.Categories = data.Categories.Remerge(",");
        data.Tags = data.Tags.Remerge(",");
    }
    #endregion
}
