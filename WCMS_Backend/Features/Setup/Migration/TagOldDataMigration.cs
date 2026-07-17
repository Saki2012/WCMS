using System.Data;
using WCMS.Features.COMM.Tag;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 將舊站 Tag 資料轉為標準標籤資料，並排除 Spec 模組。
/// </summary>
internal static class TagOldDataMigration
{
    #region Public
    /// <summary>
    /// 轉換並建立舊站標籤資料。
    /// </summary>
    public static async Task MigrateAsync(BizService<TagData> service, CancellationToken ct)
    {
        TagData[] data = ConvertToModels();
        await service.BizInitCreateDatasAsync(data, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊站標籤資料轉為目前資料模型。
    /// </summary>
    private static TagData[] ConvertToModels()
    {
        DataSet dataSet = GetMigrationData();
        List<TagData> result = [];
        foreach (DataRow row in dataSet.Tables["Tag"]!.Rows)
        {
            if (OldDataMigrationSource.IsSpecModule(row["Module"].ToString())) continue;
            result.Add(BuildTag(row, dataSet.Tables["Tag_Lang"]!));
        }
        return [.. result];
    }
    /// <summary>
    /// 讀取舊站標籤主檔與多語明細。
    /// </summary>
    private static DataSet GetMigrationData()
    {
        Dictionary<string, string> sqls = new()
        {
            { "Tag", "SELECT * FROM Tag" },
            { "Tag_Lang", "SELECT * FROM Tag_Lang" },
        };
        return OldDataMigrationSource.GetOldData(sqls);
    }
    /// <summary>
    /// 建立單筆標籤與多語明細 Graph。
    /// </summary>
    private static TagData BuildTag(DataRow row, DataTable detailTable)
    {
        TagData data = new() { TagId = row["Sn"].ToString(), ProgId = OldDataMigrationSource.ChangeProgId(row["Module"].ToString()) };
        IEnumerable<DataRow> rows = detailTable.AsEnumerable().Where(item => item["Sn"].ToString() == data.TagId);
        int rowId = 1;
        foreach (DataRow detailRow in rows) data._TagDetail.Add(BuildTagDetail(data.TagId, rowId++, detailRow));
        return data;
    }
    /// <summary>
    /// 建立單筆標籤多語明細。
    /// </summary>
    private static TagDetail BuildTagDetail(string tagId, int rowId, DataRow row)
    {
        _ = LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
        return new TagDetail { TagId = tagId, RowId = rowId, Lang = lang, TagName = row["TagName"].ToString() };
    }
    #endregion
}
