using Microsoft.Data.SqlClient;
using System.Data;
using WCMS.Features.WEB.Content;
using WCMS.SysCore.Constants;
using WCMS.SysCore.Persistence;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 提供舊資料庫讀取、共用欄位轉換與匯入檔案查找能力。
/// </summary>
internal static class OldDataMigrationSource
{
    #region Property
    /// <summary>
    /// 舊資料檔案匯入的預設批次標籤。
    /// </summary>
    public const string DefaultImportLabel = "1810";
    /// <summary>
    /// 舊站中不納入標準 Feature 匯入的 Spec 模組名稱。
    /// </summary>
    private static readonly HashSet<string> SpecModules = new(StringComparer.OrdinalIgnoreCase)
    {
        "ResearchProject",
        "USRProject",
        "SpecResearch",
        "SpecUSR",
        "SpecCategory",
    };
    #endregion

    #region Public
    /// <summary>
    /// 依資料表名稱與 SQL 讀取舊資料庫資料集。
    /// </summary>
    public static DataSet GetOldData(IReadOnlyDictionary<string, string> sqls)
    {
        string connectionString = LibDataAccess.Configuration.GetConnectionString(SysParam.Configuration.ConnectionStrings.OldSqlConnection)
            ?? throw new InvalidOperationException($"找不到舊資料庫連線：{SysParam.Configuration.ConnectionStrings.OldSqlConnection}");
        using SqlConnection connection = new(connectionString);
        DataSet result = new();
        foreach ((string tableName, string query) in sqls) AddTable(result, connection, tableName, query);
        return result;
    }
    /// <summary>
    /// 將舊站模組名稱轉為目前標準 Feature ProgId。
    /// </summary>
    public static string ChangeProgId(string module)
    {
        return module switch
        {
            "Page" => "PageManagement",
            "News" => "Announcement",
            "Archive" => "FileArchive",
            _ => module,
        };
    }
    /// <summary>
    /// 判斷舊站模組是否屬於 Spec 客製功能。
    /// </summary>
    public static bool IsSpecModule(string? module)
    {
        return !string.IsNullOrWhiteSpace(module) && SpecModules.Contains(module);
    }
    /// <summary>
    /// 將舊站狀態字串轉為內容狀態旗標。
    /// </summary>
    public static ContentStatus ParseContentStatus(string? status)
    {
        ContentStatus result = ContentStatus.None;
        foreach (string item in (status ?? string.Empty).Split(',')) result |= ParseContentStatusItem(item);
        return result;
    }
    /// <summary>
    /// 建立來源實體路徑與檔案 InternalId 對照。
    /// </summary>
    public static Dictionary<string, string> BuildFilePathMap(IEnumerable<FileManageModel> files)
    {
        return files.SelectMany(file => file._FileManage_SyncInfo)
            .GroupBy(info => info.SrcFullPath, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First().InternalId, StringComparer.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 依舊站來源完整路徑取得已匯入檔案。
    /// </summary>
    public static FileManageModel? FindImportedFile(IEnumerable<FileManageModel> files, string sourcePath)
    {
        return files.FirstOrDefault(file => file._FileManage_SyncInfo.Any(info => info.SrcFullPath.Equals(sourcePath, StringComparison.OrdinalIgnoreCase)));
    }
    /// <summary>
    /// 將實際使用的匯入檔案標記為指定功能。
    /// </summary>
    public static void MarkFiles(IEnumerable<FileManageModel> files, string progId)
    {
        foreach (FileManageModel file in files.Distinct()) file.ProgId = progId;
    }
    #endregion

    #region Private
    /// <summary>
    /// 將單一查詢結果加入舊資料資料集。
    /// </summary>
    private static void AddTable(DataSet dataSet, SqlConnection connection, string tableName, string query)
    {
        using SqlDataAdapter adapter = new(query, connection);
        DataTable table = new(tableName);
        adapter.Fill(table);
        dataSet.Tables.Add(table);
    }
    /// <summary>
    /// 轉換單一舊站狀態值。
    /// </summary>
    private static ContentStatus ParseContentStatusItem(string status)
    {
        return status.Trim().ToLowerInvariant() switch
        {
            "hide" => ContentStatus.Hidden,
            "hot" => ContentStatus.Hot,
            "top" => ContentStatus.Top,
            _ => ContentStatus.None,
        };
    }
    #endregion
}
