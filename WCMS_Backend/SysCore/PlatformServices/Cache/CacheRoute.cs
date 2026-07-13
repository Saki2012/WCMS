using WCMS.SysCore.PlatformServices.Cache.Stores;

namespace WCMS.SysCore.PlatformServices.Cache;

/// <summary>
/// 統一處理 WCMS Cache 的 Local、Distributed、失敗降級與時效路由。
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
    /// 依指定策略讀取 Cache。
    /// </summary>
    public Task<CacheReadResult<T>> GetAsync<T>(string key, CacheOptions options, CancellationToken ct = default)
    {
        options.Validate(_distributedStore.IsEnabled);
        return options.Strategy switch
        {
            CacheStrategy.LocalOnly => Task.FromResult(_localStore.Get<T>(key)),
            CacheStrategy.DistributedOnly => GetDistributedOnlyAsync<T>(key, options, ct),
            CacheStrategy.LocalFirst => GetLocalFirstAsync<T>(key, options, ct),
            CacheStrategy.DistributedFirst => GetDistributedFirstAsync<T>(key, options, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(options.Strategy)),
        };
    }
    /// <summary>
    /// 依指定策略寫入 Cache。
    /// </summary>
    public Task SetAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct = default)
    {
        options.Validate(_distributedStore.IsEnabled);
        return options.Strategy switch
        {
            CacheStrategy.LocalOnly => SetLocalAsync(key, value, options),
            CacheStrategy.DistributedOnly => SetDistributedOnlyAsync(key, value, options, ct),
            CacheStrategy.LocalFirst => SetHybridAsync(key, value, options, ct),
            CacheStrategy.DistributedFirst => SetHybridAsync(key, value, options, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(options.Strategy)),
        };
    }
    /// <summary>
    /// 依指定策略移除 Cache。
    /// </summary>
    public Task RemoveAsync(string key, CacheOptions options, CancellationToken ct = default)
    {
        options.Validate(_distributedStore.IsEnabled);
        return options.Strategy switch
        {
            CacheStrategy.LocalOnly => RemoveLocalAsync(key),
            CacheStrategy.DistributedOnly => RemoveDistributedOnlyAsync(key, options, ct),
            CacheStrategy.LocalFirst => RemoveHybridAsync(key, options, ct),
            CacheStrategy.DistributedFirst => RemoveHybridAsync(key, options, ct),
            _ => throw new ArgumentOutOfRangeException(nameof(options.Strategy)),
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
    /// 只讀 Distributed，無法使用時依失敗策略處理。
    /// </summary>
    private async Task<CacheReadResult<T>> GetDistributedOnlyAsync<T>(string key, CacheOptions options, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled) return HandleReadFailure<T>(key, options);
        try
        {
            return await _distributedStore.GetAsync<T>(key, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFailure(ex, key);
            return HandleReadFailure<T>(key, options);
        }
    }
    /// <summary>
    /// 先讀 Local，未命中時讀 Distributed 並回填 Local。
    /// </summary>
    private async Task<CacheReadResult<T>> GetLocalFirstAsync<T>(string key, CacheOptions options, CancellationToken ct)
    {
        CacheReadResult<T> local = _localStore.Get<T>(key);
        if (local.IsHit) return local;
        CacheReadResult<T> distributed = await TryReadDistributedAfterLocalMissAsync<T>(key, options, ct);
        if (distributed.IsHit) _localStore.Set(key, distributed.Value, options);
        return distributed;
    }
    /// <summary>
    /// 先讀 Distributed，未命中時回讀 Local。
    /// </summary>
    private async Task<CacheReadResult<T>> GetDistributedFirstAsync<T>(string key, CacheOptions options, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled) return HandleReadFailure<T>(key, options);
        try
        {
            CacheReadResult<T> distributed = await _distributedStore.GetAsync<T>(key, ct);
            if (!distributed.IsHit) return _localStore.Get<T>(key);
            _localStore.Set(key, distributed.Value, options);
            return distributed;
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFailure(ex, key);
            return HandleReadFailure<T>(key, options);
        }
    }
    /// <summary>
    /// 在 Local 未命中後嘗試讀取 Distributed。
    /// </summary>
    private async Task<CacheReadResult<T>> TryReadDistributedAfterLocalMissAsync<T>(string key, CacheOptions options, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled) return HandleUnavailableAfterLocalMiss<T>(options);
        try
        {
            return await _distributedStore.GetAsync<T>(key, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFailure(ex, key);
            return HandleUnavailableAfterLocalMiss<T>(options);
        }
    }
    /// <summary>
    /// 只寫 Distributed，無法使用時依失敗策略處理。
    /// </summary>
    private async Task SetDistributedOnlyAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled)
        {
            HandleSetFailure(key, value, options);
            return;
        }
        try
        {
            await _distributedStore.SetAsync(key, value, options, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFailure(ex, key);
            HandleSetFailure(key, value, options);
        }
    }
    /// <summary>
    /// Hybrid 模式同步寫入 Distributed 與 Local。
    /// </summary>
    private async Task SetHybridAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled)
        {
            HandleSetFailure(key, value, options);
            return;
        }
        try
        {
            await _distributedStore.SetAsync(key, value, options, ct);
            _localStore.Set(key, value, options);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFailure(ex, key);
            HandleSetFailure(key, value, options);
        }
    }
    /// <summary>
    /// 只移除 Distributed，無法使用時依失敗策略處理。
    /// </summary>
    private async Task RemoveDistributedOnlyAsync(string key, CacheOptions options, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled)
        {
            HandleRemoveFailure(key, options, false);
            return;
        }
        try
        {
            await _distributedStore.RemoveAsync(key, ct);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFailure(ex, key);
            HandleRemoveFailure(key, options, false);
        }
    }
    /// <summary>
    /// Hybrid 模式同步移除 Distributed 與 Local。
    /// </summary>
    private async Task RemoveHybridAsync(string key, CacheOptions options, CancellationToken ct)
    {
        if (!_distributedStore.IsEnabled)
        {
            HandleRemoveFailure(key, options, true);
            return;
        }
        try
        {
            await _distributedStore.RemoveAsync(key, ct);
            _localStore.Remove(key);
        }
        catch (Exception ex) when (CanHandleDistributedFailure(ex))
        {
            LogDistributedFailure(ex, key);
            HandleRemoveFailure(key, options, true);
        }
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
    /// 處理 Distributed 讀取無法使用時的行為。
    /// </summary>
    private CacheReadResult<T> HandleReadFailure<T>(string key, CacheOptions options)
    {
        return options.FailureStrategy switch
        {
            CacheFailureStrategy.FallbackToLocal => _localStore.Get<T>(key),
            CacheFailureStrategy.BypassCache => CacheReadResult<T>.Miss(),
            CacheFailureStrategy.RequireDistributed => throw BuildDistributedUnavailableException(),
            _ => throw new ArgumentOutOfRangeException(nameof(options.FailureStrategy)),
        };
    }
    /// <summary>
    /// 處理 Local 已未命中且 Distributed 無法使用時的行為。
    /// </summary>
    private static CacheReadResult<T> HandleUnavailableAfterLocalMiss<T>(CacheOptions options)
    {
        if (options.FailureStrategy == CacheFailureStrategy.RequireDistributed)
            throw BuildDistributedUnavailableException();
        return CacheReadResult<T>.Miss();
    }
    /// <summary>
    /// 處理 Distributed 寫入無法使用時的行為。
    /// </summary>
    private void HandleSetFailure<T>(string key, T? value, CacheOptions options)
    {
        switch (options.FailureStrategy)
        {
            case CacheFailureStrategy.FallbackToLocal:
                _localStore.Set(key, value, options);
                return;
            case CacheFailureStrategy.BypassCache:
                return;
            case CacheFailureStrategy.RequireDistributed:
                throw BuildDistributedUnavailableException();
            default:
                throw new ArgumentOutOfRangeException(nameof(options.FailureStrategy));
        }
    }
    /// <summary>
    /// 處理 Distributed 移除無法使用時的行為。
    /// </summary>
    private void HandleRemoveFailure(string key, CacheOptions options, bool removeLocal)
    {
        if (options.FailureStrategy == CacheFailureStrategy.RequireDistributed)
            throw BuildDistributedUnavailableException();
        if (removeLocal || options.FailureStrategy == CacheFailureStrategy.FallbackToLocal)
            _localStore.Remove(key);
    }
    /// <summary>
    /// 驗證同步 Runtime Cache 只能使用 LocalOnly。
    /// </summary>
    private static void ValidateLocalOptions(CacheOptions options)
    {
        options.Validate(false);
        if (options.Strategy != CacheStrategy.LocalOnly)
            throw new InvalidOperationException("同步 Runtime Cache 只能使用 LocalOnly。");
    }
    /// <summary>
    /// 排除取消操作，其他 Provider 例外交由 FailureStrategy 處理。
    /// </summary>
    private static bool CanHandleDistributedFailure(Exception ex) => ex is not OperationCanceledException;
    /// <summary>
    /// 建立 Distributed Cache 無法使用的標準例外。
    /// </summary>
    private static InvalidOperationException BuildDistributedUnavailableException()
    {
        return new("Distributed Cache 未啟用或目前無法使用。");
    }
    /// <summary>
    /// 記錄 Distributed Cache 讀寫失敗。
    /// </summary>
    private void LogDistributedFailure(Exception ex, string key)
    {
        _logger.LogWarning(ex, "Distributed Cache 操作失敗。Key: {CacheKey}", key);
    }
    #endregion
}
