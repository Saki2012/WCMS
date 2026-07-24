using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using WCMS.SysCore.PlatformServices.Cache;
namespace WCMS.SysCore.FeatureDriver.Repo.Cache;

/// <summary>
/// 管理 Repository 使用的 EF Runtime Metadata Cache。
/// </summary>
/// <remarks>
/// 初始化 Repository EF Metadata Cache。
/// </remarks>
public sealed class EfRepositoryMetadataCache(CacheService cacheService) : LibCacheBase(cacheService)
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

    #region Internal
    /// <summary>
    /// 取得 Entity 的 Scalar、Navigation、Key 與更新限制 Metadata。
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
    /// 從 EF Model 建立 Entity 欄位、關聯與更新限制對照。
    /// </summary>
    private static EntityMap BuildEntityMap(DbContext db, Type entityType)
    {
        IEntityType metadata = db.Model.FindEntityType(entityType)
            ?? throw new InvalidOperationException($"EF entity not found: {entityType.Name}");
        IProperty[] properties = [.. metadata.GetProperties()];
        HashSet<string> scalars = BuildPropertyNameSet(properties);
        HashSet<string> primaryKeys = BuildPrimaryKeySet(metadata);
        HashSet<string> concurrencyTokens = BuildConcurrencySet(properties);
        HashSet<string> blockedAfterSave = BuildBlockedAfterSaveSet(properties);
        HashSet<string> navigations = BuildNavigationSet(metadata);
        return new EntityMap(scalars, navigations, primaryKeys, concurrencyTokens, blockedAfterSave);
    }
    /// <summary>
    /// 建立 EF Scalar Property 名稱集合。
    /// </summary>
    private static HashSet<string> BuildPropertyNameSet(IEnumerable<IProperty> properties)
    {
        return properties.Select(item => item.Name).ToHashSet(StringComparer.Ordinal);
    }
    /// <summary>
    /// 建立 Entity Primary Key Property 名稱集合。
    /// </summary>
    private static HashSet<string> BuildPrimaryKeySet(IEntityType metadata)
    {
        IReadOnlyList<IProperty> properties = metadata.FindPrimaryKey()?.Properties ?? [];
        return BuildPropertyNameSet(properties);
    }
    /// <summary>
    /// 建立 EF Concurrency Token Property 名稱集合。
    /// </summary>
    private static HashSet<string> BuildConcurrencySet(IEnumerable<IProperty> properties)
    {
        return properties.Where(item => item.IsConcurrencyToken)
            .Select(item => item.Name)
            .ToHashSet(StringComparer.Ordinal);
    }
    /// <summary>
    /// 建立更新後禁止一般 Save 寫入的 Property 名稱集合。
    /// </summary>
    private static HashSet<string> BuildBlockedAfterSaveSet(IEnumerable<IProperty> properties)
    {
        return properties.Where(item => item.GetAfterSaveBehavior() != PropertySaveBehavior.Save)
            .Select(item => item.Name)
            .ToHashSet(StringComparer.Ordinal);
    }
    /// <summary>
    /// 建立 Navigation、Skip Navigation 與 Complex Property 名稱集合。
    /// </summary>
    private static HashSet<string> BuildNavigationSet(IEntityType metadata)
    {
        IEnumerable<string> names = metadata.GetNavigations().Select(item => item.Name)
            .Concat(metadata.GetSkipNavigations().Select(item => item.Name))
            .Concat(metadata.GetComplexProperties().Select(item => item.Name));
        return names.ToHashSet(StringComparer.Ordinal);
    }
    /// <summary>
    /// 從 EF Model 建立第一層 Reference Navigation Include 路徑。
    /// </summary>
    private static string[] BuildDefaultIncludes(DbContext db, Type entityType)
    {
        IEntityType? metadata = db.Model.FindEntityType(entityType);
        if (metadata == null) return [];
        return [.. metadata.GetNavigations()
            .Where(item => !item.IsCollection)
            .Select(item => item.Name)
            .Distinct(StringComparer.Ordinal)];
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
    /// 保存 Entity 欄位、關聯、Key 與更新限制索引。
    /// </summary>
    internal sealed class EntityMap(HashSet<string> scalars, HashSet<string> navigations, HashSet<string> primaryKeys, HashSet<string> concurrencyTokens, HashSet<string> blockedAfterSave)
    {
        #region Property
        private readonly HashSet<string> _scalars = scalars;
        private readonly HashSet<string> _navigations = navigations;
        private readonly HashSet<string> _primaryKeys = primaryKeys;
        private readonly HashSet<string> _concurrencyTokens = concurrencyTokens;
        private readonly HashSet<string> _blockedAfterSave = blockedAfterSave;
        #endregion

        #region Internal
        /// <summary>
        /// 判斷欄位是否為 EF Navigation、Skip Navigation 或 Complex Property。
        /// </summary>
        internal bool IsNavigation(string name)
        {
            return _navigations.Contains(name);
        }
        /// <summary>
        /// 判斷欄位是否為 EF Scalar Property。
        /// </summary>
        internal bool IsScalar(string name)
        {
            return _scalars.Contains(name);
        }
        /// <summary>
        /// 判斷欄位是否可由 Repository 一般 Update 流程覆寫。
        /// </summary>
        internal bool CanUpdateScalar(string name)
        {
            if (!_scalars.Contains(name)) return false;
            if (_primaryKeys.Contains(name)) return false;
            if (_concurrencyTokens.Contains(name)) return false;
            return !_blockedAfterSave.Contains(name);
        }
        #endregion
    }
}
