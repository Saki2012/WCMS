using Microsoft.EntityFrameworkCore;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.Persistence;

namespace WCMS.SysCore.FeatureDriver.Biz.Transactions;

/// <summary>
/// 統一處理 Biz SaveChanges、Commit、Rollback 與 afterCommit 流程。
/// </summary>
internal sealed class BizTransactionExecutor(ApplicationDbContext dataAccess, IErrorHelper message)
{
    #region Property
    private ApplicationDbContext DataAccess { get; } = dataAccess;
    private IErrorHelper Message { get; } = message;
    #endregion

    #region Internal
    /// <summary>
    /// 執行具有回傳值的完整 Biz 交易骨架。
    /// </summary>
    internal async Task<TResult> ExecuteAsync<TResult>(Func<CancellationToken, Task<TResult>> inTransaction, Func<TResult, CancellationToken, Task>? afterCommit = null, CancellationToken ct = default)
    {
        bool ownsTransaction = false;
        try
        {
            ct.ThrowIfCancellationRequested();
            ownsTransaction = await TryBeginAsync(ct);
            TResult result = await inTransaction(ct);
            if (Message.HasError)
            {
                await RollbackAsync(ownsTransaction, CancellationToken.None);
                return result;
            }
            await CommitAndRunAfterAsync(result, ownsTransaction, afterCommit, ct);
            return result;
        }
        catch
        {
            await RollbackAsync(ownsTransaction, CancellationToken.None);
            throw;
        }
    }
    /// <summary>
    /// 執行不需要回傳資料的完整 Biz 交易骨架。
    /// </summary>
    internal async Task ExecuteAsync(Func<CancellationToken, Task> inTransaction, Func<CancellationToken, Task>? afterCommit = null, CancellationToken ct = default)
    {
        Func<bool, CancellationToken, Task>? afterCommitAdapter =
            afterCommit == null
                ? null
                : async (_, token) => await afterCommit(token);
        await ExecuteAsync(
            async token =>
            {
                await inTransaction(token);
                return true;
            },
            afterCommitAdapter,
            ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 在目前 DbContext 尚無交易時建立交易。
    /// </summary>
    private async Task<bool> TryBeginAsync(CancellationToken ct)
    {
        if (DataAccess.Database.CurrentTransaction != null) return false;
        await DataAccess.Database.BeginTransactionAsync(ct);
        return true;
    }
    /// <summary>
    /// 只在目前流程擁有交易時執行 Rollback。
    /// </summary>
    private async Task RollbackAsync(bool ownsTransaction, CancellationToken ct)
    {
        if (!ownsTransaction) return;
        await DataAccess.Database.RollbackTransactionAsync(ct);
    }
    /// <summary>
    /// 儲存異動，並在目前流程擁有交易時 Commit。
    /// </summary>
    private async Task CommitAsync(bool ownsTransaction, CancellationToken ct)
    {
        await DataAccess.SaveChangesAsync(ct);
        if (!ownsTransaction) return;
        await DataAccess.Database.CommitTransactionAsync(ct);
    }
    /// <summary>
    /// Commit 後只由真正持有交易的流程執行 afterCommit。
    /// </summary>
    private async Task CommitAndRunAfterAsync<TResult>(TResult result, bool ownsTransaction, Func<TResult, CancellationToken, Task>? afterCommit, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        await CommitAsync(ownsTransaction, ct);
        if (ownsTransaction && afterCommit != null)
            await afterCommit(result, ct);
    }
    #endregion
}
