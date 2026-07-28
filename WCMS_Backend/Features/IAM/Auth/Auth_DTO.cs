using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.IAM.Auth;

public sealed class LoginDto
{
    [Required]
    [StringLength(20, MinimumLength = 3, ErrorMessage = "account 長度需介於 3~20。")]
    [RegularExpression(@"^[A-Za-z0-9._\-@]+$", ErrorMessage = "account 僅允許英數、. _ - @。")]
    public string Account { get; set; } = string.Empty;
    [Required]
    [StringLength(64, MinimumLength = 3, ErrorMessage = "password 長度需介於 3~64。")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// 前端登入狀態需要的使用者與完整有效權限。
/// </summary>
public sealed class CurrentUserContext_DTO
{
    #region Property
    /// <summary>
    /// 目前登入使用者。
    /// </summary>
    public User_DTO User { get; set; } = new();
    /// <summary>
    /// 是否為系統管理者。
    /// </summary>
    public bool IsAdmin { get; set; }
    /// <summary>
    /// 各功能有效權限遮罩。
    /// </summary>
    public Dictionary<string, FuncAction> Permissions { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    #endregion
}
