using StackExchange.Redis;
using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.UserRolePermission.Role;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;

namespace WCMS.SysCore.SystemFunc.UserRolePermission.Permission
{
    public class PermissionSet
    {
        public PermissionModel Permission { get; set; } = new();
    }

    public class PermissionModel : MasterDataModel
    {
        [Key] public string UserId { get; set; } = default!;
        [Key] public string RoleId { get; set; } = default!;
        // Nav
        public UserModel User { get; set; } = default!;
        public RoleModel Role { get; set; } = default!;
    }
}
