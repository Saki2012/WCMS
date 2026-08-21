using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Collections;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using System.Text.RegularExpressions;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Model.Metadata;

namespace WCMS.SysCore.FeatureDriver.Api.Filters;

/// <summary>
/// 共用資料寫入輸入防護，拒絕一般結構化字串欄位中的明顯 SQL 控制語法。
/// </summary>
public sealed class WriteInputSecurityFilter : IActionFilter, IOrderedFilter
{
    #region Property
    internal const string UnsafeInputErrorKey = "WCMS_UNSAFE_WRITE_INPUT";
    private const int MaxTraversalDepth = 16;

    private static readonly Regex BooleanSqlPattern = new(
        @"(?:^|['""\)])\s*(?:and|or)\s+\(?\s*(?:'[^']{0,128}'|""[^""]{0,128}""|\d+)\s*\)?\s*=\s*\(?\s*(?:'[^']{0,128}'?|""[^""]{0,128}""?|\d+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(100));

    private static readonly Regex NumericBooleanSqlPattern = new(
        @"(?:^|\b\d+\s+)(?:and|or)\s+\d+\s*=\s*\d+",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(100));

    private static readonly Regex UnionSqlPattern = new(
        @"\bunion\s+(?:all\s+)?select\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(100));

    private static readonly Regex StackedSqlPattern = new(
        @";\s*(?:select|insert|update|delete|drop|alter|create|exec(?:ute)?)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(100));

    /// <summary>
    /// 必須早於 ASP.NET Core ModelStateInvalidFilter，讓新增的錯誤走既有 400 格式。
    /// </summary>
    public int Order => -3000;
    #endregion

    #region Public
    /// <summary>
    /// Generic 資料寫入 Action 執行前，遞迴檢查可寫入的一般字串欄位。
    /// </summary>
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!IsDataWriteAction(context)) return;

        HashSet<object> visited = new(ReferenceEqualityComparer.Instance);
        foreach ((string name, object? value) in context.ActionArguments)
        {
            ValidateValue(context, value, name, visited, 0);
            if (!context.ModelState.IsValid) return;
        }
    }

    /// <summary>
    /// Action 執行後不處理。
    /// </summary>
    public void OnActionExecuted(ActionExecutedContext context) { }
    #endregion

    #region Private
    /// <summary>
    /// 僅處理 ApiDataController 的建立、修改與初始匯入寫入流程。
    /// </summary>
    private static bool IsDataWriteAction(ActionExecutingContext context)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor descriptor) return false;
        if (!IsApiDataController(descriptor.ControllerTypeInfo.AsType())) return false;

        return descriptor.ActionName is nameof(ApiDataController<object>.Create)
            or nameof(ApiDataController<object>.Update)
            or nameof(ApiDataController<object>.InitialCreateData);
    }

    /// <summary>
    /// 沿繼承鏈確認目前 Controller 是否為 Generic ApiDataController。
    /// </summary>
    private static bool IsApiDataController(Type controllerType)
    {
        for (Type? current = controllerType; current != null; current = current.BaseType)
        {
            if (!current.IsGenericType) continue;
            if (current.GetGenericTypeDefinition() == typeof(ApiDataController<>)) return true;
        }
        return false;
    }

    /// <summary>
    /// 遞迴檢查 Model、集合與巢狀資料，並限制最大深度避免異常物件圖。
    /// </summary>
    private static void ValidateValue(
        ActionExecutingContext context,
        object? value,
        string path,
        HashSet<object> visited,
        int depth)
    {
        if (value == null || depth > MaxTraversalDepth) return;

        Type type = value.GetType();
        if (IsSimpleType(type) || value is string) return;
        if (!type.IsValueType && !visited.Add(value)) return;

        if (value is IEnumerable enumerable)
        {
            ValidateEnumerable(context, enumerable, path, visited, depth);
            return;
        }

        ValidateProperties(context, value, path, visited, depth);
    }

    /// <summary>
    /// 逐項檢查集合內容並保留 ModelState 的索引路徑。
    /// </summary>
    private static void ValidateEnumerable(
        ActionExecutingContext context,
        IEnumerable values,
        string path,
        HashSet<object> visited,
        int depth)
    {
        int index = 0;
        foreach (object? item in values)
        {
            ValidateValue(context, item, $"{path}[{index}]", visited, depth + 1);
            if (!context.ModelState.IsValid) return;
            index++;
        }
    }

    /// <summary>
    /// 檢查公開 Property；一般字串依欄位 Metadata 套用 SQL 控制語法防護。
    /// </summary>
    private static void ValidateProperties(
        ActionExecutingContext context,
        object value,
        string path,
        HashSet<object> visited,
        int depth)
    {
        foreach (PropertyInfo property in value.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public))
        {
            if (!property.CanRead || property.GetIndexParameters().Length > 0) continue;

            object? propertyValue = property.GetValue(value);
            string propertyPath = string.IsNullOrWhiteSpace(path) ? property.Name : $"{path}.{property.Name}";

            if (propertyValue is string text)
            {
                ValidateString(context, property, text, propertyPath);
                if (!context.ModelState.IsValid) return;
                continue;
            }

            ValidateValue(context, propertyValue, propertyPath, visited, depth + 1);
            if (!context.ModelState.IsValid) return;
        }
    }

    /// <summary>
    /// 僅檢查 LibStr 或舊 StringLength/MaxLength 一般字串；富文字 LibField 不套用此規則。
    /// </summary>
    private static void ValidateString(
        ActionExecutingContext context,
        PropertyInfo property,
        string value,
        string path)
    {
        if (!ShouldValidateString(property)) return;
        if (!ContainsSqlControlPattern(value)) return;
        context.ModelState.TryAddModelError(path, UnsafeInputErrorKey);
    }

    /// <summary>
    /// 判斷欄位是否屬於可寫入的一般結構化字串。
    /// </summary>
    private static bool ShouldValidateString(PropertyInfo property)
    {
        LibStrAttribute? libStr = property.GetCustomAttribute<LibStrAttribute>();
        if (libStr != null)
            return libStr.ApiMode is ApiFieldMode.WriteOnly or ApiFieldMode.ReadWrite;

        return property.GetCustomAttribute<StringLengthAttribute>() != null
            || property.GetCustomAttribute<MaxLengthAttribute>() != null;
    }

    /// <summary>
    /// 偵測常見布林、UNION 與 stacked SQL 控制語法；不因單一引號直接拒絕正常文字。
    /// </summary>
    private static bool ContainsSqlControlPattern(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        return BooleanSqlPattern.IsMatch(value)
            || NumericBooleanSqlPattern.IsMatch(value)
            || UnionSqlPattern.IsMatch(value)
            || StackedSqlPattern.IsMatch(value);
    }

    /// <summary>
    /// 排除不需要遞迴的純值型別。
    /// </summary>
    private static bool IsSimpleType(Type type)
    {
        Type realType = Nullable.GetUnderlyingType(type) ?? type;
        return realType.IsPrimitive
            || realType.IsEnum
            || realType == typeof(decimal)
            || realType == typeof(DateTime)
            || realType == typeof(DateTimeOffset)
            || realType == typeof(DateOnly)
            || realType == typeof(TimeOnly)
            || realType == typeof(TimeSpan)
            || realType == typeof(Guid);
    }
    #endregion
}
