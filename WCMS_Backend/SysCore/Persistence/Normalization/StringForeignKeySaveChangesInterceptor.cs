using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace WCMS.SysCore.Persistence.Normalization;

/// <summary>
/// 在 EF SaveChanges 前再次正規化字串外鍵，防止 Biz 或 Repository 後續寫入錯誤值。
/// </summary>
internal sealed class StringForeignKeySaveChangesInterceptor
    : SaveChangesInterceptor
{
    #region Public
    /// <summary>
    /// 同步保存前正規化所有新增與修改 Entity。
    /// </summary>
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        NormalizeContext(eventData.Context);
        return base.SavingChanges(eventData, result);
    }
    /// <summary>
    /// 非同步保存前正規化所有新增與修改 Entity。
    /// </summary>
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        NormalizeContext(eventData.Context);
        return base.SavingChangesAsync(
            eventData,
            result,
            cancellationToken);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將目前 DbContext 的追蹤異動交給共用外鍵正規化器。
    /// </summary>
    private static void NormalizeContext(DbContext? db)
    {
        if (db == null) return;
        StringForeignKeyValueNormalizer.NormalizeTrackedEntries(db);
    }
    #endregion
}
