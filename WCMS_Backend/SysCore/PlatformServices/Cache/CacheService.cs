using Microsoft.Extensions.Options;

namespace WCMS.SysCore.PlatformServices.Cache;

/// <summary>
/// 提供 API、Biz、Repo、Metadata 與模組 Cache 使用的一般資料入口。
/// </summary>
public sealed class CacheService(ICacheRoute cacheRoute, IOptions<CacheSettings> settings)
{
    #region Property
    private readonly ICacheRoute _cacheRoute = cacheRoute;
    private readonly CacheSettings _settings = settings.Value;
    #endregion

    #region Public
    /// <summary>
    /// 依指定模式讀取 Cache。
    /// </summary>
    public Task<CacheReadResult<T>> GetAsync<T>(string key, CacheOptions options, CancellationToken ct = default)
    {
        return _cacheRoute.GetAsync<T>(BuildKey(key), options, ct);
    }
    /// <summary>
    /// 依指定模式寫入 Cache。
    /// </summary>
    public Task SetAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct = default)
    {
        return _cacheRoute.SetAsync(BuildKey(key), value, options, ct);
    }
    /// <summary>
    /// 依指定模式移除 Cache。
    /// </summary>
    public Task RemoveAsync(string key, CacheOptions options, CancellationToken ct = default)
    {
        return _cacheRoute.RemoveAsync(BuildKey(key), options, ct);
    }
    /// <summary>
    /// 讀取 Cache，未命中時執行實體資料來源並回填。
    /// </summary>
    public async Task<T?> GetOrCreateAsync<T>(
        string key,
        CacheOptions options,
        Func<CancellationToken, Task<T?>> sourceFactory,
        CancellationToken ct = default)
    {
        string cacheKey = BuildKey(key);
        CacheReadResult<T> cached = await _cacheRoute.GetAsync<T>(cacheKey, options, ct);
        if (cached.IsHit) return cached.Value;
        T? value = await sourceFactory(ct);
        if (value is null && !options.CacheNullValue) return value;
        await _cacheRoute.SetAsync(cacheKey, value, options, ct);
        return value;
    }
    /// <summary>
    /// 同步讀取 Process Runtime 使用的 Local Cache。
    /// </summary>
    public CacheReadResult<T> GetLocal<T>(string key, CacheOptions options)
    {
        return _cacheRoute.GetLocal<T>(BuildKey(key), options);
    }
    /// <summary>
    /// 同步寫入 Process Runtime 使用的 Local Cache。
    /// </summary>
    public void SetLocal<T>(string key, T? value, CacheOptions options)
    {
        _cacheRoute.SetLocal(BuildKey(key), value, options);
    }
    /// <summary>
    /// 同步移除 Process Runtime 使用的 Local Cache。
    /// </summary>
    public void RemoveLocal(string key, CacheOptions options)
    {
        _cacheRoute.RemoveLocal(BuildKey(key), options);
    }
    /// <summary>
    /// 同步讀取 Local Cache，未命中時執行 Runtime 資料來源並回填。
    /// </summary>
    public T? GetOrCreateLocal<T>(string key, CacheOptions options, Func<T?> sourceFactory)
    {
        string cacheKey = BuildKey(key);
        CacheReadResult<T> cached = _cacheRoute.GetLocal<T>(cacheKey, options);
        if (cached.IsHit) return cached.Value;
        T? value = sourceFactory();
        if (value is null && !options.CacheNullValue) return value;
        _cacheRoute.SetLocal(cacheKey, value, options);
        return value;
    }
    #endregion

    #region Private
    /// <summary>
    /// 套用一般資料 Cache Key Prefix，避免與 OutputCache Key 衝突。
    /// </summary>
    private string BuildKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Cache Key 不可為空白。", nameof(key));
        return $"{_settings.DataKeyPrefix}{key}";
    }
    #endregion
}
