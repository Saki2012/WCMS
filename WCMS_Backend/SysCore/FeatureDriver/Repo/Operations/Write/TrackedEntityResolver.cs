using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.Persistence;
namespace WCMS.SysCore.FeatureDriver.Repo.Operations.Write;

/// <summary>
/// 依 Primary Key 解析目前 DbContext 應使用的 Tracked Entity。
/// </summary>
public sealed class TrackedEntityResolver<TDbModel>(ApplicationDbContext dataAccess)
    where TDbModel : DbModel
{
    #region Property
    private ApplicationDbContext DataAccess { get; } = dataAccess;
    #endregion

    #region Internal
    /// <summary>
    /// 依序從 Local、ChangeTracker、資料庫與 Attach fallback 取得 Tracked Entity。
    /// </summary>
    internal async Task<TDbModel> ResolveAsync(
        TDbModel oldData,
        CancellationToken ct)
    {
        if (DataAccess.Entry(oldData).State != EntityState.Detached) return oldData;
        IKey primaryKey = GetPrimaryKey();
        object[] targetKeys = GetKeyValues(primaryKey, oldData);
        TDbModel? local = FindLocal(primaryKey, targetKeys);
        if (local != null) return local;
        TDbModel? tracked = FindTracked(primaryKey, targetKeys);
        if (tracked != null) return tracked;
        TDbModel? persisted = await DataAccess.Set<TDbModel>().FindAsync(targetKeys, ct);
        if (persisted != null) return persisted;
        DataAccess.Set<TDbModel>().Attach(oldData);
        return oldData;
    }
    #endregion

    #region Private
    /// <summary>
    /// 取得目前 Entity 的 EF Primary Key Metadata。
    /// </summary>
    private IKey GetPrimaryKey()
    {
        IEntityType entityType = DataAccess.Model.FindEntityType(typeof(TDbModel))
            ?? throw new InvalidOperationException($"EntityType not found: {typeof(TDbModel).Name}");
        return entityType.FindPrimaryKey()
            ?? throw new InvalidOperationException($"Primary key not found: {typeof(TDbModel).Name}");
    }
    /// <summary>
    /// 從目前 DbSet Local Cache 尋找相同主鍵 Entity。
    /// </summary>
    private TDbModel? FindLocal(IKey primaryKey, object[] targetKeys)
    {
        return DataAccess.Set<TDbModel>().Local
            .FirstOrDefault(entity => HasSameKey(primaryKey, entity, targetKeys));
    }
    /// <summary>
    /// 從目前 DbContext ChangeTracker 尋找相同主鍵 Entity。
    /// </summary>
    private TDbModel? FindTracked(IKey primaryKey, object[] targetKeys)
    {
        return DataAccess.ChangeTracker.Entries<TDbModel>()
            .Select(entry => entry.Entity)
            .FirstOrDefault(entity => HasSameKey(primaryKey, entity, targetKeys));
    }
    /// <summary>
    /// 判斷 Entity Primary Key 是否與目標值相同。
    /// </summary>
    private static bool HasSameKey(
        IKey primaryKey,
        TDbModel entity,
        object[] targetKeys)
    {
        object[] keyValues = GetKeyValues(primaryKey, entity);
        return keyValues.SequenceEqual(targetKeys);
    }
    /// <summary>
    /// 依 EF Primary Key 宣告順序取得 Entity Key 值。
    /// </summary>
    private static object[] GetKeyValues(IKey primaryKey, object entity)
    {
        return [.. primaryKey.Properties.Select(property =>
            property.PropertyInfo!.GetValue(entity)!)];
    }
    #endregion
}
