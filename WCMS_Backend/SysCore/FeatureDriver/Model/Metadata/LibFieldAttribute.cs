using System.Collections;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
namespace WCMS.SysCore.FeatureDriver.Model.MetaData;

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
[AttributeUsage(AttributeTargets.Property, Inherited = false, AllowMultiple = false)]
public sealed class LibStrAttribute : StringLengthAttribute, ILibFieldAttr
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
    /// 建立含 API 權限、長度與顯示名稱的字串欄位屬性。
    /// </summary>
    public LibStrAttribute(ApiFieldMode apiMode, int maximumLength, string descKey)
        : this(apiMode, maximumLength, descKey, string.Empty)
    {
    }

    /// <summary>
    /// 建立含 API 權限、長度、主要顯示名稱與別名顯示名稱的字串欄位屬性。
    /// </summary>
    public LibStrAttribute(ApiFieldMode apiMode, int maximumLength, string descKey, string aliasKey)
        : base(maximumLength)
    {
        ApiMode = apiMode;
        DescKey = descKey;
        AliasKey = string.IsNullOrWhiteSpace(aliasKey) ? null : aliasKey;
    }
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