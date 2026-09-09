using WCMS.SysCore.Constants;
namespace WCMS.SysCore.Security.Hardening;

/// <summary>
/// 套用後端 Host 白名單、安全標頭、CSP 與正式環境快取限制。
/// </summary>
internal static class SecurityHeadersSetup
{
    #region Property
    private const string SwaggerPath = "/swagger";
    private const string ServicePath = "/Service";
    private const string ContentTypeOptionsHeader = "X-Content-Type-Options";
    private const string FrameOptionsHeader = "X-Frame-Options";
    private const string ReferrerPolicyHeader = "Referrer-Policy";
    private const string PermissionsPolicyHeader = "Permissions-Policy";
    private const string CrossOriginOpenerPolicyHeader = "Cross-Origin-Opener-Policy";
    private const string CrossOriginResourcePolicyHeader = "Cross-Origin-Resource-Policy";
    private const string CrossDomainPoliciesHeader = "X-Permitted-Cross-Domain-Policies";
    private const string ContentSecurityPolicyHeader = "Content-Security-Policy";
    private const string CacheControlHeader = "Cache-Control";
    private const string PragmaHeader = "Pragma";
    private const string ExpiresHeader = "Expires";
    private const string ServerHeader = "Server";
    private const string PoweredByHeader = "X-Powered-By";
    private const string AspNetVersionHeader = "X-AspNet-Version";
    private const string AspNetMvcVersionHeader = "X-AspNetMvc-Version";
    private const string NoSniffValue = "nosniff";
    private const string SameOriginValue = "SAMEORIGIN";
    private const string CrossOriginOpenerPolicyValue = "same-origin";
    private const string CrossOriginResourcePolicyValue = "same-origin";
    private const string NoReferrerValue = "no-referrer";
    private const string PermissionsPolicyValue = "geolocation=(), microphone=(), camera=(), fullscreen=(self)";
    private const string NoneValue = "none";
    private const string ApiCspValue = "default-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";
    private const string BackendCspValue = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'";
    private const string NoStoreValue = "no-store, no-cache, must-revalidate, proxy-revalidate";
    private const string NoCacheValue = "no-cache";
    private const string ZeroValue = "0";
    #endregion

    #region Public
    /// <summary>
    /// 將安全標頭與正式環境 Host 驗證加入 Middleware Pipeline。
    /// </summary>
    public static void Use(WebApplication app, IConfiguration configuration)
    {
        var backendHosts = SecurityHostHelper.GetAllowedHosts(configuration, SysParam.Configuration.Whitelist.BackendPath);
        app.Use((context, next) => HandleRequestAsync(app, context, next, backendHosts));
    }
    #endregion

    #region Private
    /// <summary>
    /// 套用回應標頭並阻擋不在正式環境白名單內的 Host。
    /// </summary>
    private static async Task HandleRequestAsync(WebApplication app, HttpContext context, Func<Task> next, HashSet<string> backendHosts)
    {
        PrepareSecurityHeaders(app, context);
        if (IsBlockedProductionHost(app, context, backendHosts))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }
        await next();
    }

    /// <summary>
    /// 設定共用安全標頭，並在送出前完成資訊洩漏清理。
    /// </summary>
    private static void PrepareSecurityHeaders(WebApplication app, HttpContext context)
    {
        SetCommonSecurityHeaders(context.Response);
        SetPathSecurityHeaders(app, context);
        context.Response.OnStarting(() =>
        {
            FinalizeSecurityHeaders(context.Response);
            return Task.CompletedTask;
        });
    }

    /// <summary>
    /// 設定所有後端回應都應具備的基本安全標頭。
    /// </summary>
    private static void SetCommonSecurityHeaders(HttpResponse response)
    {
        response.Headers[ContentTypeOptionsHeader] = NoSniffValue;
        response.Headers[FrameOptionsHeader] = SameOriginValue;
        response.Headers[ReferrerPolicyHeader] = NoReferrerValue;
        response.Headers[PermissionsPolicyHeader] = PermissionsPolicyValue;
        response.Headers[CrossOriginOpenerPolicyHeader] = CrossOriginOpenerPolicyValue;
        response.Headers[CrossOriginResourcePolicyHeader] = CrossOriginResourcePolicyValue;
        response.Headers[CrossDomainPoliciesHeader] = NoneValue;
    }

    /// <summary>
    /// 依路徑設定 API 或後端錯誤頁的 CSP 與快取策略。
    /// </summary>
    private static void SetPathSecurityHeaders(WebApplication app, HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments(SwaggerPath, StringComparison.OrdinalIgnoreCase)) return;
        if (context.Request.Path.StartsWithSegments(ServicePath, StringComparison.OrdinalIgnoreCase))
        {
            SetApiSecurityHeaders(context.Response);
            if (app.Environment.IsProduction()) SetNoStoreHeaders(context.Response);
            return;
        }
        SetBackendPageSecurityHeaders(context.Response);
        if (app.Environment.IsProduction()) SetNoStoreHeaders(context.Response);
    }

    /// <summary>
    /// 設定 API 回應的嚴格 CSP。
    /// </summary>
    private static void SetApiSecurityHeaders(HttpResponse response)
    {
        response.Headers[ContentSecurityPolicyHeader] = ApiCspValue;
    }

    /// <summary>
    /// 設定後端非 API 頁面的保守 CSP。
    /// </summary>
    private static void SetBackendPageSecurityHeaders(HttpResponse response)
    {
        response.Headers[ContentSecurityPolicyHeader] = BackendCspValue;
    }

    /// <summary>
    /// 設定正式環境 API 不被瀏覽器或 Proxy 快取。
    /// </summary>
    private static void SetNoStoreHeaders(HttpResponse response)
    {
        response.Headers[CacheControlHeader] = NoStoreValue;
        response.Headers[PragmaHeader] = NoCacheValue;
        response.Headers[ExpiresHeader] = ZeroValue;
    }

    /// <summary>
    /// Response 送出前移除可能暴露伺服器實作細節的標頭；CORP 維持共用 same-origin Policy。
    /// </summary>
    private static void FinalizeSecurityHeaders(HttpResponse response)
    {
        RemoveLeakyHeaders(response);
    }

    /// <summary>
    /// 移除可能暴露伺服器實作細節的回應標頭。
    /// </summary>
    private static void RemoveLeakyHeaders(HttpResponse response)
    {
        response.Headers.Remove(ServerHeader);
        response.Headers.Remove(PoweredByHeader);
        response.Headers.Remove(AspNetVersionHeader);
        response.Headers.Remove(AspNetMvcVersionHeader);
    }

    /// <summary>
    /// 檢查正式環境的 Host 是否不在後端白名單內。
    /// </summary>
    private static bool IsBlockedProductionHost(WebApplication app, HttpContext context, HashSet<string> backendHosts)
    {
        if (!app.Environment.IsProduction() || backendHosts.Count == 0) return false;
        var effectiveHost = SecurityHostHelper.GetEffectiveHost(context);
        return !SecurityHostHelper.IsLoopback(context) && !backendHosts.Contains(effectiveHost);
    }
    #endregion
}
