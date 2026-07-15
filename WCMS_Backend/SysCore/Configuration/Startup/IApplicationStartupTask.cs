namespace WCMS.SysCore.Configuration.Startup;

/// <summary>
/// 定義應用程式啟動後依序執行的初始化工作。
/// </summary>
public interface IApplicationStartupTask
{
    /// <summary>
    /// 取得初始化工作執行順序。
    /// </summary>
    int Order { get; }
    /// <summary>
    /// 執行單一啟動初始化工作。
    /// </summary>
    Task InitializeAsync(CancellationToken ct);
}

/// <summary>
/// 集中定義 WCMS 啟動初始化工作的執行順序。
/// </summary>
public static class ApplicationStartupOrder
{
    /// <summary>
    /// 資料庫環境與基礎物件初始化。
    /// </summary>
    public const int Persistence = 100;
    /// <summary>
    /// 身分與權限必要資料初始化。
    /// </summary>
    public const int IdentityAccess = 200;
    /// <summary>
    /// 網站必要資料初始化。
    /// </summary>
    public const int Web = 300;
    /// <summary>
    /// 共用業務資料初始化。
    /// </summary>
    public const int Common = 400;
    /// <summary>
    /// 啟動後 Cache 清理。
    /// </summary>
    public const int Cache = 500;
}
