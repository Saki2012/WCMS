using Microsoft.OpenApi.Any;
using StackExchange.Redis;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Security.AccessControl;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.UserRolePermission.Permission;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.UserRolePermission.Role
{

    [LibDesc] public class RoleSet
    {
        public RoleModel Role { get; set; } = new();
    }

    /// <summary>
    /// 角色權限資料
    /// </summary>
    [LibDesc] public class RoleModel : MasterDataModel
    {
        /// <summary>
        /// 角色權限代號
        /// </summary>
        [LibDesc, Key] public string RoleId { get; set; }
        /// <summary>
        /// 角色權限名稱
        /// </summary>
        [LibDesc] public string RoleName { get; set; }
        /// <summary>
        /// 前/後台
        /// </summary>
        [LibDesc] public EndType EndType { get; set; }
        /// <summary>
        /// 是否為管理者
        /// </summary>
        [LibDesc] public bool IsAdmin { get; set; }
        // Nav
        public ICollection<PermissionModel> UserRoles { get; set; } = [];
    }

}
