using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using WCMS.Features.IAM.Auth;
using WCMS.SysCore.Interface;

namespace WCMS
{
    /// <summary>
    /// 集中管理弱掃與安全性相關設定。
    /// </summary>
    internal static class SecuritySetup
    {
        public const string CorsPolicyName = "AllowLocalhostWildcard";

        #region Public - Services
        /// <summary>
        /// 套用主機層安全設定，避免伺服器實作資訊外洩。
        /// </summary>
        public static void ApplyHostSecurity(WebApplicationBuilder builder)
        {
            builder.WebHost.UseKestrel(o => o.AddServerHeader = false);
            builder.WebHost.ConfigureKestrel(o => o.AddServerHeader = false);
        }

        /// <summary>
        /// 註冊 CORS、Anti-forgery 與 HSTS 設定。
        /// </summary>
        public static void AddSecurityServices(IServiceCollection services, IConfiguration cfg)
        {
            services.AddAntiforgery(o =>
            {
                o.Cookie.Name = "XSRF-TOKEN";
                o.Cookie.HttpOnly = false;
                o.HeaderName = "X-XSRF-TOKEN";
                o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                o.Cookie.SameSite = SameSiteMode.Strict;
            });

            var feHosts = (cfg.GetSection("Whitelist:Frontend").Get<string[]>() ?? []).Select(HostOnly).ToHashSet(StringComparer.OrdinalIgnoreCase);

            services.AddCors(options =>
            {
                options.AddPolicy(CorsPolicyName, policy =>
                {
                    policy.SetIsOriginAllowed(origin => IsAllowedFrontendOrigin(origin, feHosts))
                        .WithHeaders("Content-Type", "X-XSRF-TOKEN", "Authorization", "X-Requested-With", "Access-Control-Allow-Origin")
                        .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                        .AllowCredentials();
                });
            });

            services.AddHsts(o =>
            {
                o.Preload = false;
                o.IncludeSubDomains = false;
                o.MaxAge = TimeSpan.FromDays(365);
            });
        }

        /// <summary>
        /// 註冊 JWT 驗證設定。
        /// </summary>
        public static void AddJwtAuthentication(IServiceCollection services, IConfiguration cfg)
        {
            var key = cfg["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key in appsettings");
            var issuer = cfg["Jwt:Issuer"];
            var audience = cfg["Jwt:Audience"];

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = true;
                options.SaveToken = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = ctx =>
                    {
                        if (string.IsNullOrEmpty(ctx.Token) && ctx.Request.Cookies.TryGetValue("access", out var cookieToken)) ctx.Token = cookieToken;
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = async ctx =>
                    {
                        var jti = ctx.Principal?.FindFirstValue(JwtRegisteredClaimNames.Jti);
                        if (string.IsNullOrEmpty(jti)) return;

                        var tokens = ctx.HttpContext.RequestServices.GetRequiredService<ITokenService>();
                        if (await tokens.IsAccessBlacklistedAsync(jti)) ctx.Fail("Token has been revoked");
                    }
                };
            });
        }

        /// <summary>
        /// 設定應用程式 Cookie 的安全屬性。
        /// </summary>
        public static void AddAppCookie(IServiceCollection services)
        {
            services.ConfigureApplicationCookie(opt =>
            {
                opt.Cookie.SameSite = SameSiteMode.Strict;
                opt.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            });
        }

        /// <summary>
        /// 設定全站 Cookie Policy。
        /// </summary>
        public static void AddCookiePolicyOptions(WebApplicationBuilder builder)
        {
            builder.Services.Configure<CookiePolicyOptions>(opt =>
            {
                opt.MinimumSameSitePolicy = SameSiteMode.Strict;
                opt.Secure = CookieSecurePolicy.Always;
                opt.HttpOnly = HttpOnlyPolicy.None;
                opt.OnAppendCookie = ctx =>
                {
                    var c = ctx.CookieOptions;
                    if (c.SameSite == SameSiteMode.Unspecified) c.SameSite = SameSiteMode.Strict;
                    c.Secure = true;
                };
            });
        }

        /// <summary>
        /// 註冊登入嘗試頻率限制。
        /// </summary>
        public static void AddRateLimit(IServiceCollection services)
        {
            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.OnRejected = async (context, token) =>
                {
                    context.HttpContext.Response.ContentType = "application/json";
                    if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    {
                        context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                    }
                    await context.HttpContext.Response.WriteAsync("{\"message\":\"登入嘗試過多，請稍後再試。\"}", token);
                };

                options.AddFixedWindowLimiter(nameof(AuthController.Login), opt =>
                {
                    opt.PermitLimit = 3;
                    opt.Window = TimeSpan.FromMinutes(5);
                    opt.QueueLimit = 0;
                });
            });
        }
        #endregion

        #region Public - Pipeline
        /// <summary>
        /// 套用後端 API 安全標頭與弱掃用快取策略。
        /// </summary>
        public static void UseSecurityHeaders(WebApplication app, IConfiguration cfg)
        {
            var beHosts = (cfg.GetSection("Whitelist:Backend").Get<string[]>() ?? []).Select(HostOnly).ToHashSet(StringComparer.OrdinalIgnoreCase);

            app.Use(async (ctx, next) =>
            {
                PrepareSecurityHeaders(app, ctx);

                if (IsBlockedProductionHost(app, ctx, beHosts))
                {
                    ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return;
                }

                await next();
            });
        }

        /// <summary>
        /// 套用 XSRF 與 Origin / Referer 驗證。
        /// </summary>
        public static void UseSecurityXSRF(WebApplication app, IConfiguration cfg)
        {
            var feHosts = (cfg.GetSection("Whitelist:Frontend").Get<string[]>() ?? []).Select(HostOnly).ToHashSet(StringComparer.OrdinalIgnoreCase);

            app.Use(async (ctx, next) =>
            {
                var path = ctx.Request.Path.Value ?? string.Empty;
                var method = ctx.Request.Method;

                if (path.Equals("/Service/SystemAPI/GetXsrfToken", StringComparison.OrdinalIgnoreCase))
                {
                    await next();
                    return;
                }

                if (IsLocalHttpSwagger(ctx))
                {
                    await next();
                    return;
                }

                if (IsWriteRequest(method) && IsFromLocalSwagger(ctx))
                {
                    await next();
                    return;
                }

                await AppendXsrfCookieForHtmlGetAsync(ctx);

                if (app.Environment.IsProduction() && IsWriteRequest(method) && !IsValidWriteOrigin(ctx, feHosts))
                {
                    ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await ctx.Response.WriteAsJsonAsync(new { success = false, message = "Invalid Origin/Referer." });
                    return;
                }

                await next();
            });
        }

        /// <summary>
        /// 正式環境套用 HSTS。
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

        #region Protected - Header
        /// <summary>
        /// 設定共用安全標頭，並在送出前移除容易被弱掃列出的伺服器資訊。
        /// </summary>
        private static void PrepareSecurityHeaders(WebApplication app, HttpContext ctx)
        {
            SetCommonSecurityHeaders(ctx.Response);
            SetPathSecurityHeaders(app, ctx);

            ctx.Response.OnStarting(() =>
            {
                RemoveLeakyHeaders(ctx.Response);
                return Task.CompletedTask;
            });
        }

        /// <summary>
        /// 設定所有後端回應都應具備的基本安全標頭。
        /// </summary>
        private static void SetCommonSecurityHeaders(HttpResponse response)
        {
            response.Headers["X-Content-Type-Options"] = "nosniff";
            response.Headers["X-Frame-Options"] = "SAMEORIGIN";
            response.Headers["Referrer-Policy"] = "no-referrer";
            response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), fullscreen=(self)";
            response.Headers["X-Permitted-Cross-Domain-Policies"] = "none";
        }

        /// <summary>
        /// 依路徑設定 API 或後端錯誤頁的 CSP 與快取策略。
        /// </summary>
        private static void SetPathSecurityHeaders(WebApplication app, HttpContext ctx)
        {
            if (ctx.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase)) return;

            if (ctx.Request.Path.StartsWithSegments("/Service", StringComparison.OrdinalIgnoreCase))
            {
                SetApiSecurityHeaders(ctx.Response);
                if (app.Environment.IsProduction()) SetNoStoreHeaders(ctx.Response);
                return;
            }

            SetBackendPageSecurityHeaders(ctx.Response);
            if (app.Environment.IsProduction()) SetNoStoreHeaders(ctx.Response);
        }

        /// <summary>
        /// 設定 API 回應的嚴格 CSP，避免 JSON / 檔案回應被當成可執行內容。
        /// </summary>
        private static void SetApiSecurityHeaders(HttpResponse response)
        {
            response.Headers["Content-Security-Policy"] = "default-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'";
        }

        /// <summary>
        /// 設定後端非 API 頁面的保守 CSP，主要涵蓋 404 / 403 / 錯誤頁。
        /// </summary>
        private static void SetBackendPageSecurityHeaders(HttpResponse response)
        {
            response.Headers["Content-Security-Policy"] =
                "default-src 'self'; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data:; " +
                "object-src 'none'; " +
                "base-uri 'self'; " +
                "frame-ancestors 'self'; " +
                "form-action 'self'";
        }

        /// <summary>
        /// 設定正式環境 API 不被瀏覽器或 Proxy 快取。
        /// </summary>
        private static void SetNoStoreHeaders(HttpResponse response)
        {
            response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
            response.Headers["Pragma"] = "no-cache";
            response.Headers["Expires"] = "0";
        }

        /// <summary>
        /// 移除可能暴露伺服器實作細節的回應標頭。
        /// </summary>
        private static void RemoveLeakyHeaders(HttpResponse response)
        {
            response.Headers.Remove("Server");
            response.Headers.Remove("X-Powered-By");
            response.Headers.Remove("X-AspNet-Version");
            response.Headers.Remove("X-AspNetMvc-Version");
        }
        #endregion

        #region Protected - XSRF
        /// <summary>
        /// HTML GET 時鑄造前端可讀的 XSRF Token Cookie。
        /// </summary>
        private static async Task AppendXsrfCookieForHtmlGetAsync(HttpContext ctx)
        {
            if (!ShouldAppendXsrfCookie(ctx)) return;

            var af = ctx.RequestServices.GetRequiredService<IAntiforgery>();
            var tokens = af.GetAndStoreTokens(ctx);
            if (string.IsNullOrEmpty(tokens.RequestToken)) return;

            ctx.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken, new CookieOptions
            {
                HttpOnly = false,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Path = "/"
            });

            await Task.CompletedTask;
        }

        /// <summary>
        /// 判斷是否需要在 HTML GET 回應鑄造 XSRF Cookie。
        /// </summary>
        private static bool ShouldAppendXsrfCookie(HttpContext ctx)
        {
            var isHtml = ctx.Request.Headers.Accept.ToString().Contains("text/html", StringComparison.OrdinalIgnoreCase);
            return ctx.Request.IsHttps && !ctx.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase) && isHtml && HttpMethods.IsGet(ctx.Request.Method);
        }

        /// <summary>
        /// 檢查寫入型請求來源是否允許。
        /// </summary>
        private static bool IsValidWriteOrigin(HttpContext ctx, HashSet<string> feHosts)
        {
            var origin = ctx.Request.Headers.Origin.ToString();
            var referer = ctx.Request.Headers.Referer.ToString();
            var src = TryParse(origin) ?? TryParse(referer);
            var sourceHost = src?.Host;
            var effectiveHost = EffectiveHost(ctx);
            var isLoopback = ctx.Connection.RemoteIpAddress is IPAddress ip && IPAddress.IsLoopback(ip);

            return isLoopback || (sourceHost != null && feHosts.Contains(sourceHost)) || (sourceHost != null && string.Equals(sourceHost, effectiveHost, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// 判斷是否為本機 HTTP Swagger 頁面。
        /// </summary>
        private static bool IsLocalHttpSwagger(HttpContext ctx)
        {
            var isSwaggerPath = ctx.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase);
            var isLocal = ctx.Connection.RemoteIpAddress is IPAddress ip && IPAddress.IsLoopback(ip);
            return isSwaggerPath && isLocal && !ctx.Request.IsHttps;
        }

        /// <summary>
        /// 判斷寫入型請求是否來自本機 Swagger。
        /// </summary>
        private static bool IsFromLocalSwagger(HttpContext ctx)
        {
            var isLocal = ctx.Connection.RemoteIpAddress is IPAddress ip && IPAddress.IsLoopback(ip);
            var referer = ctx.Request.Headers.Referer.ToString();
            var origin = ctx.Request.Headers.Origin.ToString();

            return isLocal && (referer.Contains("http://127.0.0.1/swagger", StringComparison.OrdinalIgnoreCase) || origin.Equals("http://127.0.0.1", StringComparison.OrdinalIgnoreCase));
        }
        #endregion

        #region Private - Check Data
        /// <summary>
        /// 檢查正式環境的 Host 是否在後端白名單內。
        /// </summary>
        private static bool IsBlockedProductionHost(WebApplication app, HttpContext ctx, HashSet<string> beHosts)
        {
            if (!app.Environment.IsProduction() || beHosts.Count == 0) return false;

            var effectiveHost = EffectiveHost(ctx);
            var isLoopback = ctx.Connection.RemoteIpAddress is IPAddress ip && IPAddress.IsLoopback(ip);

            return !isLoopback && !beHosts.Contains(effectiveHost);
        }

        /// <summary>
        /// 判斷來源是否為前端白名單。
        /// </summary>
        private static bool IsAllowedFrontendOrigin(string origin, HashSet<string> feHosts)
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var u)) return false;
            return feHosts.Contains(u.Host);
        }

        /// <summary>
        /// 判斷是否為寫入型 HTTP Method。
        /// </summary>
        private static bool IsWriteRequest(string method)
        {
            return HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsDelete(method) || HttpMethods.IsPatch(method);
        }
        #endregion

        #region Private - Utility
        /// <summary>
        /// 取得對外實際主機，優先使用 X-Forwarded-Host。
        /// </summary>
        private static string EffectiveHost(HttpContext ctx)
        {
            var fwd = ctx.Request.Headers["X-Forwarded-Host"].FirstOrDefault();
            var raw = !string.IsNullOrWhiteSpace(fwd) ? fwd : ctx.Request.Host.Value;
            return HostOnly(raw);
        }

        /// <summary>
        /// 去除 Host 中的 Port。
        /// </summary>
        private static string HostOnly(string? hostPort)
        {
            if (string.IsNullOrWhiteSpace(hostPort)) return string.Empty;

            var h = hostPort.Trim();
            var i = h.IndexOf(':');
            return i >= 0 ? h[..i] : h;
        }

        /// <summary>
        /// 嘗試解析 Uri。
        /// </summary>
        private static Uri? TryParse(string? value)
        {
            return !string.IsNullOrWhiteSpace(value) && Uri.TryCreate(value, UriKind.Absolute, out var uri) ? uri : null;
        }
        #endregion
    }
}
