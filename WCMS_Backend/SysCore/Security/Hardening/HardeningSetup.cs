using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using System.Net;
using System.Threading.RateLimiting;
using WCMS.SysCore.Constants;
namespace WCMS.SysCore.Security.Hardening;

/// <summary>
/// 集中註冊弱掃、防護、來源限制、Cookie 與傳輸安全設定。
/// </summary>
internal static class HardeningSetup
{
    #region Property
    public const string CorsPolicyName = "AllowLocalhostWildcard";
    public const string LoginRateLimitPolicyName = "Login";
    #endregion

    #region Public - Services
    /// <summary>
    /// 套用 Kestrel 安全限制並移除伺服器識別標頭。
    /// </summary>
    public static void ApplyHostSecurity(WebApplicationBuilder builder)
    {
        builder.WebHost.ConfigureKestrel(options =>
        {
            options.AddServerHeader = false;
            options.Limits.MaxRequestHeadersTotalSize = 64 * 1024;
            options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(15);
        });
    }

    /// <summary>
    /// 註冊 CORS、Anti-forgery、Cookie Policy 與 HSTS 服務。
    /// </summary>
    public static void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        AddAntiforgery(services);
        AddCors(services, configuration);
        AddCookiePolicy(services);
        AddHsts(services);
    }

    /// <summary>
    /// 註冊登入嘗試頻率限制，待登入 Endpoint 啟用 Policy 時使用。
    /// </summary>
    public static void AddRateLimiting(IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = HandleRateLimitRejectedAsync;
            options.AddFixedWindowLimiter(LoginRateLimitPolicyName, limiter =>
            {
                limiter.PermitLimit = 3;
                limiter.Window = TimeSpan.FromMinutes(5);
                limiter.QueueLimit = 0;
            });
        });
    }
    #endregion

    #region Public - Pipeline
    /// <summary>
    /// 套用反向 Proxy 的 Forwarded Headers 信任設定。
    /// </summary>
    public static void UseForwardedHeaders(WebApplication app)
    {
        app.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost,
            KnownProxies = { IPAddress.Loopback, IPAddress.IPv6Loopback, IPAddress.Parse("127.0.0.1") },
            RequireHeaderSymmetry = false,
        });
    }

    /// <summary>
    /// 套用後端安全標頭、CSP、Host 白名單與快取限制。
    /// </summary>
    public static void UseSecurityHeaders(WebApplication app, IConfiguration configuration)
    {
        SecurityHeadersSetup.Use(app, configuration);
    }

    /// <summary>
    /// 套用 XSRF Cookie 與寫入來源驗證。
    /// </summary>
    public static void UseXsrfProtection(WebApplication app, IConfiguration configuration)
    {
        XsrfProtectionSetup.Use(app, configuration);
    }

    /// <summary>
    /// 非開發環境套用 HSTS。
    /// </summary>
    public static void UseProductionHsts(WebApplication app)
    {
        if (!app.Environment.IsDevelopment()) app.UseHsts();
    }

    /// <summary>
    /// 套用 HTTPS 轉址。
    /// </summary>
    public static void UseHttpsRedirection(WebApplication app)
    {
        app.UseHttpsRedirection();
    }
    #endregion

    #region Private - Services
    /// <summary>
    /// 註冊 Antiforgery 內部 Cookie 與前端回送 Header 規則；SameSite／Secure 最終由中央 Cookie Policy 執行。
    /// </summary>
    private static void AddAntiforgery(IServiceCollection services)
    {
        services.AddAntiforgery(options =>
        {
            options.Cookie.Name = SysParam.CookieNames.AntiforgeryToken;
            options.Cookie.HttpOnly = true;
            options.Cookie.Path = SysParam.CookiePaths.Root;
            options.HeaderName = SysParam.HttpHeaders.XsrfToken;
        });
        services.AddOptions<AntiforgeryOptions>().Configure<IWebHostEnvironment>((options, environment) =>
        {
            options.Cookie.SecurePolicy = environment.IsDevelopment()
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
        });
    }

    /// <summary>
    /// 註冊前端白名單 CORS Policy。
    /// </summary>
    private static void AddCors(IServiceCollection services, IConfiguration configuration)
    {
        var frontendHosts = SecurityHostHelper.GetAllowedHosts(configuration, SysParam.Configuration.Whitelist.FrontendPath);
        services.AddCors(options => options.AddPolicy(CorsPolicyName, policy =>
        {
            policy.SetIsOriginAllowed(origin => SecurityHostHelper.IsAllowedOrigin(origin, frontendHosts))
                .WithHeaders(SysParam.HttpHeaders.ContentType, SysParam.HttpHeaders.XsrfToken, SysParam.HttpHeaders.Authorization, SysParam.HttpHeaders.RequestedWith, SysParam.HttpHeaders.AccessControlAllowOrigin)
                .WithMethods(HttpMethods.Get, HttpMethods.Post, HttpMethods.Put, HttpMethods.Delete, HttpMethods.Patch)
                .AllowCredentials();
        }));
    }

    /// <summary>
    /// 設定全站 Cookie Policy，由 WCMS Resolver 決定 Default Strict 與未來具名例外。
    /// </summary>
    private static void AddCookiePolicy(IServiceCollection services)
    {
        services.AddOptions<CookiePolicyOptions>().Configure<IWebHostEnvironment>((options, environment) =>
        {
            options.MinimumSameSitePolicy = SameSiteMode.Unspecified;
            options.Secure = environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
            options.HttpOnly = HttpOnlyPolicy.None;
            options.OnAppendCookie = context => CookieSecurityPolicy.Apply(context.CookieName, context.CookieOptions, !environment.IsDevelopment() || context.Context.Request.IsHttps);
            options.OnDeleteCookie = context => CookieSecurityPolicy.Apply(context.CookieName, context.CookieOptions, !environment.IsDevelopment() || context.Context.Request.IsHttps);
        });
    }

    /// <summary>
    /// 註冊正式環境 HSTS 選項。
    /// </summary>
    private static void AddHsts(IServiceCollection services)
    {
        services.AddHsts(options =>
        {
            options.Preload = false;
            options.IncludeSubDomains = false;
            options.MaxAge = TimeSpan.FromDays(365);
        });
    }

    /// <summary>
    /// 回傳登入頻率限制的標準錯誤內容與 Retry-After。
    /// </summary>
    private static async ValueTask HandleRateLimitRejectedAsync(OnRejectedContext context, CancellationToken token)
    {
        context.HttpContext.Response.ContentType = SysParam.MediaTypes.ApplicationJson;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)) context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
        await context.HttpContext.Response.WriteAsync("{\"message\":\"登入嘗試過多，請稍後再試。\"}", token);
    }
    #endregion
}
