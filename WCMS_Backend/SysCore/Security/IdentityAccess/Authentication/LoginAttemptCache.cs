using WCMS.SysCore.PlatformServices.Cache;

namespace WCMS.SysCore.Security.IdentityAccess.Authentication;

/// <summary>
/// 保存登入帳號在限制期間內的失敗嘗試次數。
/// </summary>
public sealed class LoginAttemptCache(CacheService cacheService) : LibCacheBase(cacheService)
{
    #region Property
    private const int AttemptExpirationMinutes = 5;
    private static readonly CacheOptions AttemptOptions = new()
    {
        Mode = CacheMode.DistributedOnly,
        ExpirationStrategy = CacheExpirationStrategy.Absolute,
        Expiration = TimeSpan.FromMinutes(AttemptExpirationMinutes),
    };
    protected override string CacheRegion => "identity-login-attempt";
    #endregion

    #region Internal
    /// <summary>
    /// 取得指定帳號目前的登入失敗次數。
    /// </summary>
    internal async Task<int> GetAttemptsAsync(string account, CancellationToken ct = default)
    {
        string key = BuildAccountKey(account);
        CacheReadResult<int> cached = await CacheService.GetAsync<int>(key, AttemptOptions, ct);
        return cached.IsHit ? cached.Value : 0;
    }
    /// <summary>
    /// 保存指定帳號最新的登入失敗次數。
    /// </summary>
    internal Task SetAttemptsAsync(string account, int attempts, CancellationToken ct = default)
    {
        string key = BuildAccountKey(account);
        return CacheService.SetAsync(key, attempts, AttemptOptions, ct);
    }
    /// <summary>
    /// 清除指定帳號的登入失敗次數。
    /// </summary>
    internal Task ClearAsync(string account, CancellationToken ct = default)
    {
        return RemoveAsync(BuildAccountKey(account), AttemptOptions, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立不受帳號大小寫影響的登入失敗 Cache Key。
    /// </summary>
    private string BuildAccountKey(string account)
    {
        string normalized = string.IsNullOrWhiteSpace(account) ? "~" : account.Trim().ToLowerInvariant();
        return BuildCacheKey(normalized);
    }
    #endregion
}
