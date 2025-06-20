using WCMS.SysCore.Library;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using System.Security.AccessControl;

namespace WCMS.SysCore.Model
{
    /// <summary>
    /// 操作日誌
    /// </summary>
    public class OperateLogModel
    {
        /// <summary>
        /// 序號
        /// </summary>
        [LibDesc, Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)] public long Id { get; set; }
        /// <summary>
        /// 使用者ID
        /// </summary>
        [LibDesc, Required] public string UserId { get; set; } = string.Empty;
        /// <summary>
        /// 登入IP位置
        /// </summary>
        [LibDesc, Required] public string IP { get; set; } = string.Empty;
        /// <summary>
        /// 瀏覽器資訊
        /// </summary>
        [LibDesc, Required] public string Browser { get; set; } = string.Empty;
        /// <summary>
        /// 功能Id
        /// </summary>
        [LibDesc, Required] public string ProgId { get; set; } = string.Empty;
        /// <summary>
        /// 資料主鍵
        /// </summary>
        [LibDesc, Required] public string PK { get; set; } = string.Empty;
        /// <summary>
        /// 操作時間
        /// </summary>
        [LibDesc, Required] public DateTime OperateTime { get; set; } = DateTime.Now;
        /// <summary>
        /// 動作
        /// </summary>
        [LibDesc, Required] public string Action { get; set; } = string.Empty;
        /// <summary>
        /// 備註
        /// (SysOperator處理時，該欄位不允許為空)
        /// </summary>
        [LibDesc, Required] public string Memo { get; set; } = string.Empty;
    }
    /// <summary>
    /// 資料變更日誌
    /// </summary>
    [LibDesc]
    public class DataChangeLogSet
    {
        /// <summary>
        /// 變更日誌
        /// </summary>
        [LibDesc] public DataChangeLog DataChangeLog { get; set; }
        /// <summary>
        /// 變更日誌明細
        /// </summary>
        [LibDesc] public List<DataChangeLogDetail> DataChangeLogDetail { get; set; }
    }
    /// <summary>
    /// 資料變更日誌
    /// </summary>
    [LibDesc]
    public class DataChangeLog
    {
        /// <summary>
        /// 序號
        /// </summary>
        [LibDesc, Key] public long DataChangeId { get; set; }
        /// <summary>
        /// 使用者ID
        /// </summary>
        [LibDesc] public string UserId { get; set; }
        /// <summary>
        /// ProgId
        /// </summary>
        [LibDesc] public string ProgId { get; set; }
        /// <summary>
        /// 表單內部標識號
        /// </summary>
        [LibDesc] public string InternalId { get; set; }
        /// <summary>
        /// 變更時間
        /// </summary>
        [LibDesc] public DateTime DataChangeTime { get; set; }
    }
    /// <summary>
    /// 資料變更日誌明細
    /// </summary>
    [LibDesc]
    public class DataChangeLogDetail
    {
        /// <summary>
        /// 變更日誌
        /// </summary>
        [ForeignKey(nameof(DataChangeId))] public DataChangeLog DataChangeLog { get; set; }
        /// <summary>
        /// 序號
        /// </summary>
        [LibDesc, Key] public long DataChangeId { get; set; }
        /// <summary>
        /// 行序號
        /// </summary>
        [LibDesc, Key] public long RowId { get; set; }
        /// <summary>
        /// 表單索引
        /// </summary>
        [LibDesc] public int TableIndex { get; set; }
        /// <summary>
        /// 變更前後資料
        /// </summary>
        [LibDesc] public byte[] ChangeData { get; set; }
        /// <summary>
        /// 行狀態
        /// </summary>
        [LibDesc] public RowState RowState { get; set; }
    }


}
