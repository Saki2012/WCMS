using System.Reflection;
using System.Text.Json.Serialization;
using WCMS.SysCore.PlatformServices.Cache;

namespace WCMS.SysCore.FeatureDriver.Api.Serialization;

/// <summary>
/// 管理 API JSON 反序列化使用的 Nullable Metadata 與 Converter Runtime Cache。
/// </summary>
/// <remarks>
/// 初始化 JSON Serialization Runtime Cache。
/// </remarks>
internal sealed class JsonSerializationRuntimeCache(CacheService cacheService) : LibCacheBase(cacheService)
{
    #region Property
    private const string CacheRegionName = "json-serialization-runtime";
    private const string NullableKey = "nullable";
    private const string ConverterKey = "converter";
    private static readonly CacheOptions RuntimeOptions = new()
    {
        Mode = CacheMode.LocalOnly,
        ExpirationStrategy = CacheExpirationStrategy.ProcessLifetime,
    };
    protected override string CacheRegion => CacheRegionName;

    #endregion
    #region Public
    /// <summary>
    /// 判斷指定 Property 是否允許寫入 null。
    /// </summary>
    public bool IsNullable(PropertyInfo property)
    {
        string key = BuildCacheKey(NullableKey, GetPropertyCacheKey(property));
        return GetOrCreateLocal(key, RuntimeOptions, () => ResolveNullable(property));
    }
    /// <summary>
    /// 取得指定型別的 null 預設值 Converter。
    /// </summary>
    public JsonConverter? GetConverter(Type type, JsonConverter? innerConverter)
    {
        if (!LibJsonDefaultValueFactory.CanCreate(type)) return null;
        if (innerConverter != null) return CreateConverter(type, innerConverter);
        string key = BuildCacheKey(ConverterKey, GetTypeCacheKey(type));
        return GetOrCreateLocal(key, RuntimeOptions, () => CreateConverter(type, null))
            ?? throw new InvalidOperationException($"Cannot build JSON converter cache: {type.FullName}");
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立指定型別並保留原始轉換規則的 Converter。
    /// </summary>
    private static JsonConverter CreateConverter(Type type, JsonConverter? innerConverter)
    {
        Type converterType = typeof(LibJsonNullDefaultConverter<>).MakeGenericType(type);
        return (JsonConverter)(Activator.CreateInstance(converterType, innerConverter)
            ?? throw new InvalidOperationException($"Cannot create JSON converter: {type.FullName}"));
    }
    /// <summary>
    /// 解析 Property 的 Nullable 寫入狀態。
    /// </summary>
    private static bool ResolveNullable(PropertyInfo property)
    {
        Type propertyType = property.PropertyType;
        if (Nullable.GetUnderlyingType(propertyType) != null) return true;
        if (propertyType.IsValueType) return false;
        return new NullabilityInfoContext().Create(property).WriteState != NullabilityState.NotNull;
    }
    /// <summary>
    /// 建立可區分宣告型別與 Property 名稱的 Cache Key。
    /// </summary>
    private static string GetPropertyCacheKey(PropertyInfo property)
    {
        Type type = property.DeclaringType
            ?? throw new InvalidOperationException($"Property declaring type not found: {property.Name}");
        return $"{GetTypeCacheKey(type)}:{property.Name}";
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
