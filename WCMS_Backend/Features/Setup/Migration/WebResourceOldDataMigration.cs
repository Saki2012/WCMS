using System.Data;
using WCMS.Features.WEB.Content;
using WCMS.Features.WEB.WebResource;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 將舊站 WebResource 資料轉為標準網路資源資料。
/// </summary>
internal static class WebResourceOldDataMigration
{
    #region Public
    /// <summary>
    /// 轉換並建立舊站網路資源資料。
    /// </summary>
    public static async Task MigrateAsync(IBizService<WebResource> service, IList<FileManageModel> sourceFiles, CancellationToken ct)
    {
        List<FileManageModel> usedFiles = [];
        WebResource[] data = ConvertToModels(sourceFiles, usedFiles);
        OldDataMigrationSource.MarkFiles(usedFiles, service.ProgId);
        await service.BizInitCreateDatasAsync(data, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊站網路資源資料轉為目前資料模型。
    /// </summary>
    private static WebResource[] ConvertToModels(IList<FileManageModel> sourceFiles, List<FileManageModel> usedFiles)
    {
        DataSet dataSet = GetMigrationData();
        List<WebResource> result = [];
        foreach (DataRow row in dataSet.Tables["WebResource"]!.Rows)
            result.Add(BuildWebResource(row, dataSet.Tables["WebResource_Lang"]!, sourceFiles, usedFiles));
        return [.. result];
    }
    /// <summary>
    /// 讀取舊站網路資源主檔與多語明細。
    /// </summary>
    private static DataSet GetMigrationData()
    {
        Dictionary<string, string> sqls = new()
        {
            { "WebResource", "SELECT * FROM WebResource" },
            { "WebResource_Lang", "SELECT * FROM WebResource_Lang" },
        };
        return OldDataMigrationSource.GetOldData(sqls);
    }
    /// <summary>
    /// 建立單筆網路資源 Graph。
    /// </summary>
    private static WebResource BuildWebResource(DataRow row, DataTable languageTable, IList<FileManageModel> sourceFiles, List<FileManageModel> usedFiles)
    {
        string pictureId = ResolvePicture(row, sourceFiles, usedFiles);
        WebResource result = new()
        {
            WebResourceId = row["Sn"].ToString(),
            PicId = pictureId,
            PicDescription = row["PicDescription"].ToString(),
            Categories = row["Category"].ToString(),
            ContentStatus = OldDataMigrationSource.ParseContentStatus(row["Status"].ToString()),
            Tags = row["Tag"].ToString(),
            CreateTime = row["CreateTime"].ToString().ToDateTime(),
            ModifyTime = row["UpdateTime"].ToString().ToDateTime(),
        };
        AddLanguageDetails(result, languageTable);
        return result;
    }
    /// <summary>
    /// 取得網路資源代表圖片 InternalId。
    /// </summary>
    private static string ResolvePicture(DataRow row, IList<FileManageModel> sourceFiles, List<FileManageModel> usedFiles)
    {
        string fileName = row["Pic"].ToString();
        if (fileName.IsNullOrEmpty()) return string.Empty;
        FileManageModel? file = OldDataMigrationSource.FindImportedFile(sourceFiles, $"File/WebResource/{fileName}");
        if (file == null) return string.Empty;
        string description = row["PicDescription"].ToString();
        file.FileName = fileName;
        if (!description.IsNullOrEmpty()) file.FileDescription = description;
        usedFiles.Add(file);
        return file.InternalId;
    }
    /// <summary>
    /// 加入網路資源多語明細。
    /// </summary>
    private static void AddLanguageDetails(WebResource data, DataTable languageTable)
    {
        IEnumerable<DataRow> rows = languageTable.AsEnumerable().Where(row => row["Sn"].ToString() == data.WebResourceId);
        int rowId = 1;
        foreach (DataRow row in rows)
        {
            WebResourceInfo? detail = BuildLanguageDetail(data.WebResourceId, rowId++, row);
            if (detail != null) data._WebResourceInfo.Add(detail);
        }
    }
    /// <summary>
    /// 建立單筆網路資源多語明細。
    /// </summary>
    private static WebResourceInfo? BuildLanguageDetail(string webResourceId, int rowId, DataRow row)
    {
        if (row["Title"].IsNullOrEmpty()) return null;
        _ = LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
        return new WebResourceInfo
        {
            WebResourceId = webResourceId,
            RowId = rowId,
            Lang = lang,
            Title = row["Title"].ToString(),
            Content = row["Content"].ToString(),
            ResUrl = row["Url"].ToString(),
            Url_OpenType = row["URL_Open"].ToString() == "2" ? WindowTarget.Blank : WindowTarget.Self,
        };
    }
    #endregion
}
