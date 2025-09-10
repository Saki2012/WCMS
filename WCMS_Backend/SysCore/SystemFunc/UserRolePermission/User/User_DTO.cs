using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.UserRolePermission.Permission;

namespace WCMS.SysCore.SystemFunc.UserRolePermission.User
{

    [LibDesc]public class UserSet_DTO : ITSet_DTO
    {
        public UserModel User { get; set; } = new();
    }
    [LibDesc]public class UserModel_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 使用者編號
        /// </summary>
        [LibDesc] public string UserId { get; set; }
        /// <summary>
        /// 使用者名稱
        /// </summary>
        [LibDesc] public string UserName { get; set; }
        /// <summary>
        /// 部門代號
        /// </summary>
        //[LibDesc] public string DeptId { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc] public string? Email { get; set; }
        public ICollection<PermissionModel> UserRoles { get; set; } = [];
    }
}
