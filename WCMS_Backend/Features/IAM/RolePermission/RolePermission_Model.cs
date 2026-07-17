using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.IAM.RolePermission;

/// <summary>
/// 角色資料
/// </summary>
public class RoleData : HeaderModel
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
    [InverseProperty(nameof(RolePermission._RoleData))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<RolePermission> _RolePermission { get; set; } = [];
    #endregion
}

/// <summary>
/// 角色權限資料
/// </summary>
[Index(nameof(RoleId), nameof(PermissionKey), IsUnique = true, Name = "UX_PermissionKey_NaturalKey")]
public class RolePermission : FormDetailModel
{
    /// <summary>
    /// 角色權限代號
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.RolePermission_RoleId)]
    public string RoleId { get; set; } = string.Empty;
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ProgId, DisplayName.RolePermission_PermissionKey)]
    public string PermissionKey { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, DisplayName.RolePermission_GrantMask)]
    public FuncAction GrantMask { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(RoleId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public RoleData _RoleData { get; set; } = null!;
    #endregion
}
