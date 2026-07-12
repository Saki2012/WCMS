using System.Security.Claims;
using WCMS.Features.IAM.Auth;
using WCMS.SysCore.Enum;

namespace WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;


public sealed class HttpContextCurrentUserAccessor(IHttpContextAccessor http) : ICurrentUserAccessor
{
    private readonly IHttpContextAccessor _http = http;

    public ClaimsPrincipal? Principal => _http.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public User_DTO User => _http.HttpContext?.ToUserModelOrSys() ?? SystemUser.Operator;

    public string? ClientIp => _http.HttpContext?.GetClientIp();

    public string? UserAgent => _http.HttpContext?.GetUserAgent();
}
