using System.ComponentModel;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;
using System.Security.AccessControl;
using Microsoft.EntityFrameworkCore;

namespace WCMS.SysCore.Model
{
    /// <summary>
    /// 在看怎麼寫才行
    /// </summary>
    public interface ISet
    {
        public BasicDataModel Header { get; set; }
        public BasicDataModel[]? Details { get; set; }
    }

    /// <summary>
    /// 基本資料欄位
    /// </summary>
    [Index(nameof(InternalId), IsUnique = true)]
    public class BasicDataModel
    {
        /// <summary>
        /// 創建時間
        /// </summary>
        [LibDesc]
        public DateTime? CreateTime { get; set; }
        /// <summary>
        /// 創建人ID
        /// </summary>
        [LibDesc]
        public string CreateUserId { get; set; } = string.Empty;
        /// <summary>
        /// 修改時間
        /// </summary>
        [LibDesc]
        public DateTime? ModifyTime { get; set; }
        /// <summary>
        /// 修改人ID
        /// </summary>
        [LibDesc]
        public string ModifyUserId { get; set; } = string.Empty;
        /// <summary>
        /// 單據狀態
        /// </summary>
        [LibDesc] public FormStatus FormStatus { get; set; }
        /// <summary>
        /// 資料狀態
        /// </summary>
        [LibDesc]
        public DataStatus DataStatus { get; set; }
        /// <summary>
        /// 作廢時間
        /// </summary>
        [LibDesc]
        public DateTime? InvalidTime { get; set; }
        /// <summary>
        /// 作廢人ID
        /// </summary>
        [LibDesc]
        public string InvalidUserId { get; set; } = string.Empty;
        /// <summary>
        /// 系統內部唯一標識號
        /// </summary>
        [LibDesc] public string InternalId { get; set; }
        /// <summary>
        /// 主子站層級ID
        /// </summary>
        [LibDesc] public string OrgLvId { get; set; } = string.Empty;
    }
    /// <summary>
    /// 主要資料
    /// </summary>
    public class MasterDataModel:BasicDataModel
    {

        /// <summary>
        /// 資料有效日期-起
        /// </summary>
        [LibDesc]
        public DateTime Validate_Start { get; set; }
        /// <summary>
        /// 資料有效日期-迄
        /// </summary>
        [LibDesc]
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
    public class DetailRowModel
    {
        [LibDesc, NotMapped] public RowState RowState { get; set; }
    }
}
