using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.UserRolePermission.Permission;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.UserRolePermission.User
{
    [LibDesc] public class UserSet
    {
        public UserModel User { get; set; } = new();
    }
    [LibDesc] public class UserModel : MasterDataModel
    {
        /// <summary>
        /// 使用者編號
        /// </summary>
        [LibDesc, Key] public string UserId { get; set; }
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
        /// <summary>
        /// 雜湊密碼
        /// </summary>
        public byte[] PasswordHash { get; set; } = default!;  // PBKDF2/Argon2 之後會寫
        /// <summary>
        /// 密碼加鹽
        /// </summary>
        public byte[] PasswordSalt { get; set; } = default!;
        /// <summary>
        /// 密碼演算法版本
        /// </summary>
        public int PasswordAlgoVer { get; set; } = 1;
        /// <summary>
        /// 帳戶狀態
        /// </summary>
        [LibDesc] public AccountStatus AccountStatus { get; set; }

        public ICollection<PermissionModel> UserRoles { get; set; } = [];
    }
}
