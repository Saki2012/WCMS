using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.Model
{
    public interface ITSet_DTO { }


    /// <summary>
    /// DTO基本資料欄位
    /// </summary>
    public class DTOBasicDataModel
    {
        /// <summary>
        /// 創建時間
        /// </summary>
        [LibDesc, DTOReadOnly]
        public DateTime? CreateTime { get; set; }
        /// <summary>
        /// 創建人ID
        /// </summary>
        [LibDesc, DTOReadOnly] public string CreateUserId { get; set; }
        /// <summary>
        /// 修改時間
        /// </summary>
        [LibDesc, DTOReadOnly]
        public DateTime? ModifyTime { get; set; }
        /// <summary>
        /// 修改人ID
        /// </summary>
        [LibDesc, DTOReadOnly]
        public string ModifyUserId { get; set; }
        /// <summary>
        /// 單據狀態
        /// </summary>
        [LibDesc, DTOReadOnly] public FormStatus FormStatus { get; set; }
        /// <summary>
        /// 資料狀態
        /// </summary>
        [LibDesc, DTOReadOnly]
        public DataStatus DataStatus { get; set; }
        /// <summary>
        /// 作廢時間
        /// </summary>
        [LibDesc, DTOReadOnly]
        public DateTime? InvalidTime { get; set; }
        /// <summary>
        /// 作廢人ID
        /// </summary>
        [LibDesc, DTOReadOnly]
        public string InvalidUserId { get; set; }
        /// <summary>
        /// 系統內部唯一標識號
        /// </summary>
        [LibDesc, DTOReadOnly] public string InternalId { get; set; }
    }
}
