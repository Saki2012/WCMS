using Microsoft.EntityFrameworkCore;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Repo.Cache;
using WCMS.SysCore.FeatureDriver.Runtime;
using WCMS.SysCore.Persistence;
namespace WCMS.SysCore.FeatureDriver.Repo.Operations.Write;

/// <summary>
/// 執行 Repository 新增、修改與刪除流程。
/// </summary>
public sealed class RepositoryWriteOperations<TDbModel>(
    ApplicationDbContext dataAccess,
    TrackedEntityResolver<TDbModel> trackedEntityResolver,
    EntityChangeApplier<TDbModel> entityChangeApplier,
    PropertyAccessorCache propertyAccessor,
    ModelTypeMetadataCache modelMetadata,
    EfRepositoryMetadataCache repositoryMetadata)
    where TDbModel : DbModel
{
    #region Property
    private ApplicationDbContext DataAccess { get; } = dataAccess;
    private TrackedEntityResolver<TDbModel> TrackedEntityResolver { get; } = trackedEntityResolver;
    private EntityChangeApplier<TDbModel> EntityChangeApplier { get; } = entityChangeApplier;
    private PropertyAccessorCache PropertyAccessor { get; } = propertyAccessor;
    private ModelTypeMetadataCache ModelMetadata { get; } = modelMetadata;
    private EfRepositoryMetadataCache RepositoryMetadata { get; } = repositoryMetadata;
    #endregion

    #region Internal
    /// <summary>
    /// 將單一 Entity 加入目前 DbContext。
    /// </summary>
    internal async Task CreateAsync(TDbModel newData, CancellationToken ct)
    {
        await DataAccess.AddAsync(newData, ct);
    }
    /// <summary>
    /// 解析 Tracked Entity 並套用可更新 Scalar 差異。
    /// </summary>
    internal async Task UpdateAsync(
        TDbModel oldData,
        TDbModel newData,
        CancellationToken ct)
    {
        TDbModel trackedData = await TrackedEntityResolver.ResolveAsync(oldData, ct);
        DataAccess.Entry(trackedData).State = EntityState.Unchanged;
        EntityChangeApplier.Apply(trackedData, newData);
    }
    /// <summary>
    /// 刪除單一 Entity，Detached 時避免整張 Navigation Graph 被 Attach。
    /// </summary>
    internal Task<bool> DeleteAsync(TDbModel oldData, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (DataAccess.Entry(oldData).State == EntityState.Detached)
            DeleteDetachedEntity(oldData);
        else
            DataAccess.Remove(oldData);
        return Task.FromResult(true);
    }
    #endregion

    #region Private
    /// <summary>
    /// 清除第一層 Reference Navigation 後直接標記 Detached Entity 為 Deleted。
    /// </summary>
    private void DeleteDetachedEntity(TDbModel oldData)
    {
        string[] navigationNames = RepositoryMetadata
            .GetFirstLevelReferenceIncludes(DataAccess, typeof(TDbModel));
        foreach (string navigationName in navigationNames)
            ClearNavigation(oldData, navigationName);
        DataAccess.Entry(oldData).State = EntityState.Deleted;
    }
    /// <summary>
    /// 清空可寫入的單一 Reference Navigation。
    /// </summary>
    private void ClearNavigation(TDbModel oldData, string navigationName)
    {
        var property = ModelMetadata.GetProperty(oldData.GetType(), navigationName);
        if (property?.CanWrite == true)
            PropertyAccessor.Set(oldData, navigationName, null);
    }
    #endregion
}
