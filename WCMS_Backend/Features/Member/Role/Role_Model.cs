using System.ComponentModel.DataAnnotations;
using WCMS.Features.Member.Permission;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.Member.Role
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
        [LibDesc, Key, StringLength(SysLengthParam.ID)] public string RoleId { get; set; }
        /// <summary>
        /// 角色權限名稱
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.Name)] public string RoleName { get; set; }
        /// <summary>
        /// 前/後台
        /// </summary>
        [LibDesc] public EndType EndType { get; set; }
        /// <summary>
        /// 是否為管理者
        /// </summary>
        [LibDesc] public bool IsAdmin { get; set; }
    }

}
