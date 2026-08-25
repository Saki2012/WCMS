using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using WCMS.Features._Resx;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.FeatureDriver.Model.Metadata;

namespace WCMS.SysCore.Persistence.Normalization;

/// <summary>
/// 在 EF SaveChanges 前再次驗證 LibStr / LibNum，避免 Biz 或 Repository 後續寫入繞過 API Model Validation。
/// </summary>
internal sealed class LibFieldSaveChangesInterceptor : SaveChangesInterceptor
{
    #region Property
    private const string RequiredErrorKey = "WCMS_REQUIRED";
    private static readonly ConcurrentDictionary<Type, LibFieldWriteRule[]> RuleCache = new();
    #endregion

    #region Public
    /// <summary>
    /// 同步保存前驗證所有新增與修改 Entity 的 LibStr / LibNum 欄位。
    /// </summary>
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        ValidateContext(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    /// <summary>
    /// 非同步保存前驗證所有新增與修改 Entity 的 LibStr / LibNum 欄位。
    /// </summary>
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ValidateContext(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
    #endregion

    #region Private
    /// <summary>
    /// 驗證目前 DbContext 內所有待新增與修改資料。
    /// </summary>
    private static void ValidateContext(DbContext? db)
    {
        if (db == null) return;
        foreach (EntityEntry entry in db.ChangeTracker.Entries().Where(IsWritableEntry))
            ValidateEntry(entry);
    }

    /// <summary>
    /// 判斷 ChangeTracker Entry 是否屬於待寫入資料。
    /// </summary>
    private static bool IsWritableEntry(EntityEntry entry)
    {
        return entry.State is EntityState.Added or EntityState.Modified;
    }

    /// <summary>
    /// 依快取規則驗證單一 Entity 的持久化欄位。
    /// </summary>
    private static void ValidateEntry(EntityEntry entry)
    {
        Type entityType = entry.Metadata.ClrType;
        LibFieldWriteRule[] rules = RuleCache.GetOrAdd(entityType, BuildRules);
        foreach (LibFieldWriteRule rule in rules)
        {
            if (entry.Metadata.FindProperty(rule.PropertyName) == null) continue;
            object? value = entry.Property(rule.PropertyName).CurrentValue;
            ValidateRule(entry.Entity, entityType, rule, value);
        }
    }

    /// <summary>
    /// 建立單一 Entity 型別需要執行的 LibStr / LibNum 驗證規則。
    /// </summary>
    private static LibFieldWriteRule[] BuildRules(Type entityType)
    {
        return [.. entityType.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(CreateRule)
            .Where(rule => rule != null)
            .Cast<LibFieldWriteRule>()];
    }

    /// <summary>
    /// 將 Property Attribute 轉成可快取的驗證規則。
    /// </summary>
    private static LibFieldWriteRule? CreateRule(PropertyInfo property)
    {
        LibStrAttribute? strAttr = property.GetCustomAttribute<LibStrAttribute>(true);
        if (strAttr != null) return new LibFieldWriteRule(property.Name, strAttr, null);
        LibNumAttribute? numAttr = property.GetCustomAttribute<LibNumAttribute>(true);
        return numAttr == null ? null : new LibFieldWriteRule(property.Name, null, numAttr);
    }

    /// <summary>
    /// 依規則驗證欄位，驗證失敗時拋出 WCMS 可辨識的 400 例外。
    /// </summary>
    private static void ValidateRule(object entity, Type entityType, LibFieldWriteRule rule, object? value)
    {
        ValidationContext context = new(entity) { MemberName = rule.PropertyName, DisplayName = rule.PropertyName };
        WCMSFieldValidationException? exception = rule.StrAttribute != null
            ? ValidateString(entityType, rule.PropertyName, rule.StrAttribute, value, context)
            : ValidateNumber(entityType, rule.PropertyName, rule.NumAttribute!, value, context);
        if (exception != null) throw exception;
    }

    /// <summary>
    /// 驗證 LibStr 的必填與最大長度規則。
    /// </summary>
    private static WCMSFieldValidationException? ValidateString(
        Type entityType,
        string propertyName,
        LibStrAttribute attr,
        object? value,
        ValidationContext context)
    {
        ValidationResult? result = attr.GetValidationResult(value, context);
        if (result == ValidationResult.Success) return null;
        if (result?.ErrorMessage == RequiredErrorKey)
            return CreateException(entityType, propertyName, SysMessageCode.BECode00035);
        return CreateException(entityType, propertyName, SysMessageCode.BECode00034, attr.MaximumLength);
    }

    /// <summary>
    /// 驗證 LibNum 的必填、數值格式與上下限規則。
    /// </summary>
    private static WCMSFieldValidationException? ValidateNumber(
        Type entityType,
        string propertyName,
        LibNumAttribute attr,
        object? value,
        ValidationContext context)
    {
        ValidationResult? result = attr.GetValidationResult(value, context);
        if (result == ValidationResult.Success) return null;
        string errorKey = result?.ErrorMessage ?? LibNumAttribute.InvalidNumberErrorKey;
        return CreateNumberException(entityType, propertyName, attr, errorKey);
    }

    /// <summary>
    /// 將 LibNum 驗證結果轉成對應的 WCMS Message Code。
    /// </summary>
    private static WCMSFieldValidationException CreateNumberException(
        Type entityType,
        string propertyName,
        LibNumAttribute attr,
        string errorKey)
    {
        if (errorKey == RequiredErrorKey) return CreateException(entityType, propertyName, SysMessageCode.BECode00035);
        if (errorKey == LibNumAttribute.NumberRangeErrorKey)
            return CreateException(entityType, propertyName, attr.RangeMessageCode, attr.MinValue ?? string.Empty, attr.MaxValue ?? string.Empty);
        if (errorKey == LibNumAttribute.NumberMinimumErrorKey)
            return CreateException(entityType, propertyName, attr.MinimumMessageCode, attr.MinValue ?? string.Empty);
        if (errorKey == LibNumAttribute.NumberMaximumErrorKey)
            return CreateException(entityType, propertyName, attr.MaximumMessageCode, attr.MaxValue ?? string.Empty);
        return CreateException(entityType, propertyName, attr.InvalidMessageCode);
    }

    /// <summary>
    /// 建立保留 Entity / Property 資訊的 WCMS 欄位驗證例外。
    /// </summary>
    private static WCMSFieldValidationException CreateException(
        Type entityType,
        string propertyName,
        string messageCode,
        params object[] messageArgs)
    {
        return new WCMSFieldValidationException(entityType.Name, propertyName, messageCode, messageArgs);
    }

    /// <summary>
    /// 保存已快取的 LibStr / LibNum 欄位規則。
    /// </summary>
    private sealed record LibFieldWriteRule(
        string PropertyName,
        LibStrAttribute? StrAttribute,
        LibNumAttribute? NumAttribute);
    #endregion
}
