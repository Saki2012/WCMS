namespace WCMS.SysCore.Configuration.Startup;

/// <summary>
/// 依固定順序執行所有已註冊的應用程式啟動初始化工作。
/// </summary>
internal static class ApplicationStartupInitializer
{
    #region Public
    /// <summary>
    /// 建立初始化 Scope 並依序執行所有啟動工作。
    /// </summary>
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken ct = default)
    {
        using IServiceScope scope = services.CreateScope();
        IEnumerable<IApplicationStartupTask> tasks = scope.ServiceProvider.GetServices<IApplicationStartupTask>().OrderBy(task => task.Order).ThenBy(task => task.GetType().FullName ?? string.Empty, StringComparer.Ordinal);
        foreach (IApplicationStartupTask task in tasks) await task.InitializeAsync(ct);
    }
    #endregion
}
