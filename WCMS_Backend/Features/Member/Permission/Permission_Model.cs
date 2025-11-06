using System.ComponentModel.DataAnnotations;
using WCMS.Features.Member.Account;
using WCMS.Features.Member.Role;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Model;

namespace WCMS.Features.Member.Permission
{
    public class PermissionSet
    {
        public PermissionModel Permission { get; set; } = new();
    }

    public class PermissionModel : MasterDataModel
    {
        [Key, StringLength(SysLengthParam.ID)] public string UserId { get; set; } = default!;
        [Key, StringLength(SysLengthParam.ID)] public string RoleId { get; set; } = default!;
    }
}
