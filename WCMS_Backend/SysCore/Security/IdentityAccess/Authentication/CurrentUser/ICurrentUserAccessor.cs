using System.Security.Claims;
namespace WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;

public interface ICurrentUserAccessor
{
    /// <summary>目前登入者；若未登入，回傳系統帳（SysOperator）。</summary>
    User_DTO User { get; }
    /// <summary>原始 ClaimsPrincipal（必要時可用）。</summary>
    ClaimsPrincipal? Principal { get; }
    bool IsAuthenticated { get; }
    /// <summary>Client IP（給操作日誌用）。</summary>
    string? ClientIp { get; }
    /// <summary>User-Agent（給操作日誌用）。</summary>
    string? UserAgent { get; }
}
