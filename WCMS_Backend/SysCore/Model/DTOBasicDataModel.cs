using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.Features.Member.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
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
        [LibDesc(ModelDisplayName.Common_CreateTime), DTOReadOnly] public DateTime? CreateTime { get; set; }
        /// <summary>
        /// 創建人ID
        /// </summary>
        [LibDesc(ModelDisplayName.Common_CreateUserId), DTOReadOnly] public string? CreateUserId { get; set; }
        [ForeignKey(nameof(CreateUserId))] public Account_DTO? CreateUser { get; set; }
        /// <summary>
        /// 修改時間
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ModifyTime), DTOReadOnly] public DateTime? ModifyTime { get; set; }
        /// <summary>
        /// 修改人ID
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ModifyUserId), DTOReadOnly] public string? ModifyUserId { get; set; }

        [ForeignKey(nameof(ModifyUserId))] public Account_DTO? ModifyUser { get; set; }
        /// <summary>
        /// 單據狀態
        /// </summary>
        [LibDesc, DTOReadOnly] public FormStatus FormStatus { get; set; }
        /// <summary>
        /// 資料狀態
        /// </summary>
        [LibDesc, DTOReadOnly] public DataStatus DataStatus { get; set; }
        /// <summary>
        /// 作廢時間
        /// </summary>
        [LibDesc, DTOReadOnly] public DateTime? InvalidTime { get; set; }
        /// <summary>
        /// 作廢人ID
        /// </summary>
        [LibDesc, DTOReadOnly] public string? InvalidUserId { get; set; }
        [ForeignKey(nameof(InvalidUserId)), JsonIgnore] public Account_DTO? InvalidUser { get; set; }
        /// <summary>
        /// 系統內部唯一標識號
        /// </summary>
        [LibDesc(ModelDisplayName.Common_InternalId)] public string? InternalId { get; set; }
        /// <summary>
        /// 主子
        /// </summary>
        [StringLength(SysLengthParam.ID)] public string? OrgLvId { get; set; } = string.Empty;
    }
}
