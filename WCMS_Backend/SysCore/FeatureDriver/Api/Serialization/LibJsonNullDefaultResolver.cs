using System.Reflection;
using System.Text.Json.Serialization.Metadata;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.SysCore.FeatureDriver.Api.Serialization;

/// <summary>
/// 依 Model Property 的 Nullable Metadata 套用 null 預設值處理。
/// </summary>
internal sealed class LibJsonNullDefaultResolver : DefaultJsonTypeInfoResolver
{
    #region Property
    private JsonSerializationRuntimeCache RuntimeCache { get; }
    #endregion

    #region Public
    /// <summary>
    /// 建立 WCMS JSON TypeInfo Resolver。
    /// </summary>
    public LibJsonNullDefaultResolver(JsonSerializationRuntimeCache runtimeCache)
    {
        RuntimeCache = runtimeCache;
        Modifiers.Add(ApplyNullDefaultHandling);
    }
    #endregion

    #region Private
    /// <summary>
    /// 套用 API 欄位政策與 null 預設值處理。
    /// </summary>
    private void ApplyNullDefaultHandling(JsonTypeInfo typeInfo)
    {
        if (typeInfo.Kind != JsonTypeInfoKind.Object) return;
        RemoveApiIgnoredProperties(typeInfo);
        JsonPropertyInfo[] properties = GetNormalizableProperties(typeInfo);
        foreach (JsonPropertyInfo property in typeInfo.Properties) ApplyPropertyConverter(property);
        ApplyObjectNormalizer(typeInfo, properties);
    }
    /// <summary>
    /// 從對外 JSON Contract 移除 API Ignore 欄位。
    /// </summary>
    private static void RemoveApiIgnoredProperties(JsonTypeInfo typeInfo)
    {
        for (int index = typeInfo.Properties.Count - 1; index >= 0; index--)
        {
            JsonPropertyInfo jsonProperty = typeInfo.Properties[index];
            if (jsonProperty.AttributeProvider is not PropertyInfo property) continue;
            if (LibApiFieldPolicyHelper.GetApiMode(property) != ApiFieldMode.Ignore) continue;
            typeInfo.Properties.RemoveAt(index);
        }
    }
    /// <summary>
    /// 對非 Nullable 且可建立預設值的 Property 套用 Converter。
    /// </summary>
    private void ApplyPropertyConverter(JsonPropertyInfo jsonProperty)
    {
        if (jsonProperty.AttributeProvider is not PropertyInfo property) return;
        if (!CanNormalize(property)) return;
        jsonProperty.CustomConverter = RuntimeCache.GetConverter(property.PropertyType, jsonProperty.CustomConverter);
    }
    /// <summary>
    /// 加入反序列化完成後的遺漏欄位正規化。
    /// </summary>
    private static void ApplyObjectNormalizer(JsonTypeInfo typeInfo, JsonPropertyInfo[] properties)
    {
        if (properties.Length == 0) return;
        Action<object>? original = typeInfo.OnDeserialized;
        typeInfo.OnDeserialized = model =>
        {
            NormalizeProperties(model, properties);
            original?.Invoke(model);
        };
    }

    /// <summary>
    /// 將遺漏或仍為 null 的非 Nullable 欄位補為預設值。
    /// </summary>
    private static void NormalizeProperties(object model, JsonPropertyInfo[] properties)
    {
        foreach (JsonPropertyInfo property in properties)
        {
            if (property.Get!(model) != null) continue;
            property.Set!(model, LibJsonDefaultValueFactory.Create(property.PropertyType));
        }
    }

    /// <summary>
    /// 取得可由 API 寫入並進行 null 正規化的 Property。
    /// </summary>
    private JsonPropertyInfo[] GetNormalizableProperties(JsonTypeInfo typeInfo)
    {
        return [.. typeInfo.Properties.Where(property =>
            property.Get != null && property.Set != null
            && property.AttributeProvider is PropertyInfo modelProperty
            && CanNormalize(modelProperty))];
    }

    /// <summary>
    /// 判斷 Property 是否需要且可以轉為預設值。
    /// </summary>
    private bool CanNormalize(PropertyInfo property)
    {
        return !RuntimeCache.IsNullable(property)
            && LibJsonDefaultValueFactory.CanCreate(property.PropertyType);
    }
    #endregion
}
