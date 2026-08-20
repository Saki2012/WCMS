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

/// <summary>
/// Development 環境使用的登入 Session 診斷資訊，不包含 Token 原文或安全金鑰。
/// </summary>
public sealed class AuthSessionDiagnostics_DTO
{
    #region Property
    /// <summary>
    /// 後端產生診斷資料的 UTC 時間。
    /// </summary>
    public DateTime ServerTimeUtc { get; set; }
    /// <summary>
    /// Access Token 到期 UTC 時間。
    /// </summary>
    public DateTime? AccessExpiresAtUtc { get; set; }
    /// <summary>
    /// Access Token 目前剩餘秒數。
    /// </summary>
    public int? AccessRemainingSeconds { get; set; }
    /// <summary>
    /// Access Token 設定有效分鐘數。
    /// </summary>
    public int AccessTokenMinutes { get; set; }
    /// <summary>
    /// Refresh Token 設定有效天數。
    /// </summary>
    public int RefreshTokenDays { get; set; }
    /// <summary>
    /// Request 是否帶有 Access Token Cookie。
    /// </summary>
    public bool AccessCookiePresent { get; set; }
    /// <summary>
    /// Request 是否帶有 Refresh Token Id Cookie。
    /// </summary>
    public bool RefreshCookiePresent { get; set; }
    /// <summary>
    /// 目前 Refresh Token Id 是否仍存在於 Token State Cache。
    /// </summary>
    public bool RefreshCacheHit { get; set; }
    /// <summary>
    /// Refresh Token Cache 擁有者是否與目前登入者一致。
    /// </summary>
    public bool RefreshOwnerMatchesCurrentUser { get; set; }
    /// <summary>
    /// Request 是否帶有 XSRF Cookie。
    /// </summary>
    public bool XsrfCookiePresent { get; set; }
    /// <summary>
    /// 目前 Access Token JTI 是否已列入撤銷清單。
    /// </summary>
    public bool AccessBlacklisted { get; set; }
    /// <summary>
    /// Access Token JTI 的不可逆短指紋，用於比對 Token 是否已輪替。
    /// </summary>
    public string AccessJtiFingerprint { get; set; } = string.Empty;
    /// <summary>
    /// Refresh Token Id 的不可逆短指紋，用於比對 Refresh Rotation。
    /// </summary>
    public string RefreshFingerprint { get; set; } = string.Empty;
    /// <summary>
    /// ASP.NET Core 目前認證類型。
    /// </summary>
    public string AuthenticationType { get; set; } = string.Empty;
    /// <summary>
    /// 後端執行環境名稱。
    /// </summary>
    public string EnvironmentName { get; set; } = string.Empty;
    #endregion
}
