using Microsoft.EntityFrameworkCore;
using WCMS.SysCore.PlatformServices.Cache;

namespace WCMS.SysCore.FeatureDriver.Repo.Cache;

/// <summary>
/// 管理 Repository 使用的 EF Runtime Metadata Cache。
/// </summary>
public sealed class EfRepositoryMetadataCache : LibCacheBase
{
    #region Property
    private const string CacheRegionName = "ef-repository-metadata";
    private const string EntityMapKey = "entity-map";
    private const string DefaultIncludesKey = "default-includes";
    private static readonly CacheOptions RuntimeOptions = new()
    {
        Mode = CacheMode.LocalOnly,
        ExpirationStrategy = CacheExpirationStrategy.ProcessLifetime,
    };
    protected override string CacheRegion => CacheRegionName;
    #endregion

    #region Public
    /// <summary>
    /// 初始化 Repository EF Metadata Cache。
    /// </summary>
    public EfRepositoryMetadataCache(CacheService cacheService) : base(cacheService)
    {
    }
    #endregion

    #region Internal
    /// <summary>
    /// 取得 Entity 的 Scalar 與 Navigation Metadata 對照。
    /// </summary>
    internal EntityMap GetEntityMap(DbContext db, Type entityType)
    {
        string key = BuildMetadataKey(EntityMapKey, db, entityType);
        return GetOrCreateLocal(key, RuntimeOptions, () => BuildEntityMap(db, entityType))
            ?? throw new InvalidOperationException($"Cannot build EF entity metadata cache: {entityType.FullName}");
    }
    /// <summary>
    /// 取得 Entity 第一層 Reference Navigation Include 路徑。
    /// </summary>
    internal string[] GetFirstLevelReferenceIncludes(DbContext db, Type entityType)
    {
        string key = BuildMetadataKey(DefaultIncludesKey, db, entityType);
        return GetOrCreateLocal(key, RuntimeOptions, () => BuildDefaultIncludes(db, entityType)) ?? [];
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立包含 DbContext 與 Entity Type 的 Metadata Cache Key。
    /// </summary>
    private string BuildMetadataKey(string metadataKind, DbContext db, Type entityType)
    {
        return BuildCacheKey(metadataKind, GetTypeCacheKey(db.GetType()), GetTypeCacheKey(entityType));
    }
    /// <summary>
    /// 從 EF Model 建立 Entity 欄位與關聯名稱對照。
    /// </summary>
    private static EntityMap BuildEntityMap(DbContext db, Type entityType)
    {
        var metadata = db.Model.FindEntityType(entityType)
            ?? throw new InvalidOperationException($"EF entity not found: {entityType.Name}");
        var scalars = metadata.GetProperties().Select(item => item.Name).ToHashSet(StringComparer.Ordinal);
        var navigations = metadata.GetNavigations().Select(item => item.Name).ToHashSet(StringComparer.Ordinal);
        var skipNavigations = metadata.GetSkipNavigations().Select(item => item.Name).ToHashSet(StringComparer.Ordinal);
        var complexProperties = metadata.GetComplexProperties().Select(item => item.Name).ToHashSet(StringComparer.Ordinal);
        return new EntityMap(scalars, navigations, skipNavigations, complexProperties);
    }
    /// <summary>
    /// 從 EF Model 建立第一層 Reference Navigation Include 路徑。
    /// </summary>
    private static string[] BuildDefaultIncludes(DbContext db, Type entityType)
    {
        var metadata = db.Model.FindEntityType(entityType);
        if (metadata == null) return [];
        return metadata.GetNavigations()
            .Where(item => !item.IsCollection)
            .Select(item => item.Name)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
    }
    /// <summary>
    /// 建立可跨 Assembly 區分的型別 Cache Key。
    /// </summary>
    private static string GetTypeCacheKey(Type type)
    {
        return type.AssemblyQualifiedName ?? type.FullName ?? type.Name;
    }
    #endregion

    /// <summary>
    /// 保存 Entity Scalar 與 Navigation 的名稱索引。
    /// </summary>
    internal sealed class EntityMap(
        HashSet<string> scalars,
        HashSet<string> navigations,
        HashSet<string> skipNavigations,
        HashSet<string> complexProperties)
    {
        #region Property
        private readonly HashSet<string> _scalars = scalars;
        private readonly HashSet<string> _navigations = navigations;
        private readonly HashSet<string> _skipNavigations = skipNavigations;
        private readonly HashSet<string> _complexProperties = complexProperties;
        #endregion

        #region Internal
        /// <summary>
        /// 判斷欄位是否為 EF Navigation、Skip Navigation 或 Complex Property。
        /// </summary>
        internal bool IsNavigation(string name)
        {
            return _navigations.Contains(name) || _skipNavigations.Contains(name) || _complexProperties.Contains(name);
        }
        /// <summary>
        /// 判斷欄位是否為 EF Scalar Property。
        /// </summary>
        internal bool IsScalar(string name)
        {
            return _scalars.Contains(name);
        }
        #endregion
    }
}
