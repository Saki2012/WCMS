using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.IAM.RolePermission;

/// <summary>
/// 角色資料
/// </summary>
public class RoleDataModel : HeaderModel
{
    /// <summary>
    /// 角色權限代號
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.RolePermission_RoleId)]
    public string RoleId { get; set; } = string.Empty;
    /// <summary>
    /// 角色權限名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, DisplayName.RolePermission_RoleName)]
    public string RoleName { get; set; } = string.Empty;
    /// <summary>
    /// 是否為管理者
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.RolePermission_IsAdmin)]
    public bool IsAdmin { get; set; }

    #region 主子表關聯
    [InverseProperty(nameof(RolePermissionModel._RoleData))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<RolePermissionModel> _RolePermission { get; set; } = [];
    #endregion
}

/// <summary>
/// 角色權限資料
/// </summary>
[Index(nameof(RoleId), nameof(PermissionKey), IsUnique = true, Name = "UX_PermissionKey_NaturalKey")]
public class RolePermissionModel : DetailModel
{
    /// <summary>
    /// 角色權限代號
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.RolePermission_RoleId)]
    public string RoleId { get; set; } = string.Empty;
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ProgId, DisplayName.RolePermission_PermissionKey)]
    public string PermissionKey { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, DisplayName.RolePermission_GrantMask)]
    public FuncAction GrantMask { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(RoleId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public RoleDataModel _RoleData { get; set; } = null!;
    #endregion
}
