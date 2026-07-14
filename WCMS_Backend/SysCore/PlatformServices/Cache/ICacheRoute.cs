namespace WCMS.SysCore.PlatformServices.Cache;

/// <summary>
/// 定義 WCMS 所有 Cache 共同使用的 Local 與 Distributed 模式路由合約。
/// </summary>
public interface ICacheRoute
{
    /// <summary>
    /// 依指定模式讀取 Cache。
    /// </summary>
    Task<CacheReadResult<T>> GetAsync<T>(string key, CacheOptions options, CancellationToken ct = default);
    /// <summary>
    /// 依指定模式寫入 Cache。
    /// </summary>
    Task SetAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct = default);
    /// <summary>
    /// 依指定模式移除 Cache。
    /// </summary>
    Task RemoveAsync(string key, CacheOptions options, CancellationToken ct = default);
    /// <summary>
    /// 同步讀取 Process Runtime 使用的 Local Cache。
    /// </summary>
    CacheReadResult<T> GetLocal<T>(string key, CacheOptions options);
    /// <summary>
    /// 同步寫入 Process Runtime 使用的 Local Cache。
    /// </summary>
    void SetLocal<T>(string key, T? value, CacheOptions options);
    /// <summary>
    /// 同步移除 Process Runtime 使用的 Local Cache。
    /// </summary>
    void RemoveLocal(string key, CacheOptions options);
}
