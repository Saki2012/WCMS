using Microsoft.AspNetCore.Antiforgery;
using WCMS.SysCore.Constants;
namespace WCMS.SysCore.Security.Hardening;

/// <summary>
/// 管理 Browser 寫入型請求的來源與 Antiforgery Token 驗證，並保留 SSR／本機 Swagger 例外。
/// XSRF Token 僅由 SystemAPI/GetXsrfToken 專用 Endpoint 發出。
/// </summary>
internal static class XsrfProtectionSetup
{
    #region Property
    private const string XsrfTokenPath = "/Service/SystemAPI/GetXsrfToken";
    #endregion

    #region Public
    /// <summary>
    /// 將 Origin／Referer 與 Antiforgery Token 驗證加入 Middleware Pipeline。
    /// </summary>
    public static void Use(WebApplication app, IConfiguration configuration)
    {
        var frontendHosts = SecurityHostHelper.GetAllowedHosts(configuration, SysParam.Configuration.Whitelist.FrontendPath);
        app.Use((context, next) => HandleRequestAsync(app, context, next, frontendHosts));
    }
    #endregion

    #region Private
    /// <summary>
    /// 統一驗證 Browser 的 POST／PUT／PATCH／DELETE Request。
    /// </summary>
    private static async Task HandleRequestAsync(WebApplication app, HttpContext context, Func<Task> next, HashSet<string> frontendHosts)
    {
        if (!IsWriteRequest(context.Request.Method) || ShouldSkipProtection(context))
        {
            await next();
            return;
        }
        if (IsBlockedWriteOrigin(app, context, frontendHosts))
        {
            await RejectInvalidOriginAsync(context);
            return;
        }
        if (!await ValidateAntiforgeryAsync(context)) return;
        await next();
    }

    /// <summary>
    /// 判斷是否為 XSRF Token Endpoint、本機 Swagger 或可信任 SSR Server-to-Server Request。
    /// </summary>
    private static bool ShouldSkipProtection(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.Equals(XsrfTokenPath, StringComparison.OrdinalIgnoreCase)) return true;
        if (IsFromLocalSwagger(context)) return true;
        return IsTrustedServerRequest(context);
    }

    /// <summary>
    /// 判斷 Loopback 且未帶 Browser Origin／Referer 的 Request 是否屬於 SSR Server-to-Server 呼叫。
    /// </summary>
    private static bool IsTrustedServerRequest(HttpContext context)
    {
        if (!SecurityHostHelper.IsLoopback(context)) return false;
        var origin = context.Request.Headers.Origin.ToString();
        var referer = context.Request.Headers.Referer.ToString();
        return string.IsNullOrWhiteSpace(origin) && string.IsNullOrWhiteSpace(referer);
    }

    /// <summary>
    /// 判斷正式環境的寫入來源是否應被阻擋。
    /// </summary>
    private static bool IsBlockedWriteOrigin(WebApplication app, HttpContext context, HashSet<string> frontendHosts)
    {
        if (!app.Environment.IsProduction()) return false;
        return !IsValidWriteOrigin(context, frontendHosts);
    }

    /// <summary>
    /// 檢查 Browser 寫入來源是否允許。
    /// </summary>
    private static bool IsValidWriteOrigin(HttpContext context, HashSet<string> frontendHosts)
    {
        var origin = context.Request.Headers.Origin.ToString();
        var referer = context.Request.Headers.Referer.ToString();
        var sourceUri = SecurityHostHelper.TryParseUri(origin) ?? SecurityHostHelper.TryParseUri(referer);
        var sourceHost = sourceUri?.Host;
        var effectiveHost = SecurityHostHelper.GetEffectiveHost(context);
        return sourceHost is not null && frontendHosts.Contains(sourceHost)
            || sourceHost is not null && string.Equals(sourceHost, effectiveHost, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 使用 ASP.NET Core Antiforgery 驗證 Cookie 與 X-XSRF-TOKEN Header。
    /// </summary>
    private static async Task<bool> ValidateAntiforgeryAsync(HttpContext context)
    {
        var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
        try
        {
            await antiforgery.ValidateRequestAsync(context);
            return true;
        }
        catch (AntiforgeryValidationException)
        {
            await RejectInvalidXsrfAsync(context);
            return false;
        }
    }

    /// <summary>
    /// 回傳不合法來源的標準禁止回應。
    /// </summary>
    private static async Task RejectInvalidOriginAsync(HttpContext context)
    {
        SecurityRejectionDiagnostics.Record(context, SecurityRejectionStage.Origin);
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { success = false, message = "Invalid Origin/Referer." });
    }

    /// <summary>
    /// 回傳 Antiforgery Token 驗證失敗的標準禁止回應。
    /// </summary>
    private static async Task RejectInvalidXsrfAsync(HttpContext context)
    {
        SecurityRejectionDiagnostics.Record(context, SecurityRejectionStage.Antiforgery);
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { success = false, message = "Invalid XSRF token." });
    }

    /// <summary>
    /// 判斷寫入型請求是否來自本機 Swagger UI。
    /// </summary>
    private static bool IsFromLocalSwagger(HttpContext context)
    {
        if (!SecurityHostHelper.IsLoopback(context)) return false;
        var referer = SecurityHostHelper.TryParseUri(context.Request.Headers.Referer.ToString());
        return referer?.IsLoopback == true && referer.AbsolutePath.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 判斷是否為需要 Browser XSRF 防護的 HTTP Method。
    /// </summary>
    private static bool IsWriteRequest(string method)
    {
        return HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsDelete(method) || HttpMethods.IsPatch(method);
    }
    #endregion
}
