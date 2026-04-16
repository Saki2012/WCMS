using System.Security.Claims;
using WCMS.Features.IAM.Auth;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Model;

namespace WCMS.SysCore
{
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
                var interanlId = p.FindFirstValue(nameof(BasicDataModel.InternalId)) ?? "";
                if (!string.IsNullOrWhiteSpace(id)) return new User_DTO { UserId = id, 
                    UserName = string.IsNullOrWhiteSpace(name) ? id : name,
                    InternalId = interanlId,
                };
            }
            // 未登入（或匿名）：回退系統操作帳
            return SysParam.SysOperator;
        }

        public static string GetClientIp(this HttpContext ctx)
        {
            // 若已在 Program 設定 ForwardedHeaders，優先讀 X-Forwarded-For
            var fwd = ctx.Request.Headers["X-Forwarded-For"].ToString();
            if (!string.IsNullOrWhiteSpace(fwd)) return fwd.Split(',')[0].Trim();
            return ctx.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
        }

        public static string GetUserAgent(this HttpContext ctx)
        {
            return ctx.Request.Headers.UserAgent.ToString() ?? string.Empty;
        }
    }

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

    public sealed class HttpContextCurrentUserAccessor : ICurrentUserAccessor
    {
        private readonly IHttpContextAccessor _http;

        public HttpContextCurrentUserAccessor(IHttpContextAccessor http)
        {
            _http = http;
        }

        public ClaimsPrincipal? Principal => _http.HttpContext?.User;

        public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

        public User_DTO User => _http.HttpContext?.ToUserModelOrSys() ?? SysParam.SysOperator;

        public string? ClientIp => _http.HttpContext?.GetClientIp();

        public string? UserAgent => _http.HttpContext?.GetUserAgent();
    }
}
