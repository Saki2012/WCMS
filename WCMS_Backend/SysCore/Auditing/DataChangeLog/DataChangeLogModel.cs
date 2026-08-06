using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.SysCore.Auditing.DataChangeLog;

/// <summary>
/// 資料變更日誌
/// </summary>
[LibDesc(DisplayName.DataChangeLog)]
public class DataChangeLog
{
    /// <summary>
    /// 序號
    /// </summary>
    [Key]
    [LibNum(ApiFieldMode.ReadOnly)]
    public long DataChangeId { get; set; }
    /// <summary>
    /// 使用者ID
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public string UserId { get; set; } = string.Empty;
    /// <summary>
    /// ProgId
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public string ProgId { get; set; } = string.Empty;
    /// <summary>
    /// 表單內部標識號
    /// </summary>
    [LibField(ApiFieldMode.ReadOnly)]
    public string InternalId { get; set; } = string.Empty;
    /// <summary>
    /// 變更時間
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public DateTime DataChangeTime { get; set; }
}
/// <summary>
/// 資料變更日誌明細
/// </summary>
[LibDesc(DisplayName.DataChangeLogDetail)]
public class DataChangeLogDetail
{
    /// <summary>
    /// 變更日誌
    /// </summary>
    [ForeignKey(nameof(DataChangeId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public DataChangeLog DataChangeLog { get; set; }
    /// <summary>
    /// 序號
    /// </summary>
    [Key]
    [LibNum(ApiFieldMode.ReadOnly)]
    public long DataChangeId { get; set; }
    /// <summary>
    /// 行序號
    /// </summary>
    [Key]
    [LibNum(ApiFieldMode.ReadOnly)]
    public long RowId { get; set; }
    /// <summary>
    /// 表單索引
    /// </summary>
    [LibNum(ApiFieldMode.ReadWrite)]
    public int TableIndex { get; set; }
    /// <summary>
    /// 變更前後資料
    /// </summary>
    [LibField(ApiFieldMode.Ignore)]
    public byte[] ChangeData { get; set; } = [];
    /// <summary>
    /// 行狀態
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public RowState RowState { get; set; }
}
