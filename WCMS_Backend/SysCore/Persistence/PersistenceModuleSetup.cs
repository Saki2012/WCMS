using Microsoft.EntityFrameworkCore;
using WCMS.SysCore.Configuration.Startup;
using WCMS.SysCore.Constants;
using WCMS.SysCore.Persistence.Diagnostics;
using WCMS.SysCore.Persistence.Normalization;
using WCMS.SysCore.Persistence.Validation;
namespace WCMS.SysCore.Persistence;

/// <summary>
/// 集中註冊 WCMS 資料庫連線、DbContext 與啟動初始化服務。
/// </summary>
internal static class PersistenceModuleSetup
{
    #region Public
    /// <summary>
    /// 註冊 SQL Server、DbContext Pool 與 Persistence 啟動工作。
    /// </summary>
    public static void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        string connectionString = GetSqlConnectionString(configuration);
        services.AddSingleton<StringForeignKeySaveChangesInterceptor>();
        services.AddSingleton<LibFieldSaveChangesInterceptor>();
#if DEBUG
        services.AddSingleton<EfSqlConsoleInterceptor>();
#endif
        services.AddDbContextPool<ApplicationDbContext>((provider, options) => ConfigureDbContext(provider, options, connectionString));
        services.AddScoped<IApplicationStartupTask, PersistenceStartupInitializer>();
    }
    #endregion

    #region Private
    /// <summary>
    /// 取得必要的 SQL Server 連線字串。
    /// </summary>
    private static string GetSqlConnectionString(IConfiguration configuration)
    {
        string? connectionString = configuration.GetConnectionString(SysParam.Configuration.ConnectionStrings.SqlConnection);
        if (!string.IsNullOrWhiteSpace(connectionString)) return connectionString;
        throw new InvalidOperationException("Missing ConnectionStrings:SqlConnection. 請在 appsettings.* 或使用環境變數/Secrets 設定。");
    }

    /// <summary>
    /// 套用 SQL Server、字串外鍵正規化、LibField 最終驗證與開發環境的 EF Core 設定。
    /// </summary>
    private static void ConfigureDbContext(IServiceProvider provider, DbContextOptionsBuilder options, string connectionString)
    {
        options.UseSqlServer(connectionString);
        options.AddInterceptors(
            provider.GetRequiredService<StringForeignKeySaveChangesInterceptor>(),
            provider.GetRequiredService<LibFieldSaveChangesInterceptor>());
#if DEBUG
        options.AddInterceptors(provider.GetRequiredService<EfSqlConsoleInterceptor>());
        options.EnableDetailedErrors();
#endif
    }
    #endregion
}

/// <summary>
/// 初始化資料庫 SpecCode 與 WCMS 基礎 UDF。
/// </summary>
internal sealed class PersistenceStartupInitializer(ApplicationDbContext db, IConfiguration configuration, IWebHostEnvironment environment) : IApplicationStartupTask
{
    #region Property
    /// <summary>
    /// 取得 Persistence 初始化順序。
    /// </summary>
    public int Order => ApplicationStartupOrder.Persistence;
    #endregion

    #region Public
    /// <summary>
    /// 驗證資料庫環境並視設定註冊 UDF。
    /// </summary>
    public async Task InitializeAsync(CancellationToken ct)
    {
        await PersistenceInitializer.EnsureDbSpecCodeAsync(db, ct);
        bool enabled = configuration.GetValue(SysParam.Configuration.DbInit.EnabledPath, true);
        if (!enabled) return;
        await PersistenceInitializer.RegisterUdfAsync(configuration, environment, db, ct);
    }
    #endregion
}
