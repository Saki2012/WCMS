using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.IAM.RolePermission;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.IAM.Account;

public class ChangePassword
{
    public string OldPassword { get; set; }
    public string NewPassword { get; set; }
}

public class ResetPassword
{
    public string UserInternalId { get; set; }
    public string NewPassword { get; set; }
}
