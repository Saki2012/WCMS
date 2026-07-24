using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Repo.Cache;
using WCMS.SysCore.FeatureDriver.Runtime;
using WCMS.SysCore.Persistence;
namespace WCMS.SysCore.FeatureDriver.Repo.Operations.Write;

/// <summary>
/// 將新 Entity 的可更新 Scalar 差異套用至目前 Tracked Entity。
/// </summary>
public sealed class EntityChangeApplier<TDbModel>(ApplicationDbContext dataAccess, PropertyAccessorCache propertyAccessor, ModelTypeMetadataCache modelMetadata, EfRepositoryMetadataCache repositoryMetadata)
    where TDbModel : DbModel
{
    #region Property
    private ApplicationDbContext DataAccess { get; } = dataAccess;
    private PropertyAccessorCache PropertyAccessor { get; } = propertyAccessor;
    private ModelTypeMetadataCache ModelMetadata { get; } = modelMetadata;
    private EfRepositoryMetadataCache RepositoryMetadata { get; } = repositoryMetadata;
    #endregion

    #region Internal
    /// <summary>
    /// 比對 EF Metadata 允許更新的欄位並逐欄設定 IsModified。
    /// </summary>
    internal void Apply(TDbModel oldData, TDbModel newData)
    {
        EfRepositoryMetadataCache.EntityMap entityMap =
            RepositoryMetadata.GetEntityMap(DataAccess, typeof(TDbModel));
        foreach (PropertyInfo property in ModelMetadata.GetProperties(typeof(TDbModel)))
        {
            if (!CanApply(property, entityMap)) continue;
            ApplyPropertyChange(oldData, newData, property);
        }
    }
    #endregion

    #region Private
    /// <summary>
    /// 以 CLR Setter 與 EF Metadata 判斷欄位是否可由一般 Update 覆寫。
    /// </summary>
    private static bool CanApply(PropertyInfo property, EfRepositoryMetadataCache.EntityMap entityMap)
    {
        if (!property.CanWrite) return false;
        return entityMap.CanUpdateScalar(property.Name);
    }
    /// <summary>
    /// 寫入單一欄位差異並標記為已修改。
    /// </summary>
    private void ApplyPropertyChange(TDbModel oldData, TDbModel newData, PropertyInfo property)
    {
        object? oldValue = PropertyAccessor.Get(oldData, property.Name);
        object? newValue = PropertyAccessor.Get(newData, property.Name);
        if (Equals(oldValue, newValue)) return;
        PropertyAccessor.Set(oldData, property.Name, newValue);
        DataAccess.Entry(oldData).Property(property.Name).IsModified = true;
    }
    #endregion
}
