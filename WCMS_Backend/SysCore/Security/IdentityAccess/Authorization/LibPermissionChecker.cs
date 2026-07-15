
namespace WCMS.SysCore.Security.IdentityAccess.Authorization;

/// <summary>
/// 透過 PermissionCache 檢查使用者的有效程式權限。
/// </summary>
public sealed class LibPermissionChecker(IPermissionCache permissionCache)
{
    #region Property
    private IPermissionCache PermissionCache { get; } = permissionCache;
    #endregion

    #region Public
    /// <summary>
    /// 檢查使用者是否具備指定程式動作權限。
    /// </summary>
    public async Task<bool> HasPermissionAsync(
        string userId,
        string progId,
        FuncAction requiredAct,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(progId)) return false;
        if (requiredAct == FuncAction.None) return true;
        FuncAction effectiveMask = await PermissionCache.GetEffectiveMaskAsync(userId, progId, ct);
        return (effectiveMask & requiredAct) == requiredAct;
    }
    #endregion
}
