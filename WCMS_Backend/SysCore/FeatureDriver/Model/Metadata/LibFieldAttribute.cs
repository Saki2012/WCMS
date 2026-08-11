using System.Collections;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using WCMS.Features._Resx;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
namespace WCMS.SysCore.FeatureDriver.Model.Metadata;

#region Interface
/// <summary>
/// WCMS 顯示名稱屬性共用介面。
/// </summary>
public interface ILibDisplayAttr
{
    #region Property
    /// <summary>
    /// 主要顯示名稱資源 Key。
    /// </summary>
    string? DescKey { get; }
    /// <summary>
    /// 別名顯示名稱資源 Key。
    /// </summary>
    string? AliasKey { get; }
    #endregion
}
/// <summary>
/// WCMS API 欄位屬性共用介面。
/// </summary>
public interface ILibFieldAttr : ILibDisplayAttr
{
    #region Property
    /// <summary>
    /// API 欄位讀寫模式。
    /// </summary>
    ApiFieldMode ApiMode { get; }
    /// <summary>
    /// 欄位是否必須提供有效內容。
    /// </summary>
    bool Required { get; }
    #endregion
}
/// <summary>
/// API 欄位讀寫模式。
/// </summary>
[Flags]
public enum ApiFieldMode : byte
{
    /// <summary>
    /// API 不可讀不可寫。
    /// </summary>
    Ignore = 0,
    /// <summary>
    /// API 可讀不可寫。
    /// </summary>
    ReadOnly = 1 << 0,
    /// <summary>
    /// API 可寫不可讀。
    /// </summary>
    WriteOnly = 1 << 1,
    /// <summary>
    /// API 可讀可寫。
    /// </summary>
    ReadWrite = 1 << 2,
}
#endregion

#region Public
/// <summary>
/// WCMS 一般欄位屬性。
/// </summary>
[AttributeUsage(AttributeTargets.Property, Inherited = false, AllowMultiple = false)]
public sealed class LibFieldAttribute : ValidationAttribute, ILibFieldAttr
{
    #region Property
    /// <summary>
    /// 主要顯示名稱資源 Key。
    /// </summary>
    public string? DescKey { get; }

    /// <summary>
    /// 別名顯示名稱資源 Key。
    /// </summary>
    public string? AliasKey { get; set; }

    /// <summary>
    /// API 欄位讀寫模式。
    /// </summary>
    public ApiFieldMode ApiMode { get; }

    /// <summary>
    /// 欄位是否必須提供有效內容。
    /// </summary>
    public bool Required { get; set; }
    #endregion

    #region Public
    /// <summary>
    /// 建立只有 API 權限的欄位屬性。
    /// </summary>
    public LibFieldAttribute(ApiFieldMode apiMode)
    {
        ApiMode = apiMode;
    }

    /// <summary>
    /// 建立含 API 權限與顯示名稱的欄位屬性。
    /// </summary>
    public LibFieldAttribute(ApiFieldMode apiMode, string descKey) : this(apiMode, descKey, string.Empty)
    {
    }

    /// <summary>
    /// 建立含 API 權限、主要顯示名稱與別名顯示名稱的欄位屬性。
    /// </summary>
    public LibFieldAttribute(ApiFieldMode apiMode, string descKey, string aliasKey)
    {
        ApiMode = apiMode;
        DescKey = descKey;
        AliasKey = string.IsNullOrWhiteSpace(aliasKey) ? null : aliasKey;
    }
    #endregion

    #region Protected
    /// <summary>
    /// 依正規化後的欄位值執行必填驗證。
    /// </summary>
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        return LibFieldValidationHelper.ValidateRequired(Required, value);
    }
    #endregion
}
/// <summary>
/// WCMS 字串欄位屬性。
/// </summary>
/// <remarks>
/// 建立含 API 權限、長度、主要顯示名稱與別名顯示名稱的字串欄位屬性。
/// </remarks>
[AttributeUsage(AttributeTargets.Property, Inherited = false, AllowMultiple = false)]
public sealed class LibStrAttribute(ApiFieldMode apiMode, int maximumLength, string descKey, string aliasKey) : StringLengthAttribute(maximumLength), ILibFieldAttr
{
    #region Property
    /// <summary>
    /// 主要顯示名稱資源 Key。
    /// </summary>
    public string? DescKey { get; } = descKey;

    /// <summary>
    /// 別名顯示名稱資源 Key。
    /// </summary>
    public string? AliasKey { get; set; } = string.IsNullOrWhiteSpace(aliasKey) ? null : aliasKey;

    /// <summary>
    /// API 欄位讀寫模式。
    /// </summary>
    public ApiFieldMode ApiMode { get; } = apiMode;

    /// <summary>
    /// 欄位是否必須提供有效內容。
    /// </summary>
    public bool Required { get; set; }
    #endregion

    #region Public
    /// <summary>
    /// 建立含 API 權限、長度與顯示名稱的字串欄位屬性。
    /// </summary>
    public LibStrAttribute(ApiFieldMode apiMode, int maximumLength, string descKey) : this(apiMode, maximumLength, descKey, string.Empty) { }
    #endregion

    #region Protected
    /// <summary>
    /// 先執行必填驗證，再執行原字串長度驗證。
    /// </summary>
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        ValidationResult? requiredResult = LibFieldValidationHelper.ValidateRequired(Required, value);
        if (requiredResult != null) return requiredResult;
        if (base.IsValid(value)) return ValidationResult.Success;
        return new ValidationResult(FormatErrorMessage(validationContext.DisplayName));
    }
    #endregion
}
/// <summary>
/// WCMS 數值欄位屬性。
/// </summary>
[AttributeUsage(AttributeTargets.Property, Inherited = false, AllowMultiple = false)]
public sealed class LibNumAttribute : ValidationAttribute, ILibFieldAttr
{
    #region Property
    /// <summary>
    /// 數值格式不正確的內部驗證識別碼。
    /// </summary>
    public const string InvalidNumberErrorKey = "WCMS_INVALID_NUMBER";
    /// <summary>
    /// 數值超出雙邊範圍的內部驗證識別碼。
    /// </summary>
    public const string NumberRangeErrorKey = "WCMS_NUMBER_RANGE";
    /// <summary>
    /// 數值低於最小值的內部驗證識別碼。
    /// </summary>
    public const string NumberMinimumErrorKey = "WCMS_NUMBER_MINIMUM";
    /// <summary>
    /// 數值高於最大值的內部驗證識別碼。
    /// </summary>
    public const string NumberMaximumErrorKey = "WCMS_NUMBER_MAXIMUM";
    /// <summary>
    /// 主要顯示名稱資源 Key。
    /// </summary>
    public string? DescKey { get; }
    /// <summary>
    /// 別名顯示名稱資源 Key。
    /// </summary>
    public string? AliasKey { get; set; }
    /// <summary>
    /// API 欄位讀寫模式。
    /// </summary>
    public ApiFieldMode ApiMode { get; }
    /// <summary>
    /// 欄位是否必須提供有效內容。
    /// </summary>
    public bool Required { get; set; }
    /// <summary>
    /// 數值下限；未設定代表不限制下限。
    /// </summary>
    public string? MinValue { get; set; }
    /// <summary>
    /// 數值上限；未設定代表不限制上限。
    /// </summary>
    public string? MaxValue { get; set; }
    /// <summary>
    /// 超出雙邊範圍時使用的 SysMessage Code。
    /// </summary>
    public string RangeMessageCode { get; set; } = SysMessageCode.BECode00037;
    /// <summary>
    /// 低於最小值時使用的 SysMessage Code。
    /// </summary>
    public string MinimumMessageCode { get; set; } = SysMessageCode.BECode00038;
    /// <summary>
    /// 高於最大值時使用的 SysMessage Code。
    /// </summary>
    public string MaximumMessageCode { get; set; } = SysMessageCode.BECode00039;
    /// <summary>
    /// 數值格式無法解析時使用的 SysMessage Code。
    /// </summary>
    public string InvalidMessageCode { get; set; } = SysMessageCode.BECode00040;
    /// <summary>
    /// 是否設定數值下限。
    /// </summary>
    public bool HasMinimum => !string.IsNullOrWhiteSpace(MinValue);
    /// <summary>
    /// 是否設定數值上限。
    /// </summary>
    public bool HasMaximum => !string.IsNullOrWhiteSpace(MaxValue);
    #endregion

    #region Public
    /// <summary>
    /// 建立只有 API 權限的數值欄位屬性。
    /// </summary>
    public LibNumAttribute(ApiFieldMode apiMode) => ApiMode = apiMode;
    /// <summary>
    /// 建立含 API 權限與顯示名稱的數值欄位屬性。
    /// </summary>
    public LibNumAttribute(ApiFieldMode apiMode, string descKey) : this(apiMode, descKey, string.Empty) { }
    /// <summary>
    /// 建立含 API 權限、主要顯示名稱與別名顯示名稱的數值欄位屬性。
    /// </summary>
    public LibNumAttribute(ApiFieldMode apiMode, string descKey, string aliasKey)
    {
        ApiMode = apiMode;
        DescKey = descKey;
        AliasKey = string.IsNullOrWhiteSpace(aliasKey) ? null : aliasKey;
    }

    #endregion

    #region Protected
    /// <summary>
    /// 驗證必填、數值格式與上下限規則。
    /// </summary>
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        ValidationResult? requiredResult = LibFieldValidationHelper.ValidateRequired(Required, value);
        if (requiredResult != null) return requiredResult;
        if (value == null) return ValidationResult.Success;
        NumericBounds bounds = GetBounds();
        if (!TryConvertNumber(value, out decimal number)) return CreateResult(InvalidNumberErrorKey, validationContext.MemberName);
        return ValidateBounds(number, bounds, validationContext.MemberName);
    }

    #endregion

    #region Private
    /// <summary>
    /// 驗證目前數值是否符合已設定的上下限。
    /// </summary>
    private static ValidationResult? ValidateBounds(decimal number, NumericBounds bounds, string? memberName)
    {
        if (bounds.Minimum.HasValue && number < bounds.Minimum.Value)
        {
            string errorKey = bounds.Maximum.HasValue ? NumberRangeErrorKey : NumberMinimumErrorKey;
            return CreateResult(errorKey, memberName);
        }
        if (bounds.Maximum.HasValue && number > bounds.Maximum.Value)
        {
            string errorKey = bounds.Minimum.HasValue ? NumberRangeErrorKey : NumberMaximumErrorKey;
            return CreateResult(errorKey, memberName);
        }
        return ValidationResult.Success;
    }
    /// <summary>
    /// 解析 Attribute 設定的上下限。
    /// </summary>
    private NumericBounds GetBounds()
    {
        decimal? minimum = ParseLimit(MinValue, nameof(MinValue));
        decimal? maximum = ParseLimit(MaxValue, nameof(MaxValue));
        if (minimum.HasValue && maximum.HasValue && minimum > maximum) throw new InvalidOperationException($"{nameof(LibNumAttribute)} 的 MinValue 不可大於 MaxValue。");
        return new NumericBounds(minimum, maximum);
    }
    /// <summary>
    /// 將限制值轉成 decimal，設定錯誤時拋出開發例外。
    /// </summary>
    private static decimal? ParseLimit(string? value, string propertyName)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        bool isValid = decimal.TryParse(value, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.InvariantCulture, out decimal result);
        if (isValid) return result;
        throw new InvalidOperationException($"{nameof(LibNumAttribute)} 的 {propertyName} 不是有效數值：{value}");
    }
    /// <summary>
    /// 將支援的數值型別安全轉成 decimal。
    /// </summary>
    private static bool TryConvertNumber(object value, out decimal result)
    {
        result = default;
        Type type = value.GetType();
        if (!IsSupportedNumberType(type)) return false;
        try
        {
            result = Convert.ToDecimal(value, CultureInfo.InvariantCulture);
            return true;
        }
        catch (Exception ex) when (ex is FormatException or InvalidCastException or OverflowException)
        {
            return false;
        }
    }

    /// <summary>
    /// 判斷欄位值是否為支援的基礎數值型別。
    /// </summary>
    private static bool IsSupportedNumberType(Type type)
    {
        if (type.IsEnum) return false;
        return Type.GetTypeCode(type) is
            TypeCode.Byte or
            TypeCode.SByte or
            TypeCode.Int16 or
            TypeCode.UInt16 or
            TypeCode.Int32 or
            TypeCode.UInt32 or
            TypeCode.Int64 or
            TypeCode.UInt64 or
            TypeCode.Single or
            TypeCode.Double or
            TypeCode.Decimal;
    }

    /// <summary>
    /// 建立供 ModelState 辨識的驗證結果。
    /// </summary>
    private static ValidationResult CreateResult(string errorKey, string? memberName)
    {
        if (string.IsNullOrWhiteSpace(memberName)) return new ValidationResult(errorKey);
        return new ValidationResult(errorKey, [memberName]);
    }
    /// <summary>
    /// 已解析的數值上下限。
    /// </summary>
    private readonly record struct NumericBounds(decimal? Minimum, decimal? Maximum);
    #endregion
}

#endregion

#region Internal
/// <summary>
/// LibField / LibStr 共用欄位值驗證工具。
/// </summary>
internal static class LibFieldValidationHelper
{
    #region Property
    private const string RequiredErrorMessage = "WCMS_REQUIRED";
    #endregion

    #region Public
    /// <summary>
    /// 必填欄位沒有內容時回傳驗證錯誤。
    /// </summary>
    public static ValidationResult? ValidateRequired(bool required, object? value)
    {
        if (!required || !IsEmptyValue(value)) return ValidationResult.Success;
        return new ValidationResult(RequiredErrorMessage);
    }
    #endregion

    #region Private
    /// <summary>
    /// 判斷目前值是否沒有可用內容。
    /// </summary>
    private static bool IsEmptyValue(object? value)
    {
        if (value == null) return true;
        if (value is string text) return string.IsNullOrWhiteSpace(text);
        return value is ICollection collection && collection.Count == 0;
    }
    #endregion
}
/// <summary>
/// WCMS 顯示名稱屬性解析工具。
/// </summary>
internal static class LibDisplayAttributeHelper
{
    #region Public
    /// <summary>
    /// 取得顯示名稱文字。
    /// </summary>
    public static string GetDescriptionText(ILibDisplayAttr attr)
    {
        var aliasValue = GetResourceValue(attr.AliasKey);
        if (!string.IsNullOrWhiteSpace(aliasValue)) return aliasValue;
        var descValue = GetResourceValue(attr.DescKey);
        if (!string.IsNullOrWhiteSpace(descValue)) return descValue;
        return GetFallbackText(attr);
    }
    #endregion

    #region Private
    /// <summary>
    /// 依資源 Key 取得多語系文字。
    /// </summary>
    private static string? GetResourceValue(string? resourceKey)
    {
        if (string.IsNullOrWhiteSpace(resourceKey)) return null;
        var result = ReadResourceValue(resourceKey);
        return string.IsNullOrWhiteSpace(result) ? null : result;
    }

    /// <summary>
    /// 從 Spec 或 Core Resx 讀取顯示名稱。
    /// </summary>
    private static string? ReadResourceValue(string resourceKey)
    {
        var coreBaseName = typeof(DisplayName).FullName!;
        var specBaseName = GetSpecBaseName();
        var asm = typeof(DisplayName).Assembly;
        var result = LibResxReader.TryGetSpecOrCore(coreBaseName, specBaseName, asm, resourceKey, CultureInfo.CurrentUICulture);
        return result;
    }

    /// <summary>
    /// 組成 Spec 專用 Resx BaseName。
    /// </summary>
    private static string? GetSpecBaseName()
    {
        if (string.IsNullOrWhiteSpace(SpecSettings.SpecCode)) return null;
        var result = $"{nameof(WCMS)}.{SpecSettings.SpecFeatures}.{SpecSettings.SpecCode}._Resx.SpecModelDisplayName";
        return result;
    }

    /// <summary>
    /// 找不到資源時，回傳 bracket key 供開發時辨識。
    /// </summary>
    private static string GetFallbackText(ILibDisplayAttr attr)
    {
        var fallbackKey = attr.AliasKey ?? attr.DescKey;
        if (string.IsNullOrWhiteSpace(fallbackKey)) return string.Empty;
        var result = $"[{fallbackKey}]";
        return result;
    }
    #endregion
}
#endregion
