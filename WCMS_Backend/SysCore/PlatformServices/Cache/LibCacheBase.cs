using System.Globalization;

namespace WCMS.SysCore.PlatformServices.Cache;

/// <summary>
/// 提供模組 Cache 共用的 Key、讀取、來源取得、回填與移除流程。
/// </summary>
public abstract class LibCacheBase
{
    #region Property
    protected CacheService CacheService { get; }
    /// <summary>
    /// 取得目前模組使用的 Cache 區域名稱。
    /// </summary>
    protected abstract string CacheRegion { get; }
    #endregion

    #region Public
    /// <summary>
    /// 初始化模組 Cache 的共用服務。
    /// </summary>
    protected LibCacheBase(CacheService cacheService)
    {
        CacheService = cacheService;
    }
    #endregion

    #region Protected
    /// <summary>
    /// 建立包含模組區域與資料識別內容的 Cache Key。
    /// </summary>
    protected string BuildCacheKey(params object?[] parts)
    {
        if (string.IsNullOrWhiteSpace(CacheRegion))
            throw new InvalidOperationException("CacheRegion 不可為空白。");
        string suffix = string.Join(":", parts.Select(FormatKeyPart));
        return string.IsNullOrEmpty(suffix) ? CacheRegion : $"{CacheRegion}:{suffix}";
    }
    /// <summary>
    /// 取得一般 Cache，未命中時執行模組提供的實體資料來源。
    /// </summary>
    protected Task<T?> GetOrCreateAsync<T>(
        string key,
        CacheOptions options,
        Func<CancellationToken, Task<T?>> sourceFactory,
        CancellationToken ct = default)
    {
        return CacheService.GetOrCreateAsync(key, options, sourceFactory, ct);
    }
    /// <summary>
    /// 取得 Runtime Local Cache，未命中時執行模組提供的實體資料來源。
    /// </summary>
    protected T? GetOrCreateLocal<T>(string key, CacheOptions options, Func<T?> sourceFactory)
    {
        return CacheService.GetOrCreateLocal(key, options, sourceFactory);
    }
    /// <summary>
    /// 依指定設定移除模組 Cache。
    /// </summary>
    protected Task RemoveAsync(string key, CacheOptions options, CancellationToken ct = default)
    {
        return CacheService.RemoveAsync(key, options, ct);
    }
    /// <summary>
    /// 移除 Runtime Local 模組 Cache。
    /// </summary>
    protected void RemoveLocal(string key, CacheOptions options)
    {
        CacheService.RemoveLocal(key, options);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將 Cache Key 片段轉為固定文化格式。
    /// </summary>
    private static string FormatKeyPart(object? value)
    {
        if (value == null) return "~";
        if (value is IFormattable formattable)
            return formattable.ToString(null, CultureInfo.InvariantCulture) ?? "~";
        return value.ToString() ?? "~";
    }
    #endregion
}

/// <summary>
/// 提供單一 Key 與單一資料型別模組的抽象 Cache 流程。
/// </summary>
public abstract class LibCacheBase<TKey, TValue> : LibCacheBase
{
    #region Property
    /// <summary>
    /// 取得目前模組預設使用的 Cache 設定。
    /// </summary>
    protected abstract CacheOptions DefaultOptions { get; }
    #endregion

    #region Public
    /// <summary>
    /// 初始化單一資料型別模組的 Cache 共用服務。
    /// </summary>
    protected LibCacheBase(CacheService cacheService) : base(cacheService)
    {
    }
    /// <summary>
    /// 取得指定 Key 的資料，Cache 未命中時執行模組實體來源。
    /// </summary>
    public Task<TValue?> GetAsync(TKey key, CancellationToken ct = default)
    {
        string cacheKey = BuildEntityCacheKey(key);
        return GetOrCreateAsync(cacheKey, DefaultOptions, token => GetSourceAsync(key, token), ct);
    }
    /// <summary>
    /// 移除指定 Key 的模組 Cache。
    /// </summary>
    public Task RemoveAsync(TKey key, CancellationToken ct = default)
    {
        return RemoveAsync(BuildEntityCacheKey(key), DefaultOptions, ct);
    }
    #endregion

    #region Protected Virtual
    /// <summary>
    /// 建立指定資料 Key 的完整模組 Cache Key。
    /// </summary>
    protected virtual string BuildEntityCacheKey(TKey key)
    {
        return BuildCacheKey(key);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 取得 Cache 全部未命中時的模組實體資料。
    /// </summary>
    protected abstract Task<TValue?> GetSourceAsync(TKey key, CancellationToken ct);
    #endregion
}
