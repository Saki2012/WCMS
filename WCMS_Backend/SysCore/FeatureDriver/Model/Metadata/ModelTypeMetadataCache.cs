using System.Reflection;
using WCMS.SysCore.PlatformServices.Cache;
namespace WCMS.SysCore.FeatureDriver.Model.Metadata;

/// <summary>
/// 管理 Model Property 與 Attribute 查詢所需的 Reflection Metadata Cache。
/// </summary>
/// <remarks>
/// 初始化 Model Metadata Cache。
/// </remarks>
public sealed class ModelTypeMetadataCache(CacheService cacheService) : LibCacheBase(cacheService)
{
    #region Property
    /// <summary>
    /// Model Metadata Cache 的區域名稱。
    /// </summary>
    private const string CacheRegionName = "model-type-metadata";
    /// <summary>
    /// Property 陣列的 Cache Key 類型。
    /// </summary>
    private const string PropertiesKey = "properties";
    /// <summary>
    /// Property 名稱對照表的 Cache Key 類型。
    /// </summary>
    private const string PropertyDictionaryKey = "property-dictionary";
    /// <summary>
    /// Reflection Metadata 使用的 Local Process Lifetime 設定。
    /// </summary>
    private static readonly CacheOptions RuntimeOptions = new()
    {
        Mode = CacheMode.LocalOnly,
        ExpirationStrategy = CacheExpirationStrategy.ProcessLifetime,
    };
    /// <summary>
    /// 取得 Model Metadata 使用的 Cache 區域名稱。
    /// </summary>
    protected override string CacheRegion => CacheRegionName;

    #endregion
    #region Public
    /// <summary>
    /// 取得指定型別的公開 Instance Property。
    /// </summary>
    public PropertyInfo? GetProperty(Type type, string name)
    {
        string key = BuildCacheKey(PropertyDictionaryKey, GetTypeCacheKey(type));
        Dictionary<string, PropertyInfo> properties = GetOrCreateLocal(key, RuntimeOptions, () => BuildPropertyDictionary(type))
            ?? throw new InvalidOperationException($"Cannot build property dictionary cache: {type.FullName}");
        return properties.TryGetValue(name, out PropertyInfo? property) ? property : null;
    }
    /// <summary>
    /// 取得指定型別的公開 Property。
    /// </summary>
    public PropertyInfo[] GetProperties(Type type)
    {
        string key = BuildCacheKey(PropertiesKey, GetTypeCacheKey(type));
        return GetOrCreateLocal(key, RuntimeOptions, () => type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            ?? throw new InvalidOperationException($"Cannot build property metadata cache: {type.FullName}");
    }
    /// <summary>
    /// 取得指定泛型型別的公開 Property。
    /// </summary>
    public PropertyInfo[] GetProperties<T>()
    {
        return GetProperties(typeof(T));
    }
    /// <summary>
    /// 取得具有指定 Attribute 的公開 Property。
    /// </summary>
    public PropertyInfo[] GetAttrProperties(Type type, Type attributeType)
    {
        return [.. GetProperties(type).Where(property => Attribute.IsDefined(property, attributeType, inherit: true))];
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立 Property 名稱不分大小寫的 Metadata 對照表。
    /// </summary>
    private static Dictionary<string, PropertyInfo> BuildPropertyDictionary(Type type)
    {
        return type.GetProperties(BindingFlags.Public | BindingFlags.Instance).ToDictionary(property => property.Name, StringComparer.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 建立可跨 Assembly 區分的型別 Cache Key。
    /// </summary>
    private static string GetTypeCacheKey(Type type)
    {
        return type.AssemblyQualifiedName ?? type.FullName ?? type.Name;
    }
    #endregion
}
