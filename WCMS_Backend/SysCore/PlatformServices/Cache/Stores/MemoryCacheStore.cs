using Microsoft.Extensions.Caching.Memory;
namespace WCMS.SysCore.PlatformServices.Cache.Stores;

/// <summary>
/// 使用 IMemoryCache 實作一般資料與 Runtime Metadata 的 Local Cache Store。
/// </summary>
public sealed class MemoryCacheStore(IMemoryCache cache) : ILocalCacheStore
{
    #region Property
    private readonly IMemoryCache _cache = cache;
    #endregion

    #region Public
    /// <summary>
    /// 讀取指定 Local Cache。
    /// </summary>
    public CacheReadResult<T> Get<T>(string key)
    {
        bool isHit = _cache.TryGetValue(key, out CacheReadResult<T> result);
        return isHit ? result : CacheReadResult<T>.Miss();
    }
    /// <summary>
    /// 寫入指定 Local Cache。
    /// </summary>
    public void Set<T>(string key, T? value, CacheOptions options)
    {
        _cache.Set(key, CacheReadResult<T>.Hit(value), BuildMemoryOptions(options));
    }
    /// <summary>
    /// 移除指定 Local Cache。
    /// </summary>
    public void Remove(string key)
    {
        _cache.Remove(key);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將 WCMS Cache 時效設定轉成 IMemoryCache 設定。
    /// </summary>
    private static MemoryCacheEntryOptions BuildMemoryOptions(CacheOptions options)
    {
        var result = new MemoryCacheEntryOptions();
        if (options.ExpirationStrategy == CacheExpirationStrategy.ProcessLifetime)
            result.Priority = CacheItemPriority.NeverRemove;
        if (options.ExpirationStrategy == CacheExpirationStrategy.Absolute)
            result.AbsoluteExpirationRelativeToNow = options.Expiration;
        if (options.ExpirationStrategy == CacheExpirationStrategy.Sliding)
            result.SlidingExpiration = options.Expiration;
        return result;
    }
    #endregion
}
