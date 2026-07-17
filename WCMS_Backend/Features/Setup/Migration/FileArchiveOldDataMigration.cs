using System.Data;
using WCMS.Features.WEB.FileArchive;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 將舊站 Archive 資料轉為標準檔案室資料。
/// </summary>
internal static class FileArchiveOldDataMigration
{
    #region Public
    /// <summary>
    /// 轉換並建立舊站檔案室資料。
    /// </summary>
    public static async Task MigrateAsync(BizService<FileArchive> service, IList<FileManage> sourceFiles, CancellationToken ct)
    {
        List<FileManage> usedFiles = [];
        FileArchive[] data = ConvertToModels(sourceFiles, usedFiles);
        OldDataMigrationSource.MarkFiles(usedFiles, service.ProgId);
        await service.BizInitCreateDatasAsync(data, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊站檔案室資料轉為目前資料模型。
    /// </summary>
    private static FileArchive[] ConvertToModels(IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        DataSet dataSet = GetMigrationData();
        List<FileArchive> result = [];
        foreach (DataRow row in dataSet.Tables["Archive"]!.Rows)
            result.Add(BuildFileArchive(row, dataSet.Tables["Archive_Lang"]!, sourceFiles, usedFiles));
        return [.. result];
    }
    /// <summary>
    /// 讀取舊站檔案室主檔與多語明細。
    /// </summary>
    private static DataSet GetMigrationData()
    {
        Dictionary<string, string> sqls = new()
        {
            { "Archive", "SELECT * FROM Archive" },
            { "Archive_Lang", "SELECT * FROM Archive_Lang" },
        };
        return OldDataMigrationSource.GetOldData(sqls);
    }
    /// <summary>
    /// 建立單筆檔案室 Graph。
    /// </summary>
    private static FileArchive BuildFileArchive(DataRow row, DataTable languageTable, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        FileArchive result = new()
        {
            FileArchiveId = row["Sn"].ToString(),
            CategoriesId = row["Category"].ToString(),
            TagsId = row["Tag"].ToString(),
            ContentStatus = OldDataMigrationSource.ParseContentStatus(row["Status"].ToString()),
            CreateTime = row["CreateTime"].ToString().ToDateTime(),
            ModifyTime = row["UpdateTime"].ToString().ToDateTime(),
        };
        AddLanguageDetails(result, languageTable, sourceFiles, usedFiles);
        return result;
    }
    /// <summary>
    /// 加入檔案室多語明細與附件。
    /// </summary>
    private static void AddLanguageDetails(FileArchive data, DataTable languageTable, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        IEnumerable<DataRow> rows = languageTable.AsEnumerable().Where(row => row["Sn"].ToString() == data.FileArchiveId);
        int rowId = 1;
        foreach (DataRow row in rows)
        {
            FileArchiveInfo? info = BuildLanguageDetail(data.FileArchiveId, rowId++, row, sourceFiles, usedFiles);
            if (info != null) data._FileArchiveInfo.Add(info);
        }
    }
    /// <summary>
    /// 建立單筆檔案室多語明細。
    /// </summary>
    private static FileArchiveInfo? BuildLanguageDetail(string fileArchiveId, int rowId, DataRow row, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        if (row["Title"].IsNullOrEmpty()) return null;
        _ = LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
        FileArchiveInfo result = new() { FileArchiveId = fileArchiveId, RowId = rowId, Lang = lang, Title = row["Title"].ToString() };
        result._FileArchiveDetail = BuildFiles(fileArchiveId, rowId, row, sourceFiles, usedFiles);
        return result;
    }
    /// <summary>
    /// 建立檔案室附件集合。
    /// </summary>
    private static List<FileArchiveDetail> BuildFiles(string fileArchiveId, int parentRowId, DataRow row, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        List<FileArchiveDetail> result = [];
        for (int rowId = 1; rowId < 10; rowId++)
        {
            FileArchiveDetail? detail = BuildFile(fileArchiveId, parentRowId, rowId, row, sourceFiles, usedFiles);
            if (detail != null) result.Add(detail);
        }
        return result;
    }
    /// <summary>
    /// 建立單筆檔案室附件。
    /// </summary>
    private static FileArchiveDetail? BuildFile(string fileArchiveId, int parentRowId, int rowId, DataRow row, IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        string fileName = row[$"Filename{rowId}"].ToString();
        string sourceName = row[$"File{rowId}"].ToString();
        if (fileName.IsNullOrEmpty() || sourceName.IsNullOrEmpty()) return null;
        FileManage? file = OldDataMigrationSource.FindImportedFile(sourceFiles, $"File/Archive/{sourceName}");
        if (file == null) return null;
        file.FileName = fileName;
        file.FileDescription = fileName;
        usedFiles.Add(file);
        return new() { FileArchiveId = fileArchiveId, ParentRowId = parentRowId, RowId = rowId, FileSrcId = file.InternalId, FileName = fileName };
    }
    #endregion
}
