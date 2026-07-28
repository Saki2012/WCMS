using WCMS.SysCore.Constants;
namespace WCMS.SysCore.Security.Hardening;

/// <summary>
/// 管理寫入型請求來源驗證與本機 Swagger 例外規則。
/// XSRF Token 僅由 SystemAPI/GetXsrfToken 專用 Endpoint 發出。
/// </summary>
internal static class XsrfProtectionSetup
{
    #region Property
    private const string XsrfTokenPath = "/Service/SystemAPI/GetXsrfToken";
    #endregion

    #region Public
    /// <summary>
    /// 將 Origin / Referer 驗證加入 Middleware Pipeline。
    /// </summary>
    public static void Use(WebApplication app, IConfiguration configuration)
    {
        var frontendHosts = SecurityHostHelper.GetAllowedHosts(configuration, SysParam.Configuration.Whitelist.FrontendPath);
        app.Use((context, next) => HandleRequestAsync(app, context, next, frontendHosts));
    }
    #endregion

    #region Private
    /// <summary>
    /// 依請求條件驗證正式環境寫入來源。
    /// </summary>
    private static async Task HandleRequestAsync(WebApplication app, HttpContext context, Func<Task> next, HashSet<string> frontendHosts)
    {
        if (ShouldSkipProtection(context))
        {
            await next();
            return;
        }
        if (IsBlockedWriteOrigin(app, context, frontendHosts))
        {
            await RejectInvalidOriginAsync(context);
            return;
        }
        await next();
    }

    /// <summary>
    /// 判斷目前請求是否屬於 XSRF Token Endpoint 或本機 Swagger 例外。
    /// </summary>
    private static bool ShouldSkipProtection(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.Equals(XsrfTokenPath, StringComparison.OrdinalIgnoreCase)) return true;
        if (IsLocalHttpSwagger(context)) return true;
        return IsWriteRequest(context.Request.Method) && IsFromLocalSwagger(context);
    }

    /// <summary>
    /// 判斷正式環境的寫入來源是否應被阻擋。
    /// </summary>
    private static bool IsBlockedWriteOrigin(WebApplication app, HttpContext context, HashSet<string> frontendHosts)
    {
        if (!app.Environment.IsProduction() || !IsWriteRequest(context.Request.Method)) return false;
        return !IsValidWriteOrigin(context, frontendHosts);
    }

    /// <summary>
    /// 檢查寫入型請求來源是否允許。
    /// </summary>
    private static bool IsValidWriteOrigin(HttpContext context, HashSet<string> frontendHosts)
    {
        var origin = context.Request.Headers.Origin.ToString();
        var referer = context.Request.Headers.Referer.ToString();
        var sourceUri = SecurityHostHelper.TryParseUri(origin) ?? SecurityHostHelper.TryParseUri(referer);
        var sourceHost = sourceUri?.Host;
        var effectiveHost = SecurityHostHelper.GetEffectiveHost(context);
        return SecurityHostHelper.IsLoopback(context)
            || sourceHost is not null && frontendHosts.Contains(sourceHost)
            || sourceHost is not null && string.Equals(sourceHost, effectiveHost, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 回傳不合法來源的標準禁止回應。
    /// </summary>
    private static async Task RejectInvalidOriginAsync(HttpContext context)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { success = false, message = "Invalid Origin/Referer." });
    }

    /// <summary>
    /// 判斷是否為本機 HTTP Swagger 頁面。
    /// </summary>
    private static bool IsLocalHttpSwagger(HttpContext context)
    {
        var isSwaggerPath = context.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase);
        return isSwaggerPath && SecurityHostHelper.IsLoopback(context) && !context.Request.IsHttps;
    }

    /// <summary>
    /// 判斷寫入型請求是否來自本機 Swagger。
    /// </summary>
    private static bool IsFromLocalSwagger(HttpContext context)
    {
        if (!SecurityHostHelper.IsLoopback(context)) return false;
        var referer = context.Request.Headers.Referer.ToString();
        var origin = context.Request.Headers.Origin.ToString();
        return referer.Contains("http://127.0.0.1/swagger", StringComparison.OrdinalIgnoreCase)
            || origin.Equals("http://127.0.0.1", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 判斷是否為寫入型 HTTP Method。
    /// </summary>
    private static bool IsWriteRequest(string method)
    {
        return HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsDelete(method) || HttpMethods.IsPatch(method);
    }
    #endregion
}
