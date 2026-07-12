using System.Collections.Concurrent;
using System.Globalization;
using System.Linq.Expressions;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.MetaData;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SysCore.I18n;

public static class I18nModelHelper
{
    public static string GetLocalizedDescription(Type type)
    {
        var attr = GetDisplayAttr(type);
        return DoGetLocalizedDescription(type.Name, attr);
    }

    public static string GetLocalizedDescription(PropertyInfo prop)
    {
        var attr = GetDisplayAttr(prop);
        return DoGetLocalizedDescription(prop.Name, attr);
    }
    /// <summary>
    /// 取得欄位的多語系描述
    /// </summary>
    public static string GetLocalizedDescription(FieldInfo field)
    {
        var attr = GetDisplayAttr(field);
        return DoGetLocalizedDescription(field.Name, attr);
    }

    /// <summary>
    /// 取得成員上的顯示名稱屬性。
    /// </summary>
    private static ILibDisplayAttr? GetDisplayAttr(MemberInfo member)
    {
        var result = member.GetCustomAttributes(inherit: false).OfType<ILibDisplayAttr>().FirstOrDefault();
        return result;
    }

    /// <summary>
    /// 依顯示名稱屬性取得多語系文字。
    /// </summary>
    private static string DoGetLocalizedDescription(string name, ILibDisplayAttr? attr)
    {
        if (attr is LibDescAttribute descAttr && descAttr.Description.IsNullOrEmpty()) descAttr.SetResourceKey(name);

        string? result = GetDescriptionText(attr);
        return result.IsNullOrEmpty() ? $"[{name}]" : result;
    }

    /// <summary>
    /// 取得 LibDesc 或 LibField 顯示文字。
    /// </summary>
    private static string? GetDescriptionText(ILibDisplayAttr? attr)
    {
        if (attr == null) return null;
        if (attr is LibDescAttribute descAttr) return descAttr.Description;

        var result = LibDisplayAttributeHelper.GetDescriptionText(attr);
        return result;
    }
}

public static class I18nCache
{
    #region Property
    private static readonly ConcurrentDictionary<string, string> _cache = new();
    private static string CultureKey => CultureInfo.CurrentUICulture.Name;
    private static string TypeKey(Type type) => $"{CultureKey}|T:{type.FullName}";
    private static string PropKey(PropertyInfo prop) => $"{CultureKey}|P:{prop.DeclaringType?.FullName}.{prop.Name}";
    private static string FieldKey(FieldInfo field) => $"{CultureKey}|F:{field.DeclaringType?.FullName}.{field.Name}";

    private static readonly Type[] DomainTypes = typeof(DisplayName).Assembly.GetTypes();
    #endregion

    #region Public
    public static string GetLabel<T>() => GetLabel(typeof(T));
    public static string GetLabel<T>(Expression<Func<T, object>> selector)
    {
        MemberExpression? member = selector.Body as MemberExpression;
        if (member == null && selector.Body is UnaryExpression u && u.Operand is MemberExpression m) member = m;
        if (member?.Member is PropertyInfo prop) return GetLabel(prop);
        return GetLabel(typeof(T));
    }
    public static string GetLabel(Type type) => _cache.GetOrAdd(TypeKey(type), _ => I18nModelHelper.GetLocalizedDescription(type));
    public static string GetLabel(PropertyInfo prop) => _cache.GetOrAdd(PropKey(prop), _ => I18nModelHelper.GetLocalizedDescription(prop));
    /// <summary>
    /// 依常數欄位名稱取得多語系標籤
    /// </summary>
    public static string GetFieldLabel(Type type, string fieldName)
    {
        var field = type.GetField(fieldName, BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy);
        if (field == null) return $"[{fieldName}]";
        return _cache.GetOrAdd(FieldKey(field), _ => I18nModelHelper.GetLocalizedDescription(field));
    }

    /// <summary>
    /// DTO 優先取得資料表顯示名稱，找不到再 fallback Model。 
    /// TODO: (後續取消DTO時，要調整該方法)
    /// </summary>
    public static string GetDtoFirstTypeLabel(string modelName)
    {
        // 宣告變數
        Type? modelType = FindTypeByName(modelName);
        Type? dtoType = FindDtoType(modelType?.Name ?? modelName);

        // 執行：DTO 優先，Model 備援
        string? label = GetResolvedTypeLabel(dtoType) ?? GetResolvedTypeLabel(modelType);

        return label ?? modelName;
    }

    /// <summary>
    /// DTO 優先取得欄位顯示名稱，找不到再 fallback Model。
    /// TODO: (後續取消DTO時，要調整該方法)
    /// </summary>
    public static string GetDtoFirstPropertyLabel(string modelName, string propertyName)
    {
        // 宣告變數
        Type? modelType = FindTypeByName(modelName);
        Type? dtoType = FindDtoType(modelType?.Name ?? modelName);

        // 執行：DTO 欄位優先，Model 欄位備援
        string? label = GetResolvedPropertyLabel(dtoType, propertyName)
            ?? GetResolvedPropertyLabel(modelType, propertyName);

        return label ?? propertyName;
    }
    #endregion

    #region Private
    /// <summary>
    /// 依名稱尋找 Model Type。
    /// </summary>
    private static Type? FindTypeByName(string typeName)
    {
        // 宣告變數
        string normalizedName = typeName.Split('.').Last().Trim('[', ']', '"');

        return DomainTypes.FirstOrDefault(p => p.Name == normalizedName);
    }

    /// <summary>
    /// 依 Model 名稱尋找對應 DTO Type。
    /// </summary>
    private static Type? FindDtoType(string modelName)
    {
        // 宣告變數
        var candidates = BuildDtoTypeNameCandidates(modelName);

        return DomainTypes.FirstOrDefault(p => candidates.Contains(p.Name));
    }

    /// <summary>
    /// 建立 DTO 命名候選清單。
    /// </summary>
    private static List<string> BuildDtoTypeNameCandidates(string modelName)
    {
        // 宣告變數
        var names = new List<string> { $"{modelName}_DTO" };

        // 執行：AccountModel -> Account_DTO 這類命名
        if (modelName.EndsWith("Model", StringComparison.Ordinal))
            names.Add($"{modelName[..^5]}_DTO");

        return names;
    }
    /// <summary>
    /// 取得 Type LibDesc，若為 fallback 格式則視為找不到。
    /// </summary>
    private static string? GetResolvedTypeLabel(Type? type)
    {
        if (type == null) return null;

        // 宣告變數
        string label = GetLabel(type);

        return IsFallbackLabel(label, type.Name) ? null : label;
    }

    /// <summary>
    /// 取得 Property LibDesc，若為 fallback 格式則視為找不到。
    /// </summary>
    private static string? GetResolvedPropertyLabel(Type? type, string propertyName)
    {
        if (type == null) return null;

        // 宣告變數
        PropertyInfo? prop = FindProperty(type, propertyName);
        if (prop == null) return null;

        string label = GetLabel(prop);

        return IsFallbackLabel(label, prop.Name) ? null : label;
    }

    /// <summary>
    /// 往父類別尋找公開欄位屬性。
    /// </summary>
    private static PropertyInfo? FindProperty(Type type, string propertyName)
    {
        // 宣告變數
        Type? current = type;

        // 執行：包含 DTO 與 DbModel 基底類別的繼承欄位
        while (current != null)
        {
            var prop = current.GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
            if (prop != null) return prop;

            current = current.BaseType;
        }

        return null;
    }

    /// <summary>
    /// 判斷是否為 LibDesc 找不到時的 fallback 顯示。
    /// </summary>
    private static bool IsFallbackLabel(string label, string rawName)
    {
        return string.IsNullOrWhiteSpace(label) || label == $"[{rawName}]";
    }

    #endregion
}
