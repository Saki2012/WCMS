using WCMS.SysCore.PlatformServices.Cache.Stores;

namespace WCMS.SysCore.PlatformServices.Cache;

/// <summary>
/// 統一處理 WCMS Cache 的 Local 與 Distributed 路由模式。
/// </summary>
public sealed class CacheRoute(
    ILocalCacheStore localStore,
    IDistributedCacheStore distributedStore,
    ILogger<CacheRoute> logger) : ICacheRoute
{
    #region Property
    private readonly ILocalCacheStore _localStore = localStore;
    private readonly IDistributedCacheStore _distributedStore = distributedStore;
    private readonly ILogger<CacheRoute> _logger = logger;
    #endregion

    #region Public
    /// <summary>
    /// 依指定模式讀取 Cache。
    /// </summary>
    public Task<CacheReadResult<T>> GetAsync<T>(string key, CacheOptions options, CancellationToken ct = default)
    {
        options.Validate(_distributedStore.IsEnabled);
        return options.Mode switch
        {
            CacheMode.LocalOnly => Task.FromResult(_localStore.Get<T>(key)),
            CacheMode.LocalFirst => GetLocalFirstAsync<T>(key, options, ct),
            CacheMode.DistributedOnly => GetDistributedOnlyAsync<T>(key, ct),
            CacheMode.DistributedFirst => GetDistributedFirstAsync<T>(key, options, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(options.Mode)),
        };
    }
    /// <summary>
    /// 依指定模式寫入 Cache。
    /// </summary>
    public Task SetAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct = default)
    {
        options.Validate(_distributedStore.IsEnabled);
        return options.Mode switch
        {
            CacheMode.LocalOnly => SetLocalAsync(key, value, options),
            CacheMode.LocalFirst => SetLocalFirstAsync(key, value, options, ct),
            CacheMode.DistributedOnly => SetDistributedOnlyAsync(key, value, options, ct),
            CacheMode.DistributedFirst => SetDistributedFirstAsync(key, value, options, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(options.Mode)),
        };
    }
    /// <summary>
    /// 依指定模式移除 Cache。
    /// </summary>
    public Task RemoveAsync(string key, CacheOptions options, CancellationToken ct = default)
    {
        options.Validate(_distributedStore.IsEnabled);
        return options.Mode switch
        {
            CacheMode.LocalOnly => RemoveLocalAsync(key),
            CacheMode.LocalFirst => RemoveLocalFirstAsync(key, ct),
            CacheMode.DistributedOnly => RemoveDistributedOnlyAsync(key, ct),
            CacheMode.DistributedFirst => RemoveDistributedFirstAsync(key, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(options.Mode)),
        };
    }
    /// <summary>
    /// 同步讀取 Process Runtime 使用的 Local Cache。
    /// </summary>
    public CacheReadResult<T> GetLocal<T>(string key, CacheOptions options)
    {
        ValidateLocalOptions(options);
        return _localStore.Get<T>(key);
    }
    /// <summary>
    /// 同步寫入 Process Runtime 使用的 Local Cache。
    /// </summary>
    public void SetLocal<T>(string key, T? value, CacheOptions options)
    {
        ValidateLocalOptions(options);
        _localStore.Set(key, value, options);
    }
    /// <summary>
    /// 同步移除 Process Runtime 使用的 Local Cache。
    /// </summary>
    public void RemoveLocal(string key, CacheOptions options)
    {
        ValidateLocalOptions(options);
        _localStore.Remove(key);
    }
    #endregion

    #region Private
    /// <summary>
    /// 先讀 Local，未命中時再讀 Distributed 並回填 Local。
    /// </summary>
    private async Task<CacheReadResult<T>> GetLocalFirstAsync<T>(string key, CacheOptions options, CancellationToken ct)
    {
        CacheReadResult<T> local = _localStore.Get<T>(key);
        if (local.IsHit || !_distributedStore.IsEnabled) return local;
        try
        {
            CacheReadResult<T> distributed = await _distributedStore.GetAsync<T>(key, ct);
            if (distributed.IsHit) _localStore.Set(key, distributed.Value, options);
            return distributed;
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFallback(ex, key, CacheMode.LocalFirst);
            return CacheReadResult<T>.Miss();
        }
    }
    /// <summary>
    /// Distributed 未啟用時使用 Local，啟用後只讀 Distributed。
    /// </summary>
    private async Task<CacheReadResult<T>> GetDistributedOnlyAsync<T>(string key, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled) return _localStore.Get<T>(key);
        try
        {
            return await _distributedStore.GetAsync<T>(key, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedRequiredFailure(ex, key);
            throw BuildRequiredDistributedAvailableException(ex);
        }
    }
    /// <summary>
    /// 先讀 Distributed，未命中或不可用時回讀 Local。
    /// </summary>
    private async Task<CacheReadResult<T>> GetDistributedFirstAsync<T>(string key, CacheOptions options, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled) return _localStore.Get<T>(key);
        try
        {
            CacheReadResult<T> distributed = await _distributedStore.GetAsync<T>(key, ct);
            if (!distributed.IsHit) return _localStore.Get<T>(key);
            _localStore.Set(key, distributed.Value, options);
            return distributed;
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFallback(ex, key, CacheMode.DistributedFirst);
            return _localStore.Get<T>(key);
        }
    }
    /// <summary>
    /// 先寫 Local，再嘗試同步寫入 Distributed。
    /// </summary>
    private async Task SetLocalFirstAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct)
    {
        _localStore.Set(key, value, options);
        if (!_distributedStore.IsEnabled) return;
        try
        {
            await _distributedStore.SetAsync(key, value, options, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFallback(ex, key, CacheMode.LocalFirst);
        }
    }
    /// <summary>
    /// Distributed 未啟用時使用 Local，啟用後只寫 Distributed。
    /// </summary>
    private async Task SetDistributedOnlyAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled)
        {
            _localStore.Set(key, value, options);
            return;
        }
        try
        {
            await _distributedStore.SetAsync(key, value, options, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedRequiredFailure(ex, key);
            throw BuildRequiredDistributedAvailableException(ex);
        }
    }
    /// <summary>
    /// 先寫 Distributed，無法使用時改寫 Local。
    /// </summary>
    private async Task SetDistributedFirstAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled)
        {
            _localStore.Set(key, value, options);
            return;
        }
        try
        {
            await _distributedStore.SetAsync(key, value, options, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFallback(ex, key, CacheMode.DistributedFirst);
            _localStore.Set(key, value, options);
            return;
        }
        _localStore.Set(key, value, options);
    }
    /// <summary>
    /// 先移除 Local，再嘗試移除 Distributed。
    /// </summary>
    private async Task RemoveLocalFirstAsync(string key, CancellationToken ct)
    {
        _localStore.Remove(key);
        if (!_distributedStore.IsEnabled) return;
        try
        {
            await _distributedStore.RemoveAsync(key, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFallback(ex, key, CacheMode.LocalFirst);
        }
    }
    /// <summary>
    /// Distributed 未啟用時移除 Local，啟用後只移除 Distributed。
    /// </summary>
    private async Task RemoveDistributedOnlyAsync(string key, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled)
        {
            _localStore.Remove(key);
            return;
        }
        try
        {
            await _distributedStore.RemoveAsync(key, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedRequiredFailure(ex, key);
            throw BuildRequiredDistributedAvailableException(ex);
        }
    }
    /// <summary>
    /// 先移除 Distributed，再移除 Local；Distributed 不可用時仍清除 Local。
    /// </summary>
    private async Task RemoveDistributedFirstAsync(string key, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled)
        {
            _localStore.Remove(key);
            return;
        }
        try
        {
            await _distributedStore.RemoveAsync(key, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFallback(ex, key, CacheMode.DistributedFirst);
        }
        _localStore.Remove(key);
    }
    /// <summary>
    /// 將 Local 寫入包裝成已完成工作。
    /// </summary>
    private Task SetLocalAsync<T>(string key, T? value, CacheOptions options)
    {
        _localStore.Set(key, value, options);
        return Task.CompletedTask;
    }
    /// <summary>
    /// 將 Local 移除包裝成已完成工作。
    /// </summary>
    private Task RemoveLocalAsync(string key)
    {
        _localStore.Remove(key);
        return Task.CompletedTask;
    }
    /// <summary>
    /// 驗證同步 Runtime Cache 只能使用 LocalOnly。
    /// </summary>
    private static void ValidateLocalOptions(CacheOptions options)
    {
        options.Validate(false);
        if (options.Mode != CacheMode.LocalOnly)
            throw new InvalidOperationException("同步 Runtime Cache 只能使用 LocalOnly。");
    }
    /// <summary>
    /// 排除取消操作，其他 Provider 例外交由 CacheMode 處理。
    /// </summary>
    private static bool CanHandleDistributedFailure(Exception ex) => ex is not OperationCanceledException;
    /// <summary>
    /// 建立 DistributedOnly 要求 Store 必須可用的標準例外。
    /// </summary>
    private static InvalidOperationException BuildRequiredDistributedAvailableException(Exception inner)
    {
        return new("Distributed Cache 已啟用，但目前無法使用。", inner);
    }
    /// <summary>
    /// 記錄可依目前模式降級至 Local 的 Distributed 失敗。
    /// </summary>
    private void LogDistributedFallback(Exception ex, string key, CacheMode mode)
    {
        _logger.LogWarning(ex, "Distributed Cache 操作失敗，已依 {CacheMode} 使用 Local。Key: {CacheKey}", mode, key);
    }
    /// <summary>
    /// 記錄 DistributedOnly 無法使用的必要服務錯誤。
    /// </summary>
    private void LogDistributedRequiredFailure(Exception ex, string key)
    {
        _logger.LogError(ex, "DistributedOnly 要求 Distributed Cache 必須可用。Key: {CacheKey}", key);
    }
    #endregion
}
