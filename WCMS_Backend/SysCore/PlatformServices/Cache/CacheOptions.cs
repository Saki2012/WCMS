namespace WCMS.SysCore.PlatformServices.Cache;

/// <summary>
/// 定義 Cache 的 Local 與 Distributed 路由模式。
/// </summary>
public enum CacheMode : byte
{
    LocalOnly = 0,
    LocalFirst = 1,
    DistributedOnly = 2,
    DistributedFirst = 3,
}

/// <summary>
/// 定義 Cache 資料的失效方式。
/// </summary>
public enum CacheExpirationStrategy : byte
{
    ProcessLifetime = 0,
    Absolute = 1,
    Sliding = 2,
}

/// <summary>
/// 定義單次 Cache 的路由模式與資料時效設定。
/// </summary>
public sealed class CacheOptions
{
    #region Property
    /// <summary>
    /// 取得或設定 Cache 的 Local 與 Distributed 路由模式。
    /// </summary>
    public CacheMode Mode { get; init; } = CacheMode.LocalOnly;
    /// <summary>
    /// 取得或設定 Cache 資料的失效方式。
    /// </summary>
    public CacheExpirationStrategy ExpirationStrategy { get; init; } = CacheExpirationStrategy.ProcessLifetime;
    /// <summary>
    /// 取得或設定 Absolute 或 Sliding 模式的有效時間。
    /// </summary>
    public TimeSpan? Expiration { get; init; }
    /// <summary>
    /// 取得或設定是否保存 null，避免不存在的資料被重複取得。
    /// </summary>
    public bool CacheNullValue { get; init; }
    #endregion

    #region Public
    /// <summary>
    /// 驗證 Cache 模式與時效設定是否可以共同使用。
    /// </summary>
    internal void Validate(bool distributedEnabled)
    {
        ValidateExpiration();
        if (!distributedEnabled) return;
        if (ExpirationStrategy == CacheExpirationStrategy.ProcessLifetime && Mode != CacheMode.LocalOnly)
            throw new InvalidOperationException("Distributed Cache 啟用時，ProcessLifetime 只能搭配 LocalOnly。");
    }
    #endregion

    #region Private
    /// <summary>
    /// 驗證 Cache 時效模式與有效時間設定。
    /// </summary>
    private void ValidateExpiration()
    {
        if (ExpirationStrategy == CacheExpirationStrategy.ProcessLifetime && Expiration != null)
            throw new InvalidOperationException("ProcessLifetime 不可設定 Expiration。");
        if (ExpirationStrategy == CacheExpirationStrategy.ProcessLifetime) return;
        if (Expiration == null || Expiration <= TimeSpan.Zero)
            throw new InvalidOperationException("Absolute 或 Sliding Cache 必須設定大於零的 Expiration。");
    }
    #endregion
}

/// <summary>
/// 定義 WCMS Cache 的全域設定。
/// </summary>
public sealed class CacheSettings
{
    #region Property
    /// <summary>
    /// appsettings 中的 Cache 設定區段名稱。
    /// </summary>
    public const string SectionName = "Cache";
    /// <summary>
    /// 取得或設定 Distributed Cache 的啟用與連線設定。
    /// </summary>
    public DistributedCacheSettings Distributed { get; set; } = new();
    /// <summary>
    /// 取得或設定一般資料 Cache 的 Key 前綴。
    /// </summary>
    public string DataKeyPrefix { get; set; } = "wcms:data:";
    /// <summary>
    /// 取得或設定 OutputCache 的 Key 前綴。
    /// </summary>
    public string OutputKeyPrefix { get; set; } = "wcms:output:";
    #endregion
}

/// <summary>
/// 定義 Distributed Cache 的啟用與 Redis 連線設定。
/// </summary>
public sealed class DistributedCacheSettings
{
    #region Property
    /// <summary>
    /// 取得或設定 Distributed Cache 是否正式啟用。
    /// </summary>
    public bool Enabled { get; set; }
    /// <summary>
    /// 取得或設定 Redis 連線字串。
    /// </summary>
    public string RedisConnection { get; set; } = string.Empty;
    #endregion
}

/// <summary>
/// 封裝 Cache 是否命中及其資料內容。
/// </summary>
public readonly record struct CacheReadResult<T>(bool IsHit, T? Value)
{
    #region Public
    /// <summary>
    /// 建立 Cache 命中結果。
    /// </summary>
    public static CacheReadResult<T> Hit(T? value) => new(true, value);
    /// <summary>
    /// 建立 Cache 未命中結果。
    /// </summary>
    public static CacheReadResult<T> Miss() => new(false, default);
    #endregion
}
