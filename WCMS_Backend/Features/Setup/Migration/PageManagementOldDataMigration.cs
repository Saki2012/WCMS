using System.Data;
using WCMS.Features.WEB.PageManagement;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.PlatformServices.FileManagement;
using static WCMS.SysCore.Library.LibData;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 將舊站 Page 資料轉為標準頁面維護資料。
/// </summary>
internal static class PageManagementOldDataMigration
{
    #region Public
    /// <summary>
    /// 轉換並建立舊站頁面資料。
    /// </summary>
    public static async Task MigrateAsync(IBizService<PageManagement> service, IList<FileManage> sourceFiles, CancellationToken ct)
    {
        List<FileManage> usedFiles = [];
        PageManagement[] data = ConvertToModels(sourceFiles, usedFiles);
        OldDataMigrationSource.MarkFiles(usedFiles, service.ProgId);
        await service.BizInitCreateDatasAsync(data, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊站頁面資料轉為目前資料模型。
    /// </summary>
    private static PageManagement[] ConvertToModels(IList<FileManage> sourceFiles, List<FileManage> usedFiles)
    {
        DataSet dataSet = GetMigrationData();
        Dictionary<string, string> fileMap = OldDataMigrationSource.BuildFilePathMap(sourceFiles);
        List<PageManagement> result = [];
        foreach (DataRow row in dataSet.Tables["Page"]!.Rows)
            result.Add(BuildPage(row, dataSet.Tables["Page_Lang"]!, sourceFiles, fileMap, usedFiles));
        return [.. result];
    }
    /// <summary>
    /// 讀取舊站頁面主檔與多語明細。
    /// </summary>
    private static DataSet GetMigrationData()
    {
        Dictionary<string, string> sqls = new()
        {
            { "Page", "SELECT * FROM Page" },
            { "Page_Lang", "SELECT * FROM Page_Lang" },
        };
        return OldDataMigrationSource.GetOldData(sqls);
    }
    /// <summary>
    /// 建立單筆頁面 Graph。
    /// </summary>
    private static PageManagement BuildPage(DataRow row, DataTable languageTable, IList<FileManage> sourceFiles, Dictionary<string, string> fileMap, List<FileManage> usedFiles)
    {
        PageManagement result = new()
        {
            PageId = row["Sn"].ToString(),
            CategoryId = row["Category"].ToString(),
            CreateTime = row["CreateTime"].ToString().ToDateTime(),
            ModifyTime = row["UpdateTime"].ToString().ToDateTime(),
        };
        AddLanguageDetails(result, languageTable, sourceFiles, fileMap, usedFiles);
        return result;
    }
    /// <summary>
    /// 加入頁面多語明細並記錄內文使用檔案。
    /// </summary>
    private static void AddLanguageDetails(PageManagement data, DataTable languageTable, IList<FileManage> sourceFiles, Dictionary<string, string> fileMap, List<FileManage> usedFiles)
    {
        IEnumerable<DataRow> rows = languageTable.AsEnumerable().Where(row => row["Sn"].ToString() == data.PageId);
        int rowId = 1;
        foreach (DataRow row in rows)
        {
            PageManagementDetail? detail = BuildLanguageDetail(data.PageId, rowId++, row, sourceFiles, fileMap, usedFiles);
            if (detail != null) data._PageManagementDetail.Add(detail);
        }
    }
    /// <summary>
    /// 建立單筆頁面多語明細。
    /// </summary>
    private static PageManagementDetail? BuildLanguageDetail(string pageId, int rowId, DataRow row, IList<FileManage> sourceFiles, Dictionary<string, string> fileMap, List<FileManage> usedFiles)
    {
        if (row["Title"].IsNullOrEmpty()) return null;
        string content = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(row["Content"].ToString(), fileMap, out List<string> usedIds);
        usedFiles.AddRange(sourceFiles.Where(file => usedIds.Contains(file.InternalId)));
        _ = LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
        return new PageManagementDetail { PageId = pageId, RowId = rowId, Lang = lang, Title = row["Title"].ToString(), Content = content };
    }
    #endregion
}
