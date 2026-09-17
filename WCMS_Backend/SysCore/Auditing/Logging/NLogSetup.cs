using NLog;
using NLog.Config;
using NLog.Targets;
using LogLevel = NLog.LogLevel;
namespace WCMS.SysCore.Auditing.Logging;

/// <summary>
/// 集中管理 WCMS 技術異常的 NLog 設定與 Logger。
/// </summary>
internal static class NLogSetup
{
    #region Property
    private const int RetentionDays = 90;
    private const string BaseLogPath = "${basedir}/logs";
    private const string HostCategory = "WCMS.Host";
    private const string HttpCategory = "WCMS.Http";
    private const string SecurityCategory = "WCMS.Security";
    private const string LogSeparator = "============================================================";
    private const string ExceptionLayout =
        "${longdate} | ${level:uppercase=true} | ${logger} | ${message}" +
        "${newline}${exception:format=tostring}" +
        "${newline}" + LogSeparator;
    #endregion

    #region Public
    /// <summary>
    /// 初始化 Host 與 HTTP 技術異常的 NLog 設定。
    /// </summary>
    public static void Initialize()
    {
        LoggingConfiguration configuration = new();
        FileTarget hostTarget = BuildFileTarget("hostFile", "host");
        FileTarget httpTarget = BuildFileTarget("httpFile", "http");
        configuration.AddRule(LogLevel.Error, LogLevel.Fatal, hostTarget, HostCategory);
        configuration.AddRule(LogLevel.Error, LogLevel.Fatal, httpTarget, HttpCategory);
        // 2026-09-17: 安全拒絕使用獨立 Warning 分流，不混入技術異常。
        FileTarget securityTarget = BuildFileTarget("securityFile", "security");
        configuration.AddRule(LogLevel.Warn, LogLevel.Fatal, securityTarget, SecurityCategory);
        LogManager.Configuration = configuration;
    }
    /// <summary>
    /// 取得 Application Host 專用 Logger。
    /// </summary>
    public static Logger GetHostLogger()
    {
        return LogManager.GetLogger(HostCategory);
    }
    /// <summary>
    /// 取得 HTTP Request Pipeline 專用 Logger。
    /// </summary>
    public static Logger GetHttpLogger()
    {
        return LogManager.GetLogger(HttpCategory);
    }
    /// <summary>
    /// 取得安全拒絕診斷專用 Logger。
    /// </summary>
    public static Logger GetSecurityLogger()
    {
        return LogManager.GetLogger(SecurityCategory);
    }
    /// <summary>
    /// 完成剩餘 Log 寫入並關閉 NLog。
    /// </summary>
    public static void Shutdown()
    {
        LogManager.Shutdown();
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立依日期分檔並保存九十天的 Exception File Target。
    /// </summary>
    private static FileTarget BuildFileTarget(string targetName, string categoryName)
    {
        string fileName = $"{BaseLogPath}/{categoryName}/{categoryName}-${{date:format=yyyy-MM-dd}}.log";
        return new FileTarget(targetName) { FileName = fileName, Layout = ExceptionLayout, MaxArchiveDays = RetentionDays, AutoFlush = true, };
    }
    #endregion
}
