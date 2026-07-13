namespace WCMS.SysCore.PlatformServices.Cache.Stores;

/// <summary>
/// 定義程序內 Local Cache 的同步讀寫合約。
/// </summary>
public interface ILocalCacheStore
{
    /// <summary>
    /// 讀取指定 Local Cache。
    /// </summary>
    CacheReadResult<T> Get<T>(string key);
    /// <summary>
    /// 寫入指定 Local Cache。
    /// </summary>
    void Set<T>(string key, T? value, CacheOptions options);
    /// <summary>
    /// 移除指定 Local Cache。
    /// </summary>
    void Remove(string key);
}
