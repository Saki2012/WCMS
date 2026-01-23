using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using WCMS.Features.Member.Account;
using WCMS.Features.Member.RolePermission;
using WCMS.SysCore.Enum;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.Library.LibAttribute
{
    /// <summary>
    /// Controller/Action 權限 metadata 契約
    /// </summary>
    public interface ILibPermissionMeta
    {
        string ModuleCode { get; }
        string ProgId { get; }
        string TitleCode { get; } // i18n key（建議保留，不要用 Title 文字）
        FuncAction SupportFuncActMask { get; }
    }

    public interface ILibRequireFuncActMeta
    {
        public FuncAction RequiredAct { get; }
    }

    /// <summary>
    /// Action 需要的權限動作（Query/Create/Update/Delete/Invalid/Use）
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, Inherited = true, AllowMultiple = false)]
    public sealed class LibRequireFuncActAttribute(FuncAction requiredAct) : Attribute, ILibRequireFuncActMeta
    {
        public FuncAction RequiredAct { get; } = requiredAct;
    }

    ///////////////////////////////////
    public interface ILibPermissionChecker
    {
        /// <summary>檢查 user 是否有 progId 的 requiredAct 權限</summary>
        Task<bool> HasPermissionAsync(string userId, string progId, FuncAction requiredAct, CancellationToken ct);
    }

    public sealed class LibPermissionChecker(ApplicationDbContext db, IMemoryCache cache) : ILibPermissionChecker
    {
        #region Public
        /// <summary>
        /// 檢查 userId 對 progId 是否具備 requiredAct
        /// </summary>
        public async Task<bool> HasPermissionAsync(string userId, string progId, FuncAction requiredAct, CancellationToken ct)
        {
            // 基本防呆
            if (string.IsNullOrWhiteSpace(userId)) return false;
            if (string.IsNullOrWhiteSpace(progId)) return false;
            if (requiredAct == 0) return true;
            var cacheKey = BuildCacheKey(userId, progId);
            if (cache.TryGetValue(cacheKey, out FuncAction cachedMask)) return (cachedMask & requiredAct) == requiredAct;
            var effectiveMask = await LoadEffectiveMaskAsync(userId, progId, ct);
            cache.Set(cacheKey, effectiveMask, new MemoryCacheEntryOptions { SlidingExpiration = TimeSpan.FromMinutes(5), });
            return (effectiveMask & requiredAct) == requiredAct;
        }
        #endregion

        #region Private
        /// <summary>
        /// 從 DB 計算 userId + progId 的有效權限遮罩
        /// </summary>
        private async Task<FuncAction> LoadEffectiveMaskAsync(string userId, string progId, CancellationToken ct)
        {
            var roleIds = await db.Set<AccountModel>().AsNoTracking().Where(x => x.AccountId == userId).Select(x => x.RoleId).Distinct().ToListAsync(ct);
            if (roleIds.Count == 0) return FuncAction.None;
            var isAdmin = await db.Set<RoleDataModel>().AsNoTracking().AnyAsync(x => roleIds.Contains(x.RoleId) && x.IsAdmin, ct);
            if (isAdmin) return FuncAction.All;
            var rules = await db.Set<RolePermissionModel>().AsNoTracking().Where(x => roleIds.Contains(x.RoleId) && x.PermissionKey == progId).Select(x => new { x.GrantMask }).ToListAsync(ct);
            var grant = MergeMask(rules.Select(x => x.GrantMask));
            return grant;
        }
        /// <summary>
        /// OR 合併多個 mask
        /// </summary>
        private static FuncAction MergeMask(IEnumerable<FuncAction> masks)
        {
            var result = FuncAction.None;
            foreach (var m in masks) result |= m;
            return result;
        }
        /// <summary>
        /// 權限快取 key（同 user + prog 共用）
        /// </summary>
        private static string BuildCacheKey(string userId, string progId)
        {
            return $"perm:{userId}:{progId}".ToLowerInvariant();
        }
        #endregion
    }

}
