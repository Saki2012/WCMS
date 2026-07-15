namespace WCMS.SysCore.Security.IdentityAccess.Authorization;

/// <summary>
/// 定義使用者有效權限查詢與失效能力。
/// </summary>
public interface IPermissionCache
{
    /// <summary>
    /// 取得使用者對指定程式的有效權限遮罩。
    /// </summary>
    Task<FuncAction> GetEffectiveMaskAsync(string userId, string progId, CancellationToken ct = default);
    /// <summary>
    /// 取得指定角色目前綁定的帳號。
    /// </summary>
    Task<List<string>> LoadUserIdsByRolesAsync(IEnumerable<string> roleIds, CancellationToken ct = default);
    /// <summary>
    /// 更新指定使用者的權限版本以使既有 Cache 失效。
    /// </summary>
    Task InvalidateUsersAsync(IEnumerable<string> userIds, CancellationToken ct = default);
}
