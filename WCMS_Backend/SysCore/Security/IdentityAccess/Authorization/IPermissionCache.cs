namespace WCMS.SysCore.Security.IdentityAccess.Authorization;

/// <summary>
/// 保存使用者目前完整有效權限。
/// </summary>
public sealed class EffectivePermissionSet
{
    #region Property
    /// <summary>
    /// 是否具備系統管理者權限。
    /// </summary>
    public bool IsAdmin { get; set; }
    /// <summary>
    /// 各功能有效權限遮罩。
    /// </summary>
    public Dictionary<string, FuncAction> Permissions { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    #endregion

    #region Public
    /// <summary>
    /// 取得指定功能的有效權限遮罩。
    /// </summary>
    public FuncAction GetMask(string progId)
    {
        if (IsAdmin) return FuncAction.All;
        return Permissions.TryGetValue(progId, out FuncAction mask) ? mask : FuncAction.None;
    }
    #endregion
}

/// <summary>
/// 定義使用者有效權限查詢與失效能力。
/// </summary>
public interface IPermissionCache
{
    /// <summary>
    /// 取得使用者完整有效權限快照。
    /// </summary>
    Task<EffectivePermissionSet> GetEffectivePermissionsAsync(string userId, CancellationToken ct = default);
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
