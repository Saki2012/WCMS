using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.FeatureDriver.Model.MetaData;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.PlatformServices.SystemMonitor;

/// <summary>
/// 前後端 / 主機資源快照
/// 注:
/// 1. 這張會同時記 Host Total 與當前 App 使用量
/// 2. Host 指標允許在不同 Instance 間重複，先以簡單可落地為主
/// </summary>
[Index(nameof(SiteCode), nameof(SnapshotTime))]
[Index(nameof(NodeRole), nameof(InstanceId), nameof(SnapshotTime))]
public class SystemMonitorSnapshotModel
{
    /// <summary>
    /// 快照流水號
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly)]
    public long SnapshotId { get; set; }
    /// <summary>
    /// 站台代碼
    /// </summary>
    [Required, StringLength(DbStrLen.ID)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string SiteCode { get; set; } = string.Empty;
    /// <summary>
    /// 環境代碼(Dev/Staging/Prod)
    /// </summary>
    [StringLength(DbStrLen.Info)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string EnvironmentCode { get; set; } = string.Empty;
    /// <summary>
    /// 機器名稱
    /// </summary>
    [Required, StringLength(DbStrLen.Name)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string MachineName { get; set; } = string.Empty;
    /// <summary>
    /// 節點實例代碼
    /// 例: wcms-1810-fe-01 / wcms-1810-be-01
    /// </summary>
    [Required, StringLength(DbStrLen.Title)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string InstanceId { get; set; } = string.Empty;
    /// <summary>
    /// 節點角色
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public SystemNodeRole NodeRole { get; set; }
    /// <summary>
    /// 快照時間
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public DateTime SnapshotTime { get; set; }
    /// <summary>
    /// 主機 CPU 使用率
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal HostCpuPercent { get; set; }
    /// <summary>
    /// 主機總記憶體(MB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public long HostRamTotalMB { get; set; }
    /// <summary>
    /// 主機已用記憶體(MB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public long HostRamUsedMB { get; set; }
    /// <summary>
    /// 主機剩餘記憶體(MB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public long HostRamFreeMB { get; set; }
    /// <summary>
    /// 主機記憶體使用率
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal HostRamUsedPercent { get; set; }
    /// <summary>
    /// 系統槽代號(通常為 C)
    /// </summary>
    [StringLength(DbStrLen.Info)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string SystemDriveName { get; set; } = string.Empty;
    /// <summary>
    /// 系統槽總容量(GB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal SystemDriveTotalGB { get; set; }
    /// <summary>
    /// 系統槽剩餘容量(GB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal SystemDriveFreeGB { get; set; }
    /// <summary>
    /// 系統槽使用率
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal SystemDriveUsedPercent { get; set; }
    /// <summary>
    /// 應用槽代號(通常為 F，可為空)
    /// </summary>
    [StringLength(DbStrLen.Info)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string AppDriveName { get; set; } = string.Empty;
    /// <summary>
    /// 應用槽總容量(GB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal AppDriveTotalGB { get; set; }
    /// <summary>
    /// 應用槽剩餘容量(GB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal AppDriveFreeGB { get; set; }
    /// <summary>
    /// 應用槽使用率
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal AppDriveUsedPercent { get; set; }
    /// <summary>
    /// 當前節點 CPU 使用率
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal AppCpuPercent { get; set; }
    /// <summary>
    /// 當前節點記憶體使用量(MB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public long AppRamUsedMB { get; set; }
    /// <summary>
    /// 當前節點 Working Set(MB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public long AppWorkingSetMB { get; set; }
    /// <summary>
    /// 執行緒數
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int AppThreadCount { get; set; }
    /// <summary>
    /// Handle 數
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int AppHandleCount { get; set; }
    /// <summary>
    /// 服務是否存活
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public bool AppIsAlive { get; set; }
    /// <summary>
    /// 服務啟動時間
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public DateTime AppStartTime { get; set; }
    /// <summary>
    /// 健康檢查回應時間(ms)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int HealthResponseMs { get; set; }
    /// <summary>
    /// 健康狀態
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public MonitorHealthStatus HealthStatus { get; set; }
    /// <summary>
    /// 健康摘要訊息
    /// </summary>
    [StringLength(DbStrLen.Memo)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string HealthMessage { get; set; } = string.Empty;
}

/// <summary>
/// 依賴服務快照
/// 注:
/// 1. 第一版先統一收 DB / Redis / 第三方
/// 2. 各依賴專屬欄位先做 nullable，避免一開始拆太多表
/// </summary>
[Index(nameof(SiteCode), nameof(SnapshotTime))]
[Index(nameof(DependencyType), nameof(TargetCode), nameof(SnapshotTime))]
public class DependencyMonitorSnapshotModel
{
    /// <summary>
    /// 快照流水號
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly)]
    public long SnapshotId { get; set; }
    /// <summary>
    /// 站台代碼
    /// </summary>
    [Required, StringLength(DbStrLen.ID)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string SiteCode { get; set; } = string.Empty;
    /// <summary>
    /// 環境代碼(Dev/Staging/Prod)
    /// </summary>
    [StringLength(DbStrLen.Info)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string EnvironmentCode { get; set; } = string.Empty;
    /// <summary>
    /// 收集來源機器名稱
    /// 注: 通常是 Backend 所在主機
    /// </summary>
    [Required, StringLength(DbStrLen.Name)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string MachineName { get; set; } = string.Empty;
    /// <summary>
    /// 收集來源實例代碼
    /// </summary>
    [Required, StringLength(DbStrLen.Title)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string CollectorInstanceId { get; set; } = string.Empty;
    /// <summary>
    /// 依賴類型
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public MonitorDependencyType DependencyType { get; set; }
    /// <summary>
    /// 監測目標代碼
    /// 例: MainDb / Redis01 / MailService
    /// </summary>
    [Required, StringLength(DbStrLen.ID)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string TargetCode { get; set; } = string.Empty;
    /// <summary>
    /// 顯示名稱
    /// </summary>
    [StringLength(DbStrLen.Title)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string TargetName { get; set; } = string.Empty;
    /// <summary>
    /// 目標主機或網址
    /// </summary>
    [StringLength(DbStrLen.Url)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string TargetHost { get; set; } = string.Empty;
    /// <summary>
    /// 目標連接埠
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int TargetPort { get; set; }
    /// <summary>
    /// 快照時間
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public DateTime SnapshotTime { get; set; }
    /// <summary>
    /// 是否成功
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public bool IsSuccess { get; set; }
    /// <summary>
    /// 回應時間(ms)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int ResponseMs { get; set; }
    /// <summary>
    /// 健康狀態
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public MonitorHealthStatus HealthStatus { get; set; }
    /// <summary>
    /// 錯誤或摘要訊息
    /// </summary>
    [StringLength(DbStrLen.Memo)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string Message { get; set; } = string.Empty;
    /// <summary>
    /// DB 資料檔大小(MB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal DbDataSizeMB { get; set; }
    /// <summary>
    /// DB Log 檔大小(MB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal DbLogSizeMB { get; set; }
    /// <summary>
    /// DB Log 使用率
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal DbLogUsedPercent { get; set; }
    /// <summary>
    /// Redis 已用記憶體(MB)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public decimal RedisUsedMemoryMB { get; set; }
    /// <summary>
    /// Redis 連線數
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int RedisConnectedClients { get; set; }
    /// <summary>
    /// 第三方 HTTP 狀態碼
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int ExternalStatusCode { get; set; }
}
