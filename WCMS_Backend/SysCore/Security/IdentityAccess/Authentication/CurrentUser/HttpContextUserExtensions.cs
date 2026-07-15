using System.Security.Claims;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.Constants;
namespace WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;

/* 用在Biz抓當前User使用 */
public static class HttpContextUserExtensions
{
    public static User_DTO ToUserModelOrSys(this HttpContext ctx)
    {
        var p = ctx?.User;
        if (p?.Identity?.IsAuthenticated == true)
        {
            var id = p.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var name = p.FindFirst(ClaimTypes.Name)?.Value;
            var interanlId = p.FindFirstValue(nameof(HeaderModel.InternalId)) ?? "";
            if (!string.IsNullOrWhiteSpace(id)) return new User_DTO
            {
                UserId = id,
                UserName = string.IsNullOrWhiteSpace(name) ? id : name,
                InternalId = interanlId,
            };
        }
        // 未登入（或匿名）：回退系統操作帳
        return SystemUser.Operator;
    }

    public static string GetClientIp(this HttpContext ctx)
    {
        // 若已在 Program 設定 ForwardedHeaders，優先讀 X-Forwarded-For
        var fwd = ctx.Request.Headers[SysParam.HttpHeaders.ForwardedFor].ToString();
        if (!string.IsNullOrWhiteSpace(fwd)) return fwd.Split(',')[0].Trim();
        return ctx.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
    }

    public static string GetUserAgent(this HttpContext ctx)
    {
        return ctx.Request.Headers.UserAgent.ToString() ?? string.Empty;
    }
}

