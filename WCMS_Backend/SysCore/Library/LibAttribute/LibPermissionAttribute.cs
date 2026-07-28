using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using WCMS.Features._Resx;
using WCMS.Features.IAM.Account;
using WCMS.Features.IAM.RolePermission;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.Library.LibAttribute
{
    /// <summary>
    /// Controller/Action 權限 metadata 契約。
    /// </summary>
    public interface ILibPermissionMeta
    {
        ModuleCodeEnum ModuleCode { get; }
        string ProgId { get; }
        FuncAction SupportFuncActMask { get; }
    }

    public interface ILibRequireFuncActMeta
    {
        FuncAction RequiredAct { get; }
    }

    /// <summary>
    /// Action 需要的權限動作。
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, Inherited = true, AllowMultiple = false)]
    public sealed class LibRequireFuncActAttribute(FuncAction requiredAct) : Attribute, ILibRequireFuncActMeta
    {
        public FuncAction RequiredAct { get; } = requiredAct;
    }

    /// <summary>
    /// 使用者目前的完整有效權限快照。
    /// </summary>
    public sealed class EffectivePermissionSet
    {
        public bool IsAdmin { get; init; }
        public IReadOnlyDictionary<string, FuncAction> Permissions { get; init; }
            = new Dictionary<string, FuncAction>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// 取得指定功能的有效權限遮罩。
        /// </summary>
        public FuncAction GetMask(string progId)
        {
            if (IsAdmin) return FuncAction.All;
            if (string.IsNullOrWhiteSpace(progId)) return FuncAction.None;
            return Permissions.TryGetValue(progId, out var mask) ? mask : FuncAction.None;
        }
    }

    public interface ILibPermissionChecker
    {
        /// <summary>取得使用者完整有效權限快照。</summary>
        Task<EffectivePermissionSet> GetEffectivePermissionsAsync(string userId, CancellationToken ct);

        /// <summary>檢查使用者是否具備指定功能動作權限。</summary>
        Task<bool> HasPermissionAsync(string userId, string progId, FuncAction requiredAct, CancellationToken ct);

        /// <summary>清除指定使用者的權限快取。</summary>
        void InvalidateUser(string userId);

        /// <summary>清除指定角色所屬使用者的權限快取。</summary>
        Task InvalidateRoleAsync(string roleId, CancellationToken ct);
    }

    public sealed class LibPermissionChecker(ApplicationDbContext db, IMemoryCache cache) : ILibPermissionChecker
    {
        #region Public
        /// <summary>
        /// 取得使用者完整有效權限快照；登入與 API 驗證共用同一份快取。
        /// </summary>
        public async Task<EffectivePermissionSet> GetEffectivePermissionsAsync(string userId, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(userId)) return new EffectivePermissionSet();

            var cacheKey = BuildCacheKey(userId);
            if (cache.TryGetValue(cacheKey, out EffectivePermissionSet? cached) && cached != null) return cached;

            var result = await LoadEffectivePermissionsAsync(userId, ct);
            cache.Set(cacheKey, result, BuildCacheOptions());
            return result;
        }

        /// <summary>
        /// 檢查使用者是否具備指定功能動作權限。
        /// </summary>
        public async Task<bool> HasPermissionAsync(string userId, string progId, FuncAction requiredAct, CancellationToken ct)
        {
            if (requiredAct == FuncAction.None) return true;

            var permissions = await GetEffectivePermissionsAsync(userId, ct);
            var effectiveMask = permissions.GetMask(progId);
            return (effectiveMask & requiredAct) == requiredAct;
        }

        /// <summary>
        /// 清除指定使用者的權限快取，供重新登入或權限異動後重載。
        /// </summary>
        public void InvalidateUser(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId)) return;
            cache.Remove(BuildCacheKey(userId));
        }

        /// <summary>
        /// 清除指定角色下所有使用者的權限快取。
        /// </summary>
        public async Task InvalidateRoleAsync(string roleId, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(roleId)) return;

            var userIds = await db.Set<AccountModel>()
                .AsNoTracking()
                .Where(x => x.RoleId == roleId)
                .Select(x => x.AccountId)
                .ToListAsync(ct);

            foreach (var userId in userIds) InvalidateUser(userId);
        }
        #endregion

        #region Private
        /// <summary>
        /// 從資料庫載入角色與全部功能權限。
        /// </summary>
        private async Task<EffectivePermissionSet> LoadEffectivePermissionsAsync(string userId, CancellationToken ct)
        {
            var roleIds = await LoadRoleIdsAsync(userId, ct);
            if (roleIds.Count == 0) return new EffectivePermissionSet();

            var isAdmin = await IsAdminRoleAsync(roleIds, ct);
            if (isAdmin) return new EffectivePermissionSet { IsAdmin = true };

            var permissions = await LoadPermissionMapAsync(roleIds, ct);
            return new EffectivePermissionSet { Permissions = permissions };
        }

        /// <summary>
        /// 取得使用者所屬角色代碼。
        /// </summary>
        private async Task<List<string>> LoadRoleIdsAsync(string userId, CancellationToken ct)
        {
            return await db.Set<AccountModel>()
                .AsNoTracking()
                .Where(x => x.AccountId == userId && x.RoleId != null)
                .Select(x => x.RoleId!)
                .Distinct()
                .ToListAsync(ct);
        }

        /// <summary>
        /// 判斷任一角色是否為系統管理者。
        /// </summary>
        private async Task<bool> IsAdminRoleAsync(IReadOnlyCollection<string> roleIds, CancellationToken ct)
        {
            return await db.Set<RoleDataModel>()
                .AsNoTracking()
                .AnyAsync(x => roleIds.Contains(x.RoleId) && x.IsAdmin, ct);
        }

        /// <summary>
        /// 讀取並合併角色功能權限。
        /// </summary>
        private async Task<Dictionary<string, FuncAction>> LoadPermissionMapAsync(IReadOnlyCollection<string> roleIds, CancellationToken ct)
        {
            var rows = await db.Set<RolePermissionModel>()
                .AsNoTracking()
                .Where(x => roleIds.Contains(x.RoleId))
                .Select(x => new { x.PermissionKey, x.GrantMask })
                .ToListAsync(ct);

            return rows
                .Where(x => !string.IsNullOrWhiteSpace(x.PermissionKey))
                .GroupBy(x => x.PermissionKey, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(x => x.Key, x => MergeMask(x.Select(y => y.GrantMask)), StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// OR 合併多筆權限遮罩。
        /// </summary>
        private static FuncAction MergeMask(IEnumerable<FuncAction> masks)
        {
            var result = FuncAction.None;
            foreach (var mask in masks) result |= mask;
            return result;
        }

        /// <summary>
        /// 建立權限快取設定。
        /// </summary>
        private static MemoryCacheEntryOptions BuildCacheOptions()
        {
            return new MemoryCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromMinutes(5),
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
            };
        }

        /// <summary>
        /// 建立使用者完整權限快取 Key。
        /// </summary>
        private static string BuildCacheKey(string userId)
        {
            return $"perm:{userId}".ToLowerInvariant();
        }
        #endregion
    }
}
