using System.Globalization;
using System.Linq.Expressions;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
using WCMS.SysCore.PlatformServices.Cache;
namespace WCMS.SysCore.I18n;

/// <summary>
/// 管理 Type、Property、Field、Const、Enum 與 DTO fallback 顯示文字的多語系 Runtime Cache。
/// </summary>
/// <remarks>
/// 初始化多語系顯示文字 Cache。
/// </remarks>
public sealed class I18nCache(CacheService cacheService, ModelTypeMetadataCache modelMetadata) : LibCacheBase(cacheService)
{
    #region Property
    private const string CacheRegionName = "i18n";
    private const string TypeLabelKey = "type-label";
    private const string PropertyLabelKey = "property-label";
    private const string FieldLabelKey = "field-label";
    private const string ConstFieldMapKey = "const-field-map";
    private const string ResourceLabelKey = "resource-label";
    private const string EnumOptionsKey = "enum-options";
    private const string DomainTypesKey = "domain-types";
    private static readonly CacheOptions RuntimeOptions = new()
    {
        Mode = CacheMode.LocalOnly,
        ExpirationStrategy = CacheExpirationStrategy.ProcessLifetime,
    };
    private readonly ModelTypeMetadataCache _modelMetadata = modelMetadata;
    protected override string CacheRegion => CacheRegionName;

    #endregion
    #region Public
    /// <summary>
    /// 取得指定泛型型別的多語系顯示文字。
    /// </summary>
    public string GetLabel<T>()
    {
        return GetLabel(typeof(T));
    }
    /// <summary>
    /// 取得 Selector 指定 Property 的多語系顯示文字。
    /// </summary>
    public string GetLabel<T>(Expression<Func<T, object>> selector)
    {
        PropertyInfo? property = GetSelectedProperty(selector.Body);
        return property == null ? GetLabel(typeof(T)) : GetLabel(property);
    }
    /// <summary>
    /// 取得指定 Type 的多語系顯示文字。
    /// </summary>
    public string GetLabel(Type type)
    {
        string key = BuildCacheKey(TypeLabelKey, GetCultureKey(), GetTypeCacheKey(type));
        return GetOrCreateLocal(key, RuntimeOptions, () => I18nModelHelper.GetLocalizedDescription(type))
            ?? $"[{type.Name}]";
    }
    /// <summary>
    /// 取得指定 Property 的多語系顯示文字。
    /// </summary>
    public string GetLabel(PropertyInfo property)
    {
        string key = BuildCacheKey(PropertyLabelKey, GetCultureKey(), GetMemberCacheKey(property));
        return GetOrCreateLocal(key, RuntimeOptions, () => I18nModelHelper.GetLocalizedDescription(property))
            ?? $"[{property.Name}]";
    }
    /// <summary>
    /// 依公開 Static Field 或 Const 名稱取得多語系顯示文字。
    /// </summary>
    public string GetFieldLabel(Type type, string fieldName)
    {
        FieldInfo? field = type.GetField(fieldName, BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy);
        return field == null ? $"[{fieldName}]" : GetFieldLabel(field);
    }
    /// <summary>
    /// 依公開字串 Const 的實際值取得多語系顯示文字。
    /// </summary>
    public string GetConstLabel(Type type, string constValue)
    {
        IReadOnlyDictionary<string, FieldInfo> fields = GetConstFieldMap(type);
        if (!fields.TryGetValue(constValue, out FieldInfo? field)) return constValue;
        string label = GetFieldLabel(field);
        return IsFallbackLabel(label, field.Name) ? constValue : label;
    }
    /// <summary>
    /// 依 Resx Resource Key 取得多語系顯示文字。
    /// </summary>
    public string GetResourceLabel(string resourceKey)
    {
        if (string.IsNullOrWhiteSpace(resourceKey)) return string.Empty;
        string key = BuildCacheKey(ResourceLabelKey, GetCultureKey(), resourceKey);
        return GetOrCreateLocal(key, RuntimeOptions, () => new LibDescAttribute(resourceKey).Description)
            ?? $"[{resourceKey}]";
    }
    /// <summary>
    /// 取得指定 Enum 值的多語系顯示文字。
    /// </summary>
    public string GetEnumLabel(System.Enum value)
    {
        string fieldName = value.ToString();
        string label = GetFieldLabel(value.GetType(), fieldName);
        return IsFallbackLabel(label, fieldName) ? fieldName : label;
    }
    /// <summary>
    /// 依 Enum 型別名稱取得多語系選項。
    /// </summary>
    public List<EnumOption> GetEnumOptions(string enumTypeName)
    {
        Type enumType = FindEnumType(enumTypeName)
            ?? throw new ArgumentException($"Enum type '{enumTypeName}' not found.");
        string key = BuildCacheKey(EnumOptionsKey, GetCultureKey(), GetTypeCacheKey(enumType));
        return GetOrCreateLocal(key, RuntimeOptions, () => BuildEnumOptions(enumType)) ?? [];
    }
    /// <summary>
    /// DTO 優先取得 Type 顯示文字，找不到時 fallback Model。
    /// </summary>
    public string GetDtoFirstTypeLabel(string modelName)
    {
        Type? modelType = FindTypeByName(modelName);
        Type? dtoType = FindDtoType(modelType?.Name ?? modelName);
        string? label = GetResolvedTypeLabel(dtoType) ?? GetResolvedTypeLabel(modelType);
        return label ?? modelName;
    }
    /// <summary>
    /// DTO 優先取得 Property 顯示文字，找不到時 fallback Model。
    /// </summary>
    public string GetDtoFirstPropertyLabel(string modelName, string propertyName)
    {
        Type? modelType = FindTypeByName(modelName);
        Type? dtoType = FindDtoType(modelType?.Name ?? modelName);
        string? label = GetResolvedPropertyLabel(dtoType, propertyName)
            ?? GetResolvedPropertyLabel(modelType, propertyName);
        return label ?? propertyName;
    }
    #endregion

    #region Private
    /// <summary>
    /// 取得指定 Field 的多語系顯示文字。
    /// </summary>
    private string GetFieldLabel(FieldInfo field)
    {
        string key = BuildCacheKey(FieldLabelKey, GetCultureKey(), GetMemberCacheKey(field));
        return GetOrCreateLocal(key, RuntimeOptions, () => I18nModelHelper.GetLocalizedDescription(field))
            ?? $"[{field.Name}]";
    }
    /// <summary>
    /// 取得指定 Type 的字串 Const 值與 Field 對應。
    /// </summary>
    private IReadOnlyDictionary<string, FieldInfo> GetConstFieldMap(Type type)
    {
        string key = BuildCacheKey(ConstFieldMapKey, GetTypeCacheKey(type));
        return GetOrCreateLocal(key, RuntimeOptions, () => BuildConstFieldMap(type))
            ?? new Dictionary<string, FieldInfo>(StringComparer.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 建立指定 Type 的字串 Const 值與 Field 對應。
    /// </summary>
    private static IReadOnlyDictionary<string, FieldInfo> BuildConstFieldMap(Type type)
    {
        FieldInfo[] fields = type.GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy);
        return fields
            .Where(field => field.IsLiteral && !field.IsInitOnly && field.FieldType == typeof(string))
            .Select(field => new { Field = field, Value = field.GetRawConstantValue()?.ToString() })
            .Where(item => !string.IsNullOrWhiteSpace(item.Value))
            .GroupBy(item => item.Value!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First().Field, StringComparer.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 從 Selector Body 取得 PropertyInfo。
    /// </summary>
    private static PropertyInfo? GetSelectedProperty(Expression body)
    {
        if (body is MemberExpression member && member.Member is PropertyInfo property) return property;
        if (body is UnaryExpression unary && unary.Operand is MemberExpression converted && converted.Member is PropertyInfo convertedProperty)
            return convertedProperty;
        return null;
    }
    /// <summary>
    /// 取得目前執行語系的 Cache Key。
    /// </summary>
    private static string GetCultureKey()
    {
        string culture = CultureInfo.CurrentUICulture.Name;
        return string.IsNullOrWhiteSpace(culture) ? "invariant" : culture;
    }
    /// <summary>
    /// 取得系統 Domain Type 清單。
    /// </summary>
    private Type[] GetDomainTypes()
    {
        string key = BuildCacheKey(DomainTypesKey);
        return GetOrCreateLocal(key, RuntimeOptions, () => typeof(DisplayName).Assembly.GetTypes()) ?? [];
    }
    /// <summary>
    /// 依名稱尋找 Enum Type。
    /// </summary>
    private Type? FindEnumType(string enumTypeName)
    {
        string normalizedName = enumTypeName.Trim('[', ']', '"');
        return GetDomainTypes().FirstOrDefault(type => type.IsEnum && (type.Name == normalizedName || type.FullName == normalizedName));
    }
    /// <summary>
    /// 建立指定 Enum 的多語系選項。
    /// </summary>
    private List<EnumOption> BuildEnumOptions(Type enumType)
    {
        return [.. Enum.GetValues(enumType)
            .Cast<Enum>()
            .Select(value => new EnumOption
            {
                Key = Convert.ToInt32(value),
                DisplayName = GetEnumLabel(value),
            })];
    }
    /// <summary>
    /// 依名稱尋找 Model Type。
    /// </summary>
    private Type? FindTypeByName(string typeName)
    {
        string normalizedName = typeName.Split('.').Last().Trim('[', ']', '"');
        return GetDomainTypes().FirstOrDefault(type => type.Name == normalizedName);
    }
    /// <summary>
    /// 依 Model 名稱尋找對應 DTO Type。
    /// </summary>
    private Type? FindDtoType(string modelName)
    {
        string dtoTypeName = $"{modelName}_DTO";
        return GetDomainTypes().FirstOrDefault(type => type.Name == dtoTypeName);
    }
    /// <summary>
    /// 取得 Type 顯示文字，fallback 格式視為找不到。
    /// </summary>
    private string? GetResolvedTypeLabel(Type? type)
    {
        if (type == null) return null;
        string label = GetLabel(type);
        return IsFallbackLabel(label, type.Name) ? null : label;
    }
    /// <summary>
    /// 取得 Property 顯示文字，fallback 格式視為找不到。
    /// </summary>
    private string? GetResolvedPropertyLabel(Type? type, string propertyName)
    {
        if (type == null) return null;
        PropertyInfo? property = _modelMetadata.GetProperties(type).FirstOrDefault(item => item.Name == propertyName);
        if (property == null) return null;
        string label = GetLabel(property);
        return IsFallbackLabel(label, property.Name) ? null : label;
    }
    /// <summary>
    /// 判斷顯示文字是否為資源找不到時的 fallback 格式。
    /// </summary>
    private static bool IsFallbackLabel(string? label, string rawName)
    {
        return string.IsNullOrWhiteSpace(label) || label == $"[{rawName}]";
    }
    /// <summary>
    /// 建立可跨 Assembly 區分的 Type Cache Key。
    /// </summary>
    private static string GetTypeCacheKey(Type type)
    {
        return type.AssemblyQualifiedName ?? type.FullName ?? type.Name;
    }
    /// <summary>
    /// 建立包含宣告型別與成員名稱的 Cache Key。
    /// </summary>
    private static string GetMemberCacheKey(MemberInfo member)
    {
        Type? declaringType = member.DeclaringType;
        return $"{(declaringType == null ? "~" : GetTypeCacheKey(declaringType))}:{member.Name}";
    }
    #endregion
}

/// <summary>
/// 提供 Enum 選項的數值與多語系顯示文字。
/// </summary>
public sealed class EnumOption
{
    #region Property
    /// <summary>
    /// 取得或設定 Enum 數值。
    /// </summary>
    public int Key { get; set; }
    /// <summary>
    /// 取得或設定 Enum 顯示文字。
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;
    #endregion
}
