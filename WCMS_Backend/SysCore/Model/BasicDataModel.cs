using System.ComponentModel;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;
using System.Security.AccessControl;

namespace WCMS.SysCore.Model
{
    /// <summary>
    /// 基本資料欄位
    /// </summary>
    public class BasicDataModel
    {
        /// <summary>
        /// 創建時間
        /// </summary>
        [LibDesc(nameof(CreateTime))]
        public DateTime CreateTime { get; set; }
        /// <summary>
        /// 修改時間
        /// </summary>
        [LibDesc("修改時間")]
        public DateTime ModifyTime { get; set; }
        /// <summary>
        /// 創建人ID
        /// </summary>
        [LibDesc("創建人ID")]
        public string CreateUserId { get; set; } = string.Empty;
        /// <summary>
        /// 修改人ID
        /// </summary>
        [LibDesc("修改人ID")]
        public string ModifyUserId { get; set; } = string.Empty;
        /// <summary>
        /// 系統內部唯一標識號
        /// </summary>
        [LibDesc("系統內部唯一標識號")] public string InternalId { get; set; }
    }
    /// <summary>
    /// 主要資料
    /// </summary>
    public class MasterDataModel:BasicDataModel
    {
        /// <summary>
        /// 資料狀態
        /// </summary>
        [LibDesc("資料狀態")]
        public DataStatus DataStatus { get; set; }
        /// <summary>
        /// 資料有效日期-起
        /// </summary>
        [LibDesc("有效日期-起")]
        public DateTime Validate_Start { get; set; }
        /// <summary>
        /// 資料有效日期-迄
        /// </summary>
        [LibDesc("有效日期-迄")]
        public DateTime Validate_End { get; set; }
    }
    /// <summary>
    /// 流水帳資料
    /// </summary>
    public class BillDataModel : BasicDataModel
    {
    }

    /// <summary>
    /// 明細行狀態
    /// </summary>
    public class DetailRowState
    {
        [LibDesc, NotMapped] public RowState RowState { get; set; }
    }
}
