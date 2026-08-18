using WCMS.SysCore.PlatformServices.Cache;
namespace WCMS.SysCore.Security.IdentityAccess.Authentication;

/// <summary>
/// 保存 Refresh Token 擁有者與 Access Token 撤銷狀態。
/// </summary>
public sealed class TokenStateCache(CacheService cacheService) : LibCacheBase(cacheService)
{
    #region Property
    private const string RefreshTokenKey = "refresh";
    private const string AccessBlacklistKey = "access-blacklist";
    /// <summary>
    /// Local 單機階段保護 Refresh Rotation；未來 LB + Redis 必須替換為 Redis Atomic Operation。
    /// </summary>
    private readonly SemaphoreSlim _refreshRotationLock = new(1, 1);
    /// <summary>
    /// 提供讀取與移除所需的路由設定；不會改寫 Token 原有的 Absolute TTL。
    /// </summary>
    private static readonly CacheOptions RouteOnlyOptions = new()
    {
        Mode = CacheMode.DistributedOnly,
        ExpirationStrategy = CacheExpirationStrategy.Absolute,
        Expiration = TimeSpan.FromMinutes(1),
    };
    protected override string CacheRegion => "identity-token-state";
    #endregion

    #region Internal
    /// <summary>
    /// 保存 Refresh Token 與使用者的有效關聯。
    /// </summary>
    internal Task StoreRefreshAsync(string userId, string tokenId, DateTime expires, CancellationToken ct = default)
    {
        string key = BuildCacheKey(RefreshTokenKey, tokenId);
        CacheOptions options = BuildAbsoluteOptions(expires - DateTime.UtcNow);
        return CacheService.SetAsync(key, userId, options, ct);
    }
    /// <summary>
    /// 依 Refresh Token 代號取得使用者代號。
    /// </summary>
    internal async Task<string?> GetUserIdByRefreshIdAsync(string tokenId, CancellationToken ct = default)
    {
        string key = BuildCacheKey(RefreshTokenKey, tokenId);
        CacheReadResult<string> cached = await CacheService.GetAsync<string>(key, RouteOnlyOptions, ct);
        return cached.IsHit ? cached.Value : null;
    }
    /// <summary>
    /// 在單一 Backend Process 內原子化驗證 old RTID、建立 new RTID 並撤銷 old RTID。
    /// </summary>
    internal async Task<bool> TryRotateRefreshAsync(string userId, string oldTokenId, string newTokenId, DateTime newExpires, CancellationToken ct = default)
    {
        await _refreshRotationLock.WaitAsync(ct);
        try
        {
            return await TryRotateRefreshUnsafeAsync(userId, oldTokenId, newTokenId, newExpires);
        }
        finally
        {
            _refreshRotationLock.Release();
        }
    }
    /// <summary>
    /// 撤銷指定 Refresh Token。
    /// </summary>
    internal Task RevokeRefreshAsync(string tokenId, CancellationToken ct = default)
    {
        string key = BuildCacheKey(RefreshTokenKey, tokenId);
        return RemoveAsync(key, RouteOnlyOptions, ct);
    }
    /// <summary>
    /// 將 Access Token 加入撤銷清單。
    /// </summary>
    internal Task BlacklistAccessAsync(string jti, TimeSpan ttl, CancellationToken ct = default)
    {
        string key = BuildCacheKey(AccessBlacklistKey, jti);
        return CacheService.SetAsync(key, true, BuildAbsoluteOptions(ttl), ct);
    }
    /// <summary>
    /// 判斷 Access Token 是否已被撤銷。
    /// </summary>
    internal async Task<bool> IsAccessBlacklistedAsync(string jti, CancellationToken ct = default)
    {
        string key = BuildCacheKey(AccessBlacklistKey, jti);
        CacheReadResult<bool> cached = await CacheService.GetAsync<bool>(key, RouteOnlyOptions, ct);
        return cached.IsHit && cached.Value;
    }
    #endregion

    #region Private
    /// <summary>
    /// Refresh Rotation Lock 內執行完整 old → new 狀態交換；進入後不中斷以避免 Local State 半套更新。
    /// </summary>
    private async Task<bool> TryRotateRefreshUnsafeAsync(string userId, string oldTokenId, string newTokenId, DateTime newExpires)
    {
        string? owner = await GetUserIdByRefreshIdAsync(oldTokenId, CancellationToken.None);
        if (!string.Equals(owner, userId, StringComparison.OrdinalIgnoreCase)) return false;

        await StoreRefreshAsync(userId, newTokenId, newExpires, CancellationToken.None);
        await RevokeRefreshAsync(oldTokenId, CancellationToken.None);
        return true;
    }
    /// <summary>
    /// 建立符合 Token 剩餘有效時間的 Absolute Cache 設定。
    /// </summary>
    private static CacheOptions BuildAbsoluteOptions(TimeSpan ttl)
    {
        if (ttl <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(ttl), "Token Cache 有效時間必須大於零。");
        return new CacheOptions
        {
            Mode = CacheMode.DistributedOnly,
            ExpirationStrategy = CacheExpirationStrategy.Absolute,
            Expiration = ttl,
        };
    }
    #endregion
}
