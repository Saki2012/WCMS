using System.Globalization;
namespace WCMS.SysCore.PlatformServices.Cache;

/// <summary>
/// 提供模組 Cache 共用的 Key、讀取、來源取得、回填與移除流程。
/// </summary>
public abstract class LibCacheBase
{
    #region Property
    /// <summary>
    /// 模組 Cache 共用服務。
    /// </summary>
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
    /// 依指定設定寫入模組 Cache。
    /// </summary>
    protected Task SetAsync<T>(string key, T? value, CacheOptions options, CancellationToken ct = default)
    {
        return CacheService.SetAsync(key, value, options, ct);
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
