using Microsoft.EntityFrameworkCore;
using WCMS.Features.IAM.Account;
using WCMS.SysCore.Persistence;
using WCMS.SysCore.PlatformServices.Cache;
using WCMS.SysCore.Security.IdentityAccess.Authorization;

namespace WCMS.Features.IAM.RolePermission;

/// <summary>
/// 快取使用者對指定程式的有效權限，並以使用者版本戳記提供精準失效。
/// </summary>
internal sealed class PermissionCache(ApplicationDbContext db, CacheService cacheService) : LibCacheBase(cacheService), IPermissionCache
{
    #region Property
    private const int CacheMinutes = 5;
    private const string EntryKeySegment = "entry";
    private const string VersionKeySegment = "version";
    private static readonly CacheOptions PermissionOptions = new()
    {
        Mode = CacheMode.DistributedOnly,
        ExpirationStrategy = CacheExpirationStrategy.Sliding,
        Expiration = TimeSpan.FromMinutes(CacheMinutes),
    };
    private static readonly CacheOptions VersionOptions = new()
    {
        Mode = CacheMode.DistributedOnly,
        ExpirationStrategy = CacheExpirationStrategy.Sliding,
        Expiration = TimeSpan.FromMinutes(CacheMinutes),
    };
    /// <summary>
    /// 權限來源資料庫內容。
    /// </summary>
    private ApplicationDbContext Db { get; } = db;
    /// <summary>
    /// 使用者有效權限 Cache 區域。
    /// </summary>
    protected override string CacheRegion => "identity-permission";
    #endregion

    #region Public
    /// <summary>
    /// 取得使用者對指定程式的有效權限遮罩。
    /// </summary>
    public async Task<FuncAction> GetEffectiveMaskAsync(string userId, string progId, CancellationToken ct = default)
    {
        string normalizedUserId = NormalizeKey(userId);
        string version = await GetUserVersionAsync(normalizedUserId, ct);
        string key = BuildPermissionKey(normalizedUserId, progId, version);
        FuncAction? result = await GetOrCreateAsync(key, PermissionOptions, token => LoadEffectiveMaskAsync(userId, progId, token), ct);
        return result ?? FuncAction.None;
    }
    /// <summary>
    /// 取得指定角色目前綁定的帳號，供角色權限異動後失效。
    /// </summary>
    public Task<List<string>> LoadUserIdsByRolesAsync(IEnumerable<string> roleIds, CancellationToken ct = default)
    {
        string[] ids = NormalizeIds(roleIds);
        if (ids.Length == 0) return Task.FromResult(new List<string>());
        return Db.Set<AccountModel>().AsNoTracking().Where(item => item.RoleId != null && ids.Contains(item.RoleId)).Select(item => item.AccountId).Distinct().ToListAsync(ct);
    }
    /// <summary>
    /// 更新指定使用者的權限版本，使既有程式權限 Key 立即失效。
    /// </summary>
    public async Task InvalidateUsersAsync(IEnumerable<string> userIds, CancellationToken ct = default)
    {
        string[] ids = [.. userIds.Where(id => !string.IsNullOrWhiteSpace(id)).Select(NormalizeKey).Distinct(StringComparer.Ordinal)];
        foreach (string userId in ids) await SetAsync(BuildVersionKey(userId), CreateVersion(), VersionOptions, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 正規化角色代號集合並移除重複值。
    /// </summary>
    private static string[] NormalizeIds(IEnumerable<string> ids)
    {
        return [.. ids.Where(id => !string.IsNullOrWhiteSpace(id)).Select(id => id.Trim()).Distinct(StringComparer.OrdinalIgnoreCase)];
    }
    /// <summary>
    /// 取得使用者目前的權限版本，首次讀取時建立新版本。
    /// </summary>
    private async Task<string> GetUserVersionAsync(string userId, CancellationToken ct)
    {
        string key = BuildVersionKey(userId);
        string? version = await GetOrCreateAsync(key, VersionOptions, _ => Task.FromResult<string?>(CreateVersion()), ct);
        return version ?? CreateVersion();
    }
    /// <summary>
    /// 建立包含使用者、程式與版本的權限資料 Key。
    /// </summary>
    private string BuildPermissionKey(string userId, string progId, string version)
    {
        return BuildCacheKey(EntryKeySegment, userId, NormalizeKey(progId), version);
    }
    /// <summary>
    /// 建立使用者權限版本 Key。
    /// </summary>
    private string BuildVersionKey(string userId)
    {
        return BuildCacheKey(VersionKeySegment, userId);
    }
    /// <summary>
    /// 建立不重複的使用者權限版本值。
    /// </summary>
    private static string CreateVersion()
    {
        return Guid.NewGuid().ToString("N");
    }
    /// <summary>
    /// 從帳號角色與角色權限資料計算有效權限遮罩。
    /// </summary>
    private async Task<FuncAction?> LoadEffectiveMaskAsync(string userId, string progId, CancellationToken ct)
    {
        List<string> roleIds = await LoadRoleIdsAsync(userId, ct);
        if (roleIds.Count == 0) return FuncAction.None;
        if (await HasAdminRoleAsync(roleIds, ct)) return FuncAction.All;
        List<FuncAction> masks = await LoadGrantMasksAsync(roleIds, progId, ct);
        return MergeMask(masks);
    }
    /// <summary>
    /// 取得指定帳號目前綁定的角色代號。
    /// </summary>
    private Task<List<string>> LoadRoleIdsAsync(string userId, CancellationToken ct)
    {
        return Db.Set<AccountModel>().AsNoTracking().Where(item => item.AccountId == userId && item.RoleId != null).Select(item => item.RoleId!).Distinct().ToListAsync(ct);
    }
    /// <summary>
    /// 判斷角色集合是否包含管理者角色。
    /// </summary>
    private Task<bool> HasAdminRoleAsync(IReadOnlyCollection<string> roleIds, CancellationToken ct)
    {
        return Db.Set<RoleDataModel>().AsNoTracking().AnyAsync(item => roleIds.Contains(item.RoleId) && item.IsAdmin, ct);
    }
    /// <summary>
    /// 取得角色集合對指定程式授予的權限遮罩。
    /// </summary>
    private Task<List<FuncAction>> LoadGrantMasksAsync(IReadOnlyCollection<string> roleIds, string progId, CancellationToken ct)
    {
        return Db.Set<RolePermissionModel>().AsNoTracking().Where(item => roleIds.Contains(item.RoleId) && item.PermissionKey == progId).Select(item => item.GrantMask).ToListAsync(ct);
    }
    /// <summary>
    /// OR 合併角色授予的多筆權限遮罩。
    /// </summary>
    private static FuncAction MergeMask(IEnumerable<FuncAction> masks)
    {
        FuncAction result = FuncAction.None;
        foreach (FuncAction mask in masks) result |= mask;
        return result;
    }
    /// <summary>
    /// 將權限 Cache Key 片段正規化為固定格式。
    /// </summary>
    private static string NormalizeKey(string value)
    {
        return value.Trim().ToLowerInvariant();
    }
    #endregion
}
