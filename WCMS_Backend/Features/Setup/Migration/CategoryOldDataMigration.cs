using System.Data;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 將舊站 Category 資料轉為標準類別資料，並排除 Spec 模組。
/// </summary>
internal static class CategoryOldDataMigration
{
    #region Public
    /// <summary>
    /// 轉換並建立舊站類別資料。
    /// </summary>
    public static async Task MigrateAsync(BizService<Category> service, CancellationToken ct)
    {
        Category[] data = ConvertToModels();
        await service.BizInitCreateDatasAsync(data, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將舊站類別資料轉為目前資料模型。
    /// </summary>
    private static Category[] ConvertToModels()
    {
        DataSet dataSet = GetMigrationData();
        List<Category> result = [];
        foreach (DataRow row in dataSet.Tables["Category"]!.Rows)
        {
            if (OldDataMigrationSource.IsSpecModule(row["Module"].ToString())) continue;
            result.Add(BuildCategory(row, dataSet.Tables["Category_Lang"]!));
        }
        return [.. result];
    }
    /// <summary>
    /// 讀取舊站類別主檔與多語明細。
    /// </summary>
    private static DataSet GetMigrationData()
    {
        Dictionary<string, string> sqls = new()
        {
            { "Category", "SELECT * FROM Category" },
            { "Category_Lang", "SELECT * FROM Category_Lang" },
        };
        return OldDataMigrationSource.GetOldData(sqls);
    }
    /// <summary>
    /// 建立單筆類別 Graph。
    /// </summary>
    private static Category BuildCategory(DataRow row, DataTable detailTable)
    {
        Category category = new()
        {
            CategoryId = row["Sn"].ToString(),
            ProgId = OldDataMigrationSource.ChangeProgId(row["Module"].ToString()),
        };
        AddDetails(category, detailTable);
        return category;
    }
    /// <summary>
    /// 加入類別多語明細。
    /// </summary>
    private static void AddDetails(Category category, DataTable detailTable)
    {
        int rowId = 1;
        foreach (DataRow row in detailTable.AsEnumerable().Where(item => item["Sn"].ToString() == category.CategoryId))
        {
            _ = LangCodeExt.TryParse(row["Lang"].ToString(), out LangCode lang);
            category._CategoryDetail.Add(new CategoryDetail { CategoryId = category.CategoryId, RowId = rowId++, Lang = lang, CategoryName = row["CategoryName"].ToString() });
        }
    }
    #endregion
}
