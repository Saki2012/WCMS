using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.IAM.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model.Validation;
namespace WCMS.SysCore.Observability.OperateLog;


//資料傳輸用的物件
public class OperateLogModel
{
    [Key] public int Id { get; set; }
    [StringLength(DbStrLen.Name)] public string APIName { get; set; } = string.Empty;
    [ForeignKey(nameof(UserId))] public AccountModel? User { get; set; }
    [StringLength(DbStrLen.ID)] public string? UserId { get; set; }
    public string followingDT { get; set; } = string.Empty;
    [StringLength(DbStrLen.Memo)] public string Browser { get; set; } = string.Empty;
    [StringLength(DbStrLen.IP)] public string IP { get; set; } = string.Empty;
    public DateTime ExcuteTime { get; set; } = DateTime.UtcNow;
    public ExcStatus ExcStatus { get; set; }


    #region 待確認
    /// <summary>
    /// 跨 DB、CSV 與其他輸出媒介使用的操作事件識別碼。
    /// </summary>
    [StringLength(DbStrLen.InternalId)]
    public string? EventId { get; set; }
    /// <summary>
    /// 操作所屬的 WCMS 功能識別碼。
    /// </summary>
    [StringLength(DbStrLen.ProgId)]
    public string? ProgId { get; set; }
    /// <summary>
    /// 實際執行的操作名稱，例如 Create、PublishJournal。
    /// </summary>
    [StringLength(DbStrLen.Name)]
    public string? OperationName { get; set; }
    /// <summary>
    /// 對應 WCMS 標準功能動作；特殊操作可為空。
    /// </summary>
    public SysEnum.FuncAction? ActionType { get; set; }
    /// <summary>
    /// 此次操作所影響的主要資料 InternalId。
    /// </summary>
    [StringLength(DbStrLen.InternalId)]
    public string? TargetInternalId { get; set; }
    /// <summary>
    /// 串聯 API、錯誤日誌與操作日誌的追蹤識別碼。
    /// </summary>
    [StringLength(DbStrLen.Name_Eng)]
    public string? TraceId { get; set; }
    /// <summary>
    /// 此次 HTTP Request 使用的方法。
    /// </summary>
    [StringLength(DbStrLen.Info)]
    public string? HttpMethod { get; set; }
    /// <summary>
    /// 此次 HTTP Request 的路徑。
    /// </summary>
    [StringLength(DbStrLen.Url)]
    public string? RequestPath { get; set; }
    /// <summary>
    /// API 最終回傳的 HTTP 狀態碼。
    /// </summary>
    public int? HttpStatusCode { get; set; }
    /// <summary>
    /// 操作執行耗時，單位為毫秒。
    /// </summary>
    public long? DurationMs { get; set; }
    /// <summary>
    /// 操作執行完成的 UTC 時間。
    /// </summary>
    public DateTime? CompletedAtUtc { get; set; }
    /// <summary>
    /// 執行此次操作的 WCMS 後端版本。
    /// </summary>
    [StringLength(DbStrLen.Info)]
    public string? BackendVersion { get; set; }
    /// <summary>
    /// 操作日誌資料結構版本，供 DB、CSV 或其他輸出解析。
    /// </summary>
    public short LogSchemaVersion { get; set; } = 1;
    #endregion

}
