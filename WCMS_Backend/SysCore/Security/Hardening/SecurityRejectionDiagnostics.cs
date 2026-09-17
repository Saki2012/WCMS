using System.Text.Json;
using Microsoft.AspNetCore.Routing;
using WCMS.SysCore.Auditing.Logging;
using WCMS.SysCore.Constants;
namespace WCMS.SysCore.Security.Hardening;

internal enum SecurityRejectionStage { Host, Origin, Antiforgery }

/// <summary>
/// 2026-09-17：記錄安全拒絕階段；不輸出 Cookie、Token、原始 URL 或例外內容。
/// </summary>
internal static class SecurityRejectionDiagnostics
{
    private const string TraceHeader = "X-WCMS-Trace-Id";
    private static readonly object TraceKey = new();

    /// <summary>
    /// 產生伺服器診斷識別碼，輸出至回應標頭與既有 NLog 安全分流。
    /// </summary>
    public static void Record(HttpContext context, SecurityRejectionStage stage)
    {
        if (context.Items[TraceKey] is not string traceId)
        {
            traceId = Guid.NewGuid().ToString("N");
            context.Items[TraceKey] = traceId;
        }
        if (!context.Response.HasStarted) context.Response.Headers[TraceHeader] = traceId;

        bool hasHeader = !string.IsNullOrWhiteSpace(context.Request.Headers[SysParam.HttpHeaders.XsrfToken]);
        bool hasCookie = context.Request.Cookies.ContainsKey(SysParam.CookieNames.AntiforgeryToken)
            || context.Request.Cookies.ContainsKey(SysParam.CookieNames.AntiforgeryTokenDevelopment);
        string reason = stage switch
        {
            SecurityRejectionStage.Host => "HostNotAllowed",
            SecurityRejectionStage.Origin => "OriginOrRefererNotAllowed",
            _ when !hasHeader && !context.Request.HasFormContentType => "AntiforgeryHeaderMissing",
            _ when !hasCookie => "AntiforgeryCookieMissing",
            _ => "AntiforgeryValidationFailed",
        };
        // RoutePattern 是伺服器定義的樣板；不記錄 Path/Query、路由實值或外來 Host。
        string? route = (context.GetEndpoint() as RouteEndpoint)?.RoutePattern.RawText;
        string method = context.Request.Method switch
        {
            "GET" or "POST" or "PUT" or "PATCH" or "DELETE" or "HEAD" or "OPTIONS" => context.Request.Method,
            _ => "OTHER",
        };
        var entry = new
        {
            Event = "SecurityRequestRejected", Version = "2026.09.17.1",
            TimestampUtc = DateTimeOffset.UtcNow, TraceId = traceId,
            Stage = stage.ToString(), Reason = reason, StatusCode = 403, Method = method, Route = route,
            HasXsrfHeader = hasHeader, HasAntiforgeryCookie = hasCookie,
            HasOrigin = !string.IsNullOrWhiteSpace(context.Request.Headers.Origin),
            HasReferer = !string.IsNullOrWhiteSpace(context.Request.Headers.Referer),
            IsLoopback = SecurityHostHelper.IsLoopback(context), IsHttps = context.Request.IsHttps,
            IsAuthenticated = context.User.Identity?.IsAuthenticated == true,
        };
        NLogSetup.GetSecurityLogger().Warn(JsonSerializer.Serialize(entry));
    }
}
