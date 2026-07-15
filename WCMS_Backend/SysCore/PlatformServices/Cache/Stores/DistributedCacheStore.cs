using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;
using System.Text.Json;
using MvcJsonOptions = Microsoft.AspNetCore.Mvc.JsonOptions;
namespace WCMS.SysCore.PlatformServices.Cache.Stores;

/// <summary>
/// 使用 IDistributedCache 實作可序列化資料的 Distributed Cache Store。
/// </summary>
public sealed class DistributedCacheStore : IDistributedCacheStore
{
    #region Property
    private readonly IDistributedCache? _cache;
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly DistributedCacheSettings _settings;
    public bool IsEnabled => _settings.Enabled;
    #endregion

    #region Public
    /// <summary>
    /// 建立 Distributed Cache Store；停用期間允許尚未註冊 Provider。
    /// </summary>
    public DistributedCacheStore(
        IOptions<CacheSettings> settings,
        IOptions<MvcJsonOptions> jsonOptions,
        IServiceProvider services)
    {
        _settings = settings.Value.Distributed;
        _jsonOptions = new(jsonOptions.Value.JsonSerializerOptions);
        _cache = services.GetService<IDistributedCache>();
    }
    /// <summary>
    /// 讀取並反序列化指定 Distributed Cache。
    /// </summary>
    public async Task<CacheReadResult<T>> GetAsync<T>(string key, CancellationToken ct = default)
    {
        EnsureAvailable();
        byte[]? raw = await _cache!.GetAsync(key, ct);
        if (raw == null) return CacheReadResult<T>.Miss();
        CacheEnvelope<T>? envelope = Deserialize<T>(raw);
        if (envelope != null) return CacheReadResult<T>.Hit(envelope.Value);
        await _cache.RemoveAsync(key, ct);
        return CacheReadResult<T>.Miss();
    }
    /// <summary>
    /// 序列化並寫入指定 Distributed Cache。
    /// </summary>
    public async Task SetAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct = default)
    {
        EnsureAvailable();
        var envelope = new CacheEnvelope<T> { Value = value };
        byte[] raw = JsonSerializer.SerializeToUtf8Bytes(envelope, _jsonOptions);
        DistributedCacheEntryOptions entryOptions = BuildDistributedOptions(options);
        await _cache!.SetAsync(key, raw, entryOptions, ct);
    }
    /// <summary>
    /// 移除指定 Distributed Cache。
    /// </summary>
    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        EnsureAvailable();
        await _cache!.RemoveAsync(key, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 確認 Distributed Cache 已啟用且 Provider 可以使用。
    /// </summary>
    private void EnsureAvailable()
    {
        if (!IsEnabled)
            throw new InvalidOperationException("Distributed Cache 尚未啟用。");
        if (_cache == null)
            throw new InvalidOperationException("Distributed Cache Provider 尚未註冊。");
    }
    /// <summary>
    /// 將 WCMS Cache 時效設定轉成 IDistributedCache 設定。
    /// </summary>
    private static DistributedCacheEntryOptions BuildDistributedOptions(CacheOptions options)
    {
        var result = new DistributedCacheEntryOptions();
        if (options.ExpirationStrategy == CacheExpirationStrategy.Absolute)
            result.AbsoluteExpirationRelativeToNow = options.Expiration;
        if (options.ExpirationStrategy == CacheExpirationStrategy.Sliding)
            result.SlidingExpiration = options.Expiration;
        return result;
    }
    /// <summary>
    /// 嘗試將 Distributed Payload 反序列化。
    /// </summary>
    private CacheEnvelope<T>? Deserialize<T>(byte[] raw)
    {
        try
        {
            return JsonSerializer.Deserialize<CacheEnvelope<T>>(raw, _jsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }
    /// <summary>
    /// 保存 Distributed Cache 的資料內容。
    /// </summary>
    private sealed class CacheEnvelope<T>
    {
        public T? Value { get; set; }
    }
    #endregion
}
