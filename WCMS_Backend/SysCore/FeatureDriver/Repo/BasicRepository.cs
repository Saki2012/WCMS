using System.Linq.Expressions;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Repo.Operations.Query;
using WCMS.SysCore.FeatureDriver.Repo.Operations.Write;
using WCMS.SysCore.Persistence;
namespace WCMS.SysCore.FeatureDriver.Repo;

/// <summary>
/// 提供 DB Model Repository 的統一公開入口，實際讀寫流程交由 Operations 處理。
/// </summary>
public class BasicRepository<TDbModel>(ApplicationDbContext dataAccess, RepositoryQueryOperations<TDbModel> queryOperations, RepositoryWriteOperations<TDbModel> writeOperations)
    where TDbModel : DbModel
{
    #region Property
    /// <summary>
    /// 目前 Repository 使用的資料庫存取內容。
    /// </summary>
    public ApplicationDbContext DataAccess { get; } = dataAccess;
    /// <summary>
    /// Repository 讀取操作。
    /// </summary>
    private RepositoryQueryOperations<TDbModel> QueryOperations { get; } = queryOperations;
    /// <summary>
    /// Repository 寫入操作。
    /// </summary>
    private RepositoryWriteOperations<TDbModel> WriteOperations { get; } = writeOperations;
    #endregion

    #region Public
    /// <summary>
    /// 將單一 Entity 加入目前 DbContext。
    /// </summary>
    public async Task CreateAsync(TDbModel newData, CancellationToken ct = default)
    {
        await WriteOperations.CreateAsync(newData, ct);
    }
    /// <summary>
    /// 將新資料差異套用至目前 Entity。
    /// </summary>
    public async Task UpdateAsync(TDbModel oldData, TDbModel newData, CancellationToken ct = default)
    {
        await WriteOperations.UpdateAsync(oldData, newData, ct);
    }
    /// <summary>
    /// 將單一 Entity 標記為刪除。
    /// </summary>
    public async Task<bool> DeleteAsync(TDbModel oldData, CancellationToken ct = default)
    {
        return await WriteOperations.DeleteAsync(oldData, ct);
    }
    /// <summary>
    /// 依 EF Core Primary Key 查詢單一 Entity。
    /// </summary>
    /// <remarks>
    /// 本方法直接使用 DbSet.FindAsync：會先尋找目前 DbContext 已追蹤的 Entity，
    /// 找不到時才查詢資料庫，適合後續接續 Update 或 Delete 的內部流程。
    /// 這不是完整 Form Model 查詢，也不套用 QueryList 的 Include、Projection、排序或 NoTracking。
    /// </remarks>
    public async Task<TDbModel> FindByKeyAsync(params object[] key)
    {
        return await QueryOperations.FindByKeyAsync(key, default);
    }
    /// <summary>
    /// 依 EF Core Primary Key 與取消權杖查詢單一 Entity。
    /// </summary>
    public async Task<TDbModel> FindByKeyAsync(CancellationToken ct, params object[] key)
    {
        return await QueryOperations.FindByKeyAsync(key, ct);
    }
    /// <summary>
    /// 依 Primary Key 查詢單一 Entity 的舊版相容入口。
    /// </summary>
    /// <remarks>
    /// 此名稱容易與 Biz 層完整 Form QueryData 混淆，目前僅保留既有相容性；
    /// Repository Query 契約完成翻新後必須移除，新的程式請使用 FindByKeyAsync。
    /// </remarks>
    [Obsolete("QueryDataAsync 已過時，請改用 FindByKeyAsync；此相容入口將於 Repository Query 契約翻新時移除。")]
    public async Task<TDbModel> QueryDataAsync(params object[] key)
    {
        return await FindByKeyAsync(key);
    }
    /// <summary>
    /// 依可選查詢設定取得 Entity 清單。
    /// </summary>
    public async Task<IList<TDbModel>> QueryListAsync(RepositoryQueryOptions? options = null, CancellationToken ct = default)
    {
        return await QueryOperations.QueryListAsync(options, ct);
    }
    /// <summary>
    /// 依條件取得 Entity 總筆數。
    /// </summary>
    public async Task<int> QueryListCountAsync(LambdaExpression? whereExpression = null, CancellationToken ct = default)
    {
        return await QueryOperations.QueryListCountAsync(whereExpression, ct);
    }
    /// <summary>
    /// 查詢指定字串欄位在目前前綴下的最大值。
    /// </summary>
    public async Task<string?> QueryMaxStringValueByPrefixAsync(LambdaExpression valueSelector, string prefix, CancellationToken ct = default)
    {
        return await QueryOperations
            .QueryMaxStringValueByPrefixAsync(valueSelector, prefix, ct);
    }
    #endregion
}
