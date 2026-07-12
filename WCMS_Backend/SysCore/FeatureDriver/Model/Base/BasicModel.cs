using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.IAM.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.SysCore.FeatureDriver.Model.Base;

/// <summary>
/// 最基礎 DB 模型，不預設任何系統欄位。
/// </summary>
public abstract class DbModel { }

/// <summary>
/// 具備建立與修改紀錄的資料模型。
/// </summary>
[Index(nameof(InternalId), IsUnique = true)]
public abstract class HeaderModel : DbModel
{
    /// <summary>
    /// 系統內部唯一標識號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.InternalId, DisplayName.Common_InternalId)]
    public virtual string InternalId { get; set; } = string.Empty;
    /// <summary>
    /// 創建時間
    /// </summary>
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_CreateTime)]
    public DateTime? CreateTime { get; set; }
    /// <summary>
    /// 創建人ID
    /// </summary>
    [ForeignKey(nameof(CreateUserId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public AccountModel? CreateUser { get; set; }
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.Common_CreateUserId, DisplayName.CreateUserName)]
    public string? CreateUserId { get; set; }
    /// <summary>
    /// 修改時間
    /// </summary>
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ModifyTime)]
    public DateTime? ModifyTime { get; set; }
    /// <summary>
    /// 修改人ID
    /// </summary>
    [ForeignKey(nameof(ModifyUserId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public AccountModel? ModifyUser { get; set; }
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.Common_ModifyUserId, DisplayName.ModifyUserName)]
    public string? ModifyUserId { get; set; }
    /// <summary>
    /// 單據狀態。
    /// </summary>
    [LibField(ApiFieldMode.ReadOnly, DisplayName.FormStatus)]
    public FormStatus FormStatus { get; set; }
    /// <summary>
    /// 資料狀態。
    /// </summary>
    [LibField(ApiFieldMode.ReadOnly, DisplayName.DataStatus)]
    public DataStatus DataStatus { get; set; }
    /// <summary>
    /// 作廢時間。
    /// </summary>
    [LibField(ApiFieldMode.ReadOnly, DisplayName.InvalidTime)]
    public DateTime? InvalidTime { get; set; }
    /// <summary>
    /// 作廢人員。
    /// </summary>
    [ForeignKey(nameof(InvalidUserId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public AccountModel? InvalidUser { get; set; }
    /// <summary>
    /// 作廢人員 ID。
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.InvalidUserId)]
    public string? InvalidUserId { get; set; }
    /// <summary>
    /// 資料版本-併發控制
    /// </summary>
    [Timestamp]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.DataVersion)]
    public byte[] DataVersion { get; set; } = default!;
    /// <summary>
    /// // 是否為初始化資料
    /// </summary>
    [LibField(ApiFieldMode.ReadOnly)]
    public bool IsIniData { get; set; } = false;
}

/// <summary>
/// 具備建立與修改紀錄的資料模型。
/// </summary>
public abstract class DetailModel : DbModel
{
    [NotMapped]
    [LibField(ApiFieldMode.ReadWrite, DisplayName.RowState)]
    public RowState RowState { get; set; }
    [LibField(ApiFieldMode.ReadWrite, DisplayName.RowNo)]
    public int RowNo { get; set; }
}
