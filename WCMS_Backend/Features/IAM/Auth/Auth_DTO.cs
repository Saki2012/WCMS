using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.IAM.Auth;

public sealed class LoginDto
{
    [Required]
    [StringLength(20, MinimumLength = 3, ErrorMessage = "account 長度需介於 3~20。")]
    [RegularExpression(@"^[A-Za-z0-9._\-@]+$", ErrorMessage = "account 僅允許英數、. _ - @。")]
    public string Account { get; set; } = "";
    [Required]
    [StringLength(64, MinimumLength = 3, ErrorMessage = "password 長度需介於 3~64。")]
    public string Password { get; set; } = "";
}

public sealed class User_DTO
{
    /// <summary>
    /// 使用者編號
    /// </summary>
    [LibDesc(DisplayName.User_UserID)] public string UserId { get; set; }
    /// <summary>
    /// 使用者名稱
    /// </summary>
    [LibDesc(DisplayName.User_UserName)] public string UserName { get; set; }
    /// <summary>
    /// 
    /// </summary>
    [LibDesc(DisplayName.Common_InternalId)]public string InternalId { get; set; } = string.Empty;
    /// <summary>
    /// 帳戶狀態
    /// </summary>
    [LibDesc(DisplayName.Enum_AccountStatus)] public AccountStatus AccountStatus { get; set; }
}
