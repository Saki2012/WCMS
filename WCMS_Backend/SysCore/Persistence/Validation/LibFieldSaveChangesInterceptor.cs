using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.FeatureDriver.Model.Validation;

namespace WCMS.SysCore.Persistence.Validation;

/// <summary>
/// 在 EF SaveChanges 前執行 LibField 最終驗證，避免後續寫入繞過 API Model Validation。
/// </summary>
internal sealed class LibFieldSaveChangesInterceptor : SaveChangesInterceptor
{
    #region Public
    /// <summary>
    /// 同步保存前驗證所有新增與修改 Entity。
    /// </summary>
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        ValidateContext(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    /// <summary>
    /// 非同步保存前驗證所有新增與修改 Entity。
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
    /// 將單一 Entity 交給共用 LibField Validator，失敗時轉成 WCMS 已知例外。
    /// </summary>
    private static void ValidateEntry(EntityEntry entry)
    {
        LibFieldValidationFailure? failure = LibFieldValidator.Validate(
            entry.Entity,
            propertyName => entry.Metadata.FindProperty(propertyName) != null);
        if (failure == null) return;

        throw new WCMSFieldValidationException(
            entry.Metadata.ClrType.Name,
            failure.PropertyName,
            failure.MessageCode,
            failure.MessageArgs);
    }
    #endregion
}
