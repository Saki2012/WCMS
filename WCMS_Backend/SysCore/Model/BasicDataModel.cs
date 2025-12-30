using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.Features.Member.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.Model
{
    public interface ITSet { }
    /// <summary>
    /// 基本資料欄位
    /// </summary>
    [Index(nameof(InternalId), IsUnique = true)]
    public class BasicDataModel
    {
        /// <summary>
        /// 創建時間
        /// </summary>
        public DateTime? CreateTime { get; set; }
        /// <summary>
        /// 創建人ID
        /// </summary>
        [ForeignKey(nameof(CreateUserId))] public AccountModel? CreateUser { get; set; }
        [StringLength(SysLengthParam.ID)] public string? CreateUserId { get; set; }
        /// <summary>
        /// 修改時間
        /// </summary>
        public DateTime? ModifyTime { get; set; }
        /// <summary>
        /// 修改人ID
        /// </summary>
        [ForeignKey(nameof(ModifyUserId))] public AccountModel? ModifyUser { get; set; }
        [LibDesc, StringLength(SysLengthParam.ID)] public string? ModifyUserId { get; set; }
        /// <summary>
        /// 單據狀態
        /// </summary>
        public FormStatus FormStatus { get; set; }
        /// <summary>
        /// 資料狀態
        /// </summary>
        public DataStatus DataStatus { get; set; }
        /// <summary>
        /// 作廢時間
        /// </summary>
        public DateTime? InvalidTime { get; set; }
        /// <summary>
        /// 作廢人ID
        /// </summary>
        [ForeignKey(nameof(InvalidUserId))] public AccountModel? InvalidUser { get; set; }
        [LibDesc, StringLength(SysLengthParam.ID)] public string? InvalidUserId { get; set; }
        /// <summary>
        /// 系統內部唯一標識號
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.InternalId),] public string InternalId { get; set; } = string.Empty;
        /// <summary>
        /// 主子站層級ID
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.ID)] public string OrgLvId { get; set; } = string.Empty;
        /// <summary>
        /// // 是否為初始化資料
        /// </summary>
        public bool IsIniData { get; set; } = false;
        /// <summary>
        /// 資料版本-併發控制
        /// </summary>
        [LibDesc, Timestamp, JsonIgnore] public byte[]? DataVersion { get; set; } = default!;
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
        public DateTime? Validate_Start { get; set; }
        /// <summary>
        /// 資料有效日期-迄
        /// </summary>
        [LibDesc]
        public DateTime? Validate_End { get; set; }
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
        [NotMapped] public RowState RowState { get; set; }
    }
}
