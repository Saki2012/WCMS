using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.Member.RolePermission
{
    public class RolePermissionSet:ITSet
    {
        public RoleDataModel RoleData { get; set; } = new();
        public List<RolePermissionModel> RolePermission { get; set; } = [];
    }
    /// <summary>
    /// 角色資料
    /// </summary>
    public class RoleDataModel : MasterDataModel
    {
        /// <summary>
        /// 角色權限代號
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string RoleId { get; set; }
        /// <summary>
        /// 角色權限名稱
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string RoleName { get; set; }
        /// <summary>
        /// 是否為管理者
        /// </summary>
        public bool IsAdmin { get; set; }

        #region 主子表關聯
        [InverseProperty(nameof(RolePermissionModel._RoleData))] public List<RolePermissionModel> _RolePermission { get; set; }
        #endregion
    }

    /// <summary>
    /// 角色權限資料
    /// </summary>
    [Index(nameof(RoleId), nameof(PermissionKey), IsUnique = true, Name = "UX_PermissionKey_NaturalKey")]
    public class RolePermissionModel : DetailRowModel
    {
        /// <summary>
        /// 角色權限代號
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string RoleId { get; set; }
        [Key] public int? RowId { get; set; }
        [StringLength(SysLengthParam.ProgId)]public string PermissionKey { get; set; }
        public FuncAction GrantMask { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(RoleId))] public RoleDataModel _RoleData { get; set; } = null!;
        #endregion
    }
}
