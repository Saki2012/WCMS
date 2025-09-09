using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.UserRolePermission.Permission;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.UserRolePermission.User
{
    [LibDesc] public class UserSet:ITSet
    {
        public UserModel User { get; set; } = new();
        public List<UserInfo> UserInfo { get; set; } = [];
    }
    [LibDesc] public class UserModel : MasterDataModel
    {
        /// <summary>
        /// 使用者編號
        /// </summary>
        [LibDesc, Key, StringLength(SysLengthParam.ID)] public string UserId { get; set; }

        /// <summary>
        /// 部門代號
        /// </summary>
        //[LibDesc] public string DeptId { get; set; }

        public string UserImageId { get; set; }

        /// <summary>
        /// 
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.Email)] public string? Email { get; set; }
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
    public class UserInfo:DetailRowModel
    {
        /// <summary>
        /// 使用者編號
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string UserId { get; set; }
        [Key]public int RowId { get; set; }
        [StringLength(SysLengthParam.Lang)]public string Lang { get; set; }
        /// <summary>
        /// 使用者名稱
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string UserName { get; set; }
    }
}
