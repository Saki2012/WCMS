using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using System.Security.AccessControl;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.Model
{
    public class UserModel : MasterDataModel
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
        /// 角色
        /// </summary>
        [LibDesc] public string RoleId { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc] public string Email { get; set; }
        /// <summary>
        /// 帳戶狀態
        /// </summary>
        [LibDesc] public AccountStatus AccountStatus { get; set; }
    }
}
