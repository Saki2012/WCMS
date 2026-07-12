using WCMS.SysCore.I18n.Metadata;

namespace WCMS.SysCore.PlatformServices.SystemMonitor;

/// <summary>
/// 前/後台
/// </summary>
[LibDesc]
public enum SystemNodeRole : byte
{
    /// <summary>
    /// 後台
    /// </summary>
    [LibDesc] Backend = 0,
    /// <summary>
    /// 前台
    /// </summary>
    [LibDesc] Frontend = 1
}


/// <summary>
/// 依賴類型
/// </summary>
public enum MonitorDependencyType : byte
{
    /// <summary>
    /// 資料庫
    /// </summary>
    Database = 1,
    /// <summary>
    /// Redis
    /// </summary>
    Redis = 2,
    /// <summary>
    /// 第三方服務
    /// </summary>
    ExternalApp = 3,
}

/// <summary>
/// 監控健康狀態
/// </summary>
public enum MonitorHealthStatus : byte
{
    /// <summary>
    /// 正常
    /// </summary>
    Normal = 0,

    /// <summary>
    /// 警告
    /// </summary>
    Warning = 1,

    /// <summary>
    /// 異常
    /// </summary>
    Critical = 2,
}
