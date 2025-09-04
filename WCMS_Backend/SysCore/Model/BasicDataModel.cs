using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.SysCore.Library;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;
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
        [LibDesc] public DateTime? CreateTime { get; set; }
        /// <summary>
        /// 創建人ID
        /// </summary>
        [LibDesc] public string? CreateUserId { get; set; }
        [ForeignKey(nameof(CreateUserId))] public UserModel? CreateUser { get; set; }
        /// <summary>
        /// 修改時間
        /// </summary>
        [LibDesc] public DateTime? ModifyTime { get; set; }
        /// <summary>
        /// 修改人ID
        /// </summary>
        [LibDesc] public string? ModifyUserId { get; set; }
        [ForeignKey(nameof(ModifyUserId))] public UserModel? ModifyUser { get; set; }
        /// <summary>
        /// 單據狀態
        /// </summary>
        [LibDesc] public FormStatus FormStatus { get; set; }
        /// <summary>
        /// 資料狀態
        /// </summary>
        [LibDesc] public DataStatus DataStatus { get; set; }
        /// <summary>
        /// 作廢時間
        /// </summary>
        [LibDesc] public DateTime? InvalidTime { get; set; }
        /// <summary>
        /// 作廢人ID
        /// </summary>
        [LibDesc] public string? InvalidUserId { get; set; }
        [ForeignKey(nameof(InvalidUserId))] public UserModel? InvalidUser { get; set; }
        /// <summary>
        /// 系統內部唯一標識號
        /// </summary>
        [LibDesc] public string InternalId { get; set; } = string.Empty;
        /// <summary>
        /// 主子站層級ID
        /// </summary>
        [LibDesc] public string OrgLvId { get; set; } = string.Empty;
        /// <summary>
        /// // 是否為初始化資料
        /// </summary>
        [LibDesc] public bool IsIniData { get; set; } = false;
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
        [LibDesc, NotMapped] public RowState RowState { get; set; }
    }
}
