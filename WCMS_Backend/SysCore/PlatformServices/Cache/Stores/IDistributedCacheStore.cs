namespace WCMS.SysCore.PlatformServices.Cache.Stores;

/// <summary>
/// 定義 Redis 或其他 Shared Cache Provider 的基本讀寫合約。
/// </summary>
public interface IDistributedCacheStore
{
    /// <summary>
    /// 取得 Distributed Cache 是否已啟用並完成 Provider 註冊。
    /// </summary>
    bool IsEnabled { get; }
    /// <summary>
    /// 讀取指定 Distributed Cache。
    /// </summary>
    Task<CacheReadResult<T>> GetAsync<T>(string key, CancellationToken ct = default);
    /// <summary>
    /// 寫入指定 Distributed Cache。
    /// </summary>
    Task SetAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct = default);
    /// <summary>
    /// 移除指定 Distributed Cache。
    /// </summary>
    Task RemoveAsync(string key, CancellationToken ct = default);
}
