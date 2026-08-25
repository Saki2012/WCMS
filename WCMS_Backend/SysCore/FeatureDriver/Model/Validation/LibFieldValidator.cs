using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Model.Metadata;

namespace WCMS.SysCore.FeatureDriver.Model.Validation;

/// <summary>
/// 集中處理 LibField / LibStr / LibNum 驗證與 SysMessage 對應，供 API 與 Persistence 共用。
/// </summary>
internal static class LibFieldValidator
{
    #region Property
    private const string RequiredErrorKey = "WCMS_REQUIRED";
    private static readonly ConcurrentDictionary<Type, LibFieldRule[]> RuleCache = new();
    #endregion

    #region Public
    /// <summary>
    /// 驗證物件內符合條件的 LibField / LibStr / LibNum 欄位，回傳第一筆失敗結果。
    /// </summary>
    public static LibFieldValidationFailure? Validate(object model, Func<string, bool>? includeProperty = null)
    {
        Type modelType = model.GetType();
        LibFieldRule[] rules = RuleCache.GetOrAdd(modelType, BuildRules);
        foreach (LibFieldRule rule in rules)
        {
            if (includeProperty != null && !includeProperty(rule.Property.Name)) continue;
            LibFieldValidationFailure? failure = ValidateRule(model, rule);
            if (failure != null) return failure;
        }
        return null;
    }

    /// <summary>
    /// 將 DataAnnotations 驗證文字轉成 WCMS 統一的 Message Code 與參數。
    /// </summary>
    public static LibFieldValidationMessage ResolveMessage(PropertyInfo? property, string errorText)
    {
        LibNumAttribute? numAttr = property?.GetCustomAttribute<LibNumAttribute>(true);
        if (numAttr != null && !IsRequiredError(errorText))
            return ResolveNumberMessage(numAttr, errorText);

        int? maxLength = GetMaxLength(property);
        if (maxLength.HasValue && !IsRequiredError(errorText))
            return new LibFieldValidationMessage(SysMessageCode.BECode00034, [maxLength.Value]);

        return new LibFieldValidationMessage(SysMessageCode.BECode00035, []);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立單一型別需要執行的 WCMS 欄位驗證規則。
    /// </summary>
    private static LibFieldRule[] BuildRules(Type modelType)
    {
        return [.. modelType.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(CreateRule)
            .OfType<LibFieldRule>()];
    }

    /// <summary>
    /// 將 Property 上的 LibField / LibStr / LibNum Attribute 轉成可快取規則。
    /// </summary>
    private static LibFieldRule? CreateRule(PropertyInfo property)
    {
        ValidationAttribute? attribute = property.GetCustomAttribute<LibStrAttribute>(true);
        attribute ??= property.GetCustomAttribute<LibNumAttribute>(true);
        attribute ??= property.GetCustomAttribute<LibFieldAttribute>(true);
        return attribute == null ? null : new LibFieldRule(property, attribute);
    }

    /// <summary>
    /// 驗證單一欄位並轉成與 API ModelState 相同的訊息契約。
    /// </summary>
    private static LibFieldValidationFailure? ValidateRule(object model, LibFieldRule rule)
    {
        ValidationContext context = new(model)
        {
            MemberName = rule.Property.Name,
            DisplayName = rule.Property.Name,
        };
        object? value = rule.Property.GetValue(model);
        ValidationResult? result = rule.Attribute.GetValidationResult(value, context);
        if (result == ValidationResult.Success) return null;

        LibFieldValidationMessage message = ResolveMessage(rule.Property, result?.ErrorMessage ?? string.Empty);
        return new LibFieldValidationFailure(rule.Property.Name, message.MessageCode, message.MessageArgs);
    }

    /// <summary>
    /// 依 LibNum 內部錯誤識別碼解析數值範圍或格式訊息。
    /// </summary>
    private static LibFieldValidationMessage ResolveNumberMessage(LibNumAttribute attr, string errorText)
    {
        if (errorText == LibNumAttribute.NumberRangeErrorKey)
            return new LibFieldValidationMessage(attr.RangeMessageCode, [attr.MinValue ?? string.Empty, attr.MaxValue ?? string.Empty]);
        if (errorText == LibNumAttribute.NumberMinimumErrorKey)
            return new LibFieldValidationMessage(attr.MinimumMessageCode, [attr.MinValue ?? string.Empty]);
        if (errorText == LibNumAttribute.NumberMaximumErrorKey)
            return new LibFieldValidationMessage(attr.MaximumMessageCode, [attr.MaxValue ?? string.Empty]);
        return new LibFieldValidationMessage(attr.InvalidMessageCode, []);
    }

    /// <summary>
    /// 取得一般 StringLength / MaxLength 的最大字串長度。
    /// </summary>
    private static int? GetMaxLength(PropertyInfo? property)
    {
        if (property == null) return null;
        StringLengthAttribute? stringLength = property.GetCustomAttribute<StringLengthAttribute>(true);
        MaxLengthAttribute? maxLength = property.GetCustomAttribute<MaxLengthAttribute>(true);
        return stringLength?.MaximumLength ?? maxLength?.Length;
    }

    /// <summary>
    /// 判斷驗證文字是否屬於 WCMS 或框架必填錯誤。
    /// </summary>
    private static bool IsRequiredError(string errorText)
    {
        return errorText.Equals(RequiredErrorKey, StringComparison.Ordinal)
            || errorText.Contains("required", StringComparison.OrdinalIgnoreCase)
            || errorText.Contains("請輸入", StringComparison.OrdinalIgnoreCase)
            || errorText.Contains("必填", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 保存單一 Property 與其 WCMS 驗證 Attribute。
    /// </summary>
    private sealed record LibFieldRule(PropertyInfo Property, ValidationAttribute Attribute);
    #endregion
}

/// <summary>
/// LibField 驗證後可直接交給 SysMessage 的訊息資訊。
/// </summary>
internal readonly record struct LibFieldValidationMessage(string MessageCode, object[] MessageArgs);

/// <summary>
/// LibField 最終驗證失敗的欄位與訊息資訊。
/// </summary>
internal sealed record LibFieldValidationFailure(string PropertyName, string MessageCode, object[] MessageArgs);
