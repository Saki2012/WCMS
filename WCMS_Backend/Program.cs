using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization.Metadata;
using System.Text.RegularExpressions;
using System.Threading.RateLimiting;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Calendar;
using WCMS.Features.COMM.Person;
using WCMS.Features.IAM.Account;
using WCMS.Features.IAM.Auth;
using WCMS.Features.IAM.RolePermission;
using WCMS.Features.SystemSetting.Calendar;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.SysCore;
using WCMS.SysCore.AppSettingsOptions;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Filter;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Library.Security;
using WCMS.SysCore.Middleware;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            SpecSettings.Init(builder.Configuration);
            // ① 基礎主機/效能/安全 – 最小化 API 伺服器足跡
            AppSetup.BasicSetting(builder);
            // ② 連線性（Connection）– 全集中在這裡修改
            AppSetup.AddConnections(builder.Services, builder.Configuration);
            // ③ 核心服務（DI/Repository/檔案路徑等）
            AppSetup.AddCoreServices(builder.Services, builder.Configuration);
            AppSetup.AddAppSettingsOptions(builder.Services, builder.Configuration);
            // ④ 安全性（CORS/安全標頭/Anti-forgery）
            AppSetup.AddSecurityServices(builder.Services, builder.Configuration);
            // ⑤ 認證/授權（JWT）– 請在 appsettings 的 Jwt 節調整
            AppSetup.AddJwtAuthentication(builder.Services, builder.Configuration);
            AppSetup.AddAppCookie(builder.Services);
            AppSetup.APIBehavior(builder.Services);
            //AppSetup.AddRateLimit(builder.Services);
            // 開發期 Swagger（產線預設關）
            AppSetup.AddDebugServices(builder);
            AppSetup.AddCookiePolicyOptions(builder);
            ///啟動時自動建立資料夾
            //builder.Services.AddHostedService<EnsureStorageFoldersHostedService>();


            var app = builder.Build();
            // 全域錯誤攔截（你原本已有）
            app.UseMiddleware<ErrorHandlingMiddleware>();
            // 反向 Proxy/負載平衡（IIS/Nginx/K8s）常見需求
            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost,
                KnownProxies = { IPAddress.Loopback, IPAddress.IPv6Loopback, IPAddress.Parse("127.0.0.1") },
                RequireHeaderSymmetry = false,
            });
            app.UseCookiePolicy();
            // 安全標頭（弱掃友好）
            AppSetup.UseSecurityHeaders(app, builder.Configuration);
            AppSetup.UseSecurityXSRF(app, builder.Configuration);
            //處理API支援語系
            var supported = new[] { new CultureInfo("zh-TW"), new CultureInfo("en") };
            app.UseRequestLocalization(new RequestLocalizationOptions
            {
                DefaultRequestCulture = new RequestCulture("zh-TW"),
                SupportedCultures = supported,
                SupportedUICultures = supported,
                RequestCultureProviders = [new AcceptLanguageHeaderRequestCultureProvider()]
            });


            // 系統啟用時初始註冊必須設定
            await AppSetup.InitDbSettingsAsync(app.Services, builder.Configuration, app.Environment);

            // Swagger 僅開發期
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                // 只允許本機打 /swagger/*
                app.UseWhen(ctx => ctx.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase), sub => sub.Use(async (ctx, next) =>
                {
                    var ip = ctx.Connection.RemoteIpAddress;
                    // 僅允許 127.0.0.1/::1，且 Host 必須是 127.0.0.1（防止繞 Host）
                    if (!(IPAddress.IsLoopback(ip) &&
                          string.Equals(ctx.Request.Host.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase)))
                    {
                        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await ctx.Response.WriteAsync("Swagger is local-only.");
                        return;
                    }
                    await next();
                }));
                app.UseWhen(ctx =>
                {
                    var ip = ctx.Connection.RemoteIpAddress;
                    return ip is not null && IPAddress.IsLoopback(ip);
                },
                branch =>
                {
                    branch.UseSwagger();
                    branch.UseSwaggerUI(c =>
                    {
                        c.RoutePrefix = "swagger";
                        c.SwaggerEndpoint("/swagger/v1/swagger.json", "WCMS API v1");
                        // 讓 Swagger-UI 自動帶 XSRF header（從 Cookie 讀）
                        //c.UseRequestInterceptor("(req)=>{var m=document.cookie.match(/(?:^|;\\\\s*)XSRF-TOKEN=([^;]+)/);if(m){req.headers['X-XSRF-TOKEN']=decodeURIComponent(m[1]);}return req;}");
                    });
                });
                app.UseHsts();
            }
            // 產線請確保有 HTTPS（若由前置 Proxy 終結 TLS，保留這行也 OK）
            app.UseHttpsRedirection();
            using (var scope = app.Services.CreateScope())
            {
                var cacheStore = scope.ServiceProvider.GetRequiredService<IOutputCacheStore>();
                cacheStore.EvictByTagAsync("perm", default).GetAwaiter().GetResult();
            }


            // CORS 放在 Auth 前
            app.UseCors(AppSetup.CorsPolicyName);
            app.UseResponseCompression();

            //app.UseRateLimiter();
            app.UseAuthentication();
            app.UseAuthorization();
            //app.UseMiddleware<OperateLogMiddleware>();//操作日誌紀錄，後續測試
            app.UseOutputCache();
            app.MapControllers();
            app.Run();
        }

        /// <summary>
        /// ✅ 開發者修改指引：把「連線、安全、注入」集中到這個類別，
        /// 之後同事要改就找這裡，不會到處散落。
        /// </summary>
        internal static class AppSetup
        {
            // CORS Policy 名稱統一放這裡
            public const string CorsPolicyName = "AllowLocalhostWildcard";
            #region Services
            /// <summary>
            /// 
            /// </summary>
            /// <param name="builder"></param>
            public static void BasicSetting(WebApplicationBuilder builder)
            {
                builder.WebHost.UseIIS();
                builder.WebHost.UseKestrel(o => o.AddServerHeader = false);
                builder.WebHost.ConfigureKestrel(o =>
                {
                    o.AddServerHeader = false; // 移除 Server 標頭（弱掃友好）
                    o.Limits.MaxRequestHeadersTotalSize = 64 * 1024;      // 64KB headers
                    o.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(15);
                    //if (builder.Environment.IsProduction()) o.ListenLocalhost(5624);// 後端只聽本機（IIS/Nginx 反向 Proxy）
                    // 視流量特性微調
                    // o.Limits.MaxConcurrentConnections = 1000;
                    // o.Limits.MaxRequestBodySize = 100 * 1024 * 1024;   // 若要全域限制上傳
                });
                builder.Services.AddResponseCompression(options =>
                {
                    options.EnableForHttps = true; // HTTPS 也壓縮（API 建議開）
                    options.MimeTypes = ["application/json", "text/json"]; // 白名單
                    options.Providers.Clear();
                    options.Providers.Add<BrotliCompressionProvider>();
                    options.Providers.Add<GzipCompressionProvider>();
                });
                // 速度優先（API 通常瓶頸在網路延遲與頻寬，Fastest 很夠用）
                builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);
                builder.Services.Configure<GzipCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);
            }
            /// <summary>
            /// 連線相關（SQL / Redis / 其他外部資源）
            /// </summary>
            public static void AddConnections(IServiceCollection services, IConfiguration cfg)
            {
                //暫時先不用Redis，等開始能架Docker包Linux後再來
                //services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(cfg.GetConnectionString("RedisConnection")));

                var cs = cfg.GetConnectionString("SqlConnection");
                if (string.IsNullOrWhiteSpace(cs)) throw new InvalidOperationException("Missing ConnectionStrings:SqlConnection. 請在 appsettings.* 或使用環境變數/Secrets 設定。");
#if DEBUG
                services.AddSingleton<EfSqlConsoleInterceptor>();
#endif

                services.AddDbContextPool<ApplicationDbContext>((sp, opt) =>
                {
                    opt.UseSqlServer(cs);
#if DEBUG
                    opt.AddInterceptors(sp.GetRequiredService<EfSqlConsoleInterceptor>());
                    opt.EnableDetailedErrors();
#endif
                });
            }
            /// <summary>
            /// 核心服務/DI（Controller、Biz、Repository）
            /// </summary>
            public static void AddCoreServices(IServiceCollection services, IConfiguration cfg)
            {
                services.AddControllers(options =>
                {
                    options.Filters.Add<SpecApiAccessFilter>();
                }).AddJsonOptions(opt =>
                {
                    opt.JsonSerializerOptions.PropertyNamingPolicy = null;
                    opt.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
                    opt.JsonSerializerOptions.WriteIndented = false;
                    opt.JsonSerializerOptions.UnmappedMemberHandling = System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow;
                });
                services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(o =>
                {
                    if (o.SerializerOptions.TypeInfoResolver == null &&
                        o.SerializerOptions.TypeInfoResolverChain.Count == 0)
                    {
                        o.SerializerOptions.TypeInfoResolverChain.Add(new DefaultJsonTypeInfoResolver());
                    }
                });
                services.AddScoped(typeof(IBasicRepository<>), typeof(BasicRepository<>));
                services.AddScoped<IRepositoryMapProvider, RepositoryMapProvider>();
                services.AddScoped<IErrorHelper, ErrorHelper>();
                services.AddScoped<IOperateLog, OperateLog>();
                services.AddScoped<BizDeps>();
                services.AddHttpContextAccessor();
                services.AddScoped<ICurrentUserAccessor, HttpContextCurrentUserAccessor>();
                services.AddScoped<ILibPermissionChecker, LibPermissionChecker>();
                services.AddHttpClient();
                RegisterBizServices(services);

                // 暫時先不用Redis，等開始能架Docker包Linux後再來
                //services.AddStackExchangeRedisOutputCache(o =>
                //{
                //    // 用你的連線字串；這會由擴充方法內部建立連線
                //    o.Configuration = cfg.GetConnectionString("RedisConnection");
                //    o.InstanceName = "oc:";   // Redis key 前綴，避免與其他功能衝突
                //});

                services.AddOutputCache(options =>
                {
                    const string LangHeader = "Accept-Language";

                    // 清單快取
                    options.AddPolicy(SysParam.ListCache, b => b
                        .Expire(TimeSpan.FromSeconds(60))
                        .SetVaryByQuery("*")                    // 條件、分頁都影響快取
                        .SetVaryByHeader(LangHeader)
                        .Tag("set:list")                        // 共用 Tag
                    );
                    // 明細快取
                    options.AddPolicy(SysParam.DetailCache, b => b
                        .Expire(TimeSpan.FromSeconds(60))
                        .SetVaryByQuery("internalId")           // 按 QueryString 分片
                        .SetVaryByHeader(LangHeader)
                        .Tag("set:detail")                      // 共用 Tag
                    );
                    // 永久參數
                    options.AddPolicy(SysParam.PermanentCache, b => b
                        .Expire(TimeSpan.FromDays(365))
                        .SetVaryByHeader(LangHeader)
                        .Tag("perm"));
                });


                services.AddMemoryCache();
                services.AddSingleton<ITokenService, TokenService>();
            }
            /// <summary>
            /// 安全性服務（CORS / Anti-forgery）
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
                // CORS：只允許本機與你的網域。要再加網域請到 appsettings 。
                services.AddCors(options =>
                {
                    options.AddPolicy(CorsPolicyName, policy =>
                    {
                        policy.SetIsOriginAllowed(origin =>
                        {
                            if (!Uri.TryCreate(origin, UriKind.Absolute, out var u)) return false;
                            return feHosts.Contains(u.Host);
                        })
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
            /// JWT 驗證（請在 appsettings:Jwt 設 Issuer/Audience/Key/有效期）
            /// </summary>
            public static void AddJwtAuthentication(IServiceCollection services, IConfiguration cfg)
            {
                var key = cfg["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key in appsettings");
                var issuer = cfg["Jwt:Issuer"];
                var audience = cfg["Jwt:Audience"];

                services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                    .AddJwtBearer(options =>
                    {
                        // 只接受 HTTPS（開發期可關閉，但建議保留）
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
                            ClockSkew = TimeSpan.FromMinutes(1) // 避免太寬鬆
                        };

                        options.Events = new JwtBearerEvents
                        {
                            // ✅ 從 HttpOnly Cookie 讀取 access token（若沒有 Authorization 標頭）
                            OnMessageReceived = ctx =>
                            {
                                if (string.IsNullOrEmpty(ctx.Token))
                                {
                                    if (ctx.Request.Cookies.TryGetValue("access", out var cookieToken))
                                        ctx.Token = cookieToken;
                                }
                                return Task.CompletedTask;
                            },

                            OnTokenValidated = async ctx =>
                            {
                                var jti = ctx.Principal?.FindFirstValue(JwtRegisteredClaimNames.Jti);
                                if (!string.IsNullOrEmpty(jti))
                                {
                                    var tokens = ctx.HttpContext.RequestServices.GetRequiredService<ITokenService>();
                                    if (await tokens.IsAccessBlacklistedAsync(jti))
                                        ctx.Fail("Token has been revoked");
                                }
                            }
                        };
                    });
            }
            /// <summary>
            /// 
            /// </summary>
            /// <param name="services"></param>
            public static void AddAppCookie(IServiceCollection services)
            {
                services.ConfigureApplicationCookie(opt =>
                {
                    opt.Cookie.SameSite = SameSiteMode.Strict;  // 代理 + HTTPS
                    opt.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                    //opt.Cookie.Domain = "wcms.it-easygoapp.com"; // 同網域可省略，但建議固定
                });
            }
            /// <summary>
            /// 反射註冊 BizService。
            /// </summary>
            private static void RegisterBizServices(IServiceCollection services)
            {
                var asm = typeof(Program).Assembly;
                var biz = typeof(BizService<>);
                var ibiz = typeof(IBizService<>);

                var pairs = asm.GetTypes().Where(t => !t.IsAbstract && !t.IsInterface && t != biz)
                    .SelectMany(t => t.GetInterfaces()
                    .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == ibiz)
                    .Select(i => new
                    {
                        Service = i,
                        Impl = t,
                        Ns = t.Namespace ?? string.Empty
                    })).ToList();

                foreach (var p in pairs.Where(p => p.Ns.StartsWith(SysParam.WCMSFeaturesNameSpace, StringComparison.Ordinal))) services.AddScoped(p.Service, p.Impl);

                foreach (var p in pairs.Where(p => !p.Ns.StartsWith(SysParam.WCMSFeaturesNameSpace, StringComparison.Ordinal) && !SpecSettings.IsSpecFeaturesNamespace(p.Ns))) services.AddScoped(p.Service, p.Impl);

                foreach (var p in pairs.Where(p => SpecSettings.IsCurrentSpecNamespace(p.Ns))) services.AddScoped(p.Service, p.Impl);

                services.AddScoped<IAuthService, AuthBiz>();
            }
            /// <summary>
            /// Development-only服務（如 Swagger）
            /// </summary>
            /// <param name="builder"></param>
            public static void AddDebugServices(WebApplicationBuilder builder)
            {
                //if (builder.Environment.IsDevelopment())
                //{
                AppContext.SetSwitch("System.Text.Json.JsonSerializer.IsReflectionEnabledByDefault", true);
                builder.Services.AddEndpointsApiExplorer();
                builder.Services.AddSwaggerGen(c =>
                {
                    c.OperationFilter<AddAcceptLanguageHeaderOperationFilter>();

                    c.SwaggerDoc("v1", new OpenApiInfo { Title = "WCMS API", Version = "v1" });

                    // 加上這段才會有 Authorize 按鈕
                    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                    {
                        Name = "Authorization",
                        Type = SecuritySchemeType.ApiKey,
                        Scheme = "Bearer",
                        BearerFormat = "JWT",
                        In = ParameterLocation.Header,
                        Description = "請輸入: Bearer {你的AccessToken}"
                    });

                    c.AddSecurityRequirement(new OpenApiSecurityRequirement
                    {
                            {
                                new OpenApiSecurityScheme
                                {
                                    Reference = new OpenApiReference
                                    {
                                        Type = ReferenceType.SecurityScheme,
                                        Id = "Bearer"
                                    }
                                },
                                Array.Empty<string>()
                            }
                    });

#if DEBUG
                    c.SchemaFilter<LoginRequestSchemaFilter>();
#endif
                });
                //}
            }
            /// <summary>
            /// 
            /// </summary>
            /// <param name="builder"></param>
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
            /// 
            /// </summary>
            /// <param name="services"></param>
            public static void APIBehavior(IServiceCollection services)
            {
                services.Configure<ApiBehaviorOptions>(opt =>
                {
                    opt.InvalidModelStateResponseFactory = context =>
                    {
                        // 宣告變數
                        var response = BuildInvalidModelResponse(context);

                        // return
                        return new BadRequestObjectResult(response);
                    };
                });
            }
            /// <summary>
            /// 
            /// </summary>
            /// <param name="services"></param>
            /// <param name="cfg"></param>
            public static void AddAppSettingsOptions(IServiceCollection services, IConfiguration cfg)
            {
                services.Configure<FilePathOptions>(cfg.GetSection("FilePaths"));
                services.Configure<WhitelistOptions>(cfg.GetSection("Whitelist"));
            }
            /// <summary>
            /// 
            /// </summary>
            /// <param name="services"></param>
            public static void AddRateLimit(IServiceCollection services)
            {
                services.AddRateLimiter(options =>
                {

                    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                    options.OnRejected = async (context, token) =>
                    {
                        context.HttpContext.Response.ContentType = "application/json";
                        // 如果系統有提供 Retry-After，就取出來加到 header
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

            #region App
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
                response.Headers["Strict-Transport-Security"] = "max-age=31536000";
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
                response.Headers["Content-Security-Policy"] =
                    "default-src 'none'; " +
                    "object-src 'none'; " +
                    "base-uri 'none'; " +
                    "frame-ancestors 'self'; " +
                    "form-action 'self'";
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
            /// 設定 HTTPS 頁面與 API 不被瀏覽器或 Proxy 快取。
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
            /// 
            /// </summary>
            /// <param name="app"></param>
            /// <param name="cfg"></param>
            public static void UseSecurityXSRF(WebApplication app, IConfiguration cfg)
            {
                var feHosts = (cfg.GetSection("Whitelist:Frontend").Get<string[]>() ?? []).Select(HostOnly).ToHashSet(StringComparer.OrdinalIgnoreCase);

                app.Use(async (ctx, next) =>
                {
                    var path = ctx.Request.Path.Value ?? "";
                    var method = ctx.Request.Method;
                    if (path.Equals("/Service/SystemAPI/GetXsrfToken", StringComparison.OrdinalIgnoreCase))
                    {
                        await next();
                        return;
                    }
                    // === A) 本機 HTTP 的 /swagger 頁面：不要鑄 Anti-forgery token，避免 CheckSSLConfig ===
                    bool isSwaggerPath = ctx.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase);
                    bool isLocal = IPAddress.IsLoopback(ctx.Connection.RemoteIpAddress);
                    if (isSwaggerPath && isLocal && !ctx.Request.IsHttps)
                    {
                        await next(); // 直接放行載入 Swagger UI
                        return;
                    }
                    // === B) 從「本機 Swagger」發出的寫入型請求：暫時略過 XSRF 驗證（僅限本機） ===
                    bool isWrite = HttpMethods.IsPost(ctx.Request.Method) || HttpMethods.IsPut(ctx.Request.Method) || HttpMethods.IsDelete(ctx.Request.Method) || HttpMethods.IsPatch(ctx.Request.Method);
                    // 來源判斷：Referer 指向本機 swagger，或 Origin 是 http://127.0.0.1
                    string referer = ctx.Request.Headers.Referer.ToString();
                    string origin = ctx.Request.Headers.Origin.ToString();
                    bool fromLocalSwagger = isLocal && (referer.Contains("http://127.0.0.1/swagger", StringComparison.OrdinalIgnoreCase) || origin.Equals("http://127.0.0.1", StringComparison.OrdinalIgnoreCase));
                    if (isWrite && fromLocalSwagger)
                    {
                        await next(); // ← 本機用 Swagger 測試 POST/PUT/DELETE/PATCH：不驗 XSRF
                        return;
                    }
                    bool isHtml = ctx.Request.Headers.Accept.ToString().Contains("text/html", StringComparison.OrdinalIgnoreCase);

                    if (ctx.Request.IsHttps && !ctx.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase)
                        && isHtml && HttpMethods.IsGet(ctx.Request.Method))
                    {
                        var af = ctx.RequestServices.GetRequiredService<IAntiforgery>();
                        var tokens = af.GetAndStoreTokens(ctx);

                        if (!string.IsNullOrEmpty(tokens.RequestToken))
                        {
                            ctx.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken, new CookieOptions
                            {
                                HttpOnly = false,   // 讓前端可讀→塞進 X-XSRF-TOKEN
                                Secure = true,      // 測試期若純 http 可改 SameAsRequest
                                SameSite = SameSiteMode.Strict,
                                Path = "/"
                            });
                        }
                    }

                    if (app.Environment.IsProduction() && (HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsDelete(method) || HttpMethods.IsPatch(method)))
                    {
                        // 來源：優先 Origin，沒有就用 Referer
                        static Uri? TryParse(string? v) => !string.IsNullOrWhiteSpace(v) && Uri.TryCreate(v, UriKind.Absolute, out var u) ? u : null;
                        var src = TryParse(origin) ?? TryParse(referer);
                        var sourceHost = src?.Host;
                        var effectiveHost = EffectiveHost(ctx);
                        var isLoopback = ctx.Connection.RemoteIpAddress is IPAddress ip && IPAddress.IsLoopback(ip);
                        // 接受：1) 來自本機；2) 來源 host 在前端白名單；3) 來源 host 就是本站（同源）
                        var pass = isLoopback || (sourceHost != null && feHosts.Contains(sourceHost)) || (sourceHost != null && string.Equals(sourceHost, effectiveHost, StringComparison.OrdinalIgnoreCase));
                        if (!pass)
                        {
                            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                            await ctx.Response.WriteAsJsonAsync(new { success = false, message = "Invalid Origin/Referer." });
                            return;
                        }
                    }
                    await next();
                });
            }
            #endregion

            #region Initial Data
            /// <summary>
            /// 啟動時初始化系統所需設定。
            /// </summary>
            public static async Task InitDbSettingsAsync(IServiceProvider services, IConfiguration cfg, IWebHostEnvironment env)
            {
                // 宣告變數：建立初始化用 Scope 與 DbContext
                using var scope = services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                // 執行檢查：確保 DB SpecCode 與目前系統 SpecCode 一致
                await EnsureDbSpecCodeAsync(db);
                // 宣告變數：判斷是否執行其他初始化資料
                var enabled = cfg.GetValue("DbInit:Enabled", true);
                if (!enabled) return;
                // 執行初始化：註冊 UDF 與必要系統資料
                await RegistUDFAsync(cfg, env, db);
                await RegistSysAccountAsync(cfg, db);
                await RegistSiteIndex(cfg, db);
                await RegistCalendar(services);
            }
            /// <summary>
            /// 確保 DB SpecCode 與目前系統 SpecCode 一致。
            /// </summary>
            private static async Task EnsureDbSpecCodeAsync(ApplicationDbContext db)
            {
                // 宣告變數：設定鍵與目前系統 SpecCode，空字串代表純 Feature 版本
                const string specCodeKey = "SpecCode";
                var appSpecCode = SpecSettings.SpecCode?.Trim() ?? string.Empty;
                // 執行查詢：取得 DB 目前記錄的 SpecCode
                var profile = await db.SysDbProfile.FirstOrDefaultAsync(p => p.ProfileKey == specCodeKey);
                // 執行新增：第一次啟動 DB 時寫入 SpecCode，允許空字串代表純 Feature 版本
                if (profile == null)
                {
                    db.SysDbProfile.Add(new SysDbProfile
                    {
                        ProfileKey = specCodeKey,
                        ProfileValue = appSpecCode,
                        CreateTime = DateTime.Now,
                        ModifyTime = null,
                    });

                    await db.SaveChangesAsync();
                    return;
                }
                // 宣告變數：DB 內記錄的 SpecCode，null 視為空字串
                var dbSpecCode = profile.ProfileValue?.Trim() ?? string.Empty;
                // 執行檢查：如果 DB SpecCode 與系統 SpecCode 不一致，直接中止啟動
                if (!string.Equals(dbSpecCode, appSpecCode, StringComparison.Ordinal))
                {
                    throw new InvalidOperationException($@"
DB SpecCode 檢查未通過。App SpecCode = '{FormatSpecCode(appSpecCode)}'，DB SpecCode = '{FormatSpecCode(dbSpecCode)}'。
目前程式與資料庫不屬於同一個 Spec，請確認升級目標 DB、連線字串、SpecCode 設定是否正確。");
                }
            }
            /// <summary>
            /// 格式化 SpecCode 訊息，避免空字串不容易辨識。
            /// </summary>
            private static string FormatSpecCode(string specCode)
            {
                return string.IsNullOrWhiteSpace(specCode) ? "(empty)" : specCode;
            }
            /// <summary>
            /// 註冊UDF
            /// 讀取 SysCore/UDF 內所有 .sql 並逐檔（依檔名排序）執行；支援 GO 斷批。
            /// 每檔各自交易，任一檔失敗就中止並拋例外（避免上線半套狀態）。
            /// </summary>
            private static async Task RegistUDFAsync(IConfiguration cfg, IWebHostEnvironment env, ApplicationDbContext db)
            {
                // 1) 解析 UDF 目錄
                var udfPath = cfg["DbInit:UdfPath"];
                if (string.IsNullOrWhiteSpace(udfPath)) udfPath = Path.Combine(env.ContentRootPath, "SysCore", "UDF");
                if (!Directory.Exists(udfPath)) return;
                // 2) 找出所有 .sql（遞迴），以檔名排序（含子資料夾層級）
                var files = Directory.EnumerateFiles(udfPath, "*.sql", SearchOption.AllDirectories).OrderBy(p => p, StringComparer.OrdinalIgnoreCase).ToArray();
                if (files.Length == 0) return;
                // 3) 逐檔執行（每檔一交易）
                var swAll = System.Diagnostics.Stopwatch.StartNew();
                var conn = (SqlConnection)db.Database.GetDbConnection();
                await conn.OpenAsync();
                try
                {
                    foreach (var file in files)
                    {
                        var sqlText = await File.ReadAllTextAsync(file, Encoding.UTF8);
                        var lines = Regex.Split(sqlText, @"^\s*GO\s*(?:--.*)?$\r?$", RegexOptions.Multiline | RegexOptions.IgnoreCase);
                        var batches = lines.Select(s => s.Trim()).Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
                        var sw = System.Diagnostics.Stopwatch.StartNew();
                        using var tx = conn.BeginTransaction();
                        try
                        {
                            foreach (var batch in batches)
                            {
                                if (string.IsNullOrWhiteSpace(batch)) continue;
                                using var cmd = new SqlCommand(batch, conn, tx) { CommandType = CommandType.Text };
                                await cmd.ExecuteNonQueryAsync();
                            }
                            await tx.CommitAsync();
                        }
                        catch (Exception)
                        {
                            await tx.RollbackAsync();
                            // 若要不中止啟動，把下行改為 continue；建議產線預設中止避免半套
                            throw;
                        }
                    }
                }
                finally
                {
                    await conn.CloseAsync();
                }
            }
            private static string MakeRelative(string path, string root)
            {
                try
                {
                    var p = Path.GetFullPath(path);
                    var r = Path.GetFullPath(root);
                    if (p.StartsWith(r, StringComparison.OrdinalIgnoreCase)) return p[r.Length..].TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                    return path;
                }
                catch { return path; }
            }
            private sealed class AccountsSeedRoot
            {
                public Account_DTO SysOperator { get; init; } = new();
                public Account_DTO Admin { get; init; } = new();
            }
            /// <summary>
            /// 註冊系統用戶
            /// </summary>
            private static async Task RegistSysAccountAsync(IConfiguration cfg, ApplicationDbContext db)
            {
                var section = cfg.GetSection("DbInit:Account");
                var opt = section.Get<AccountsSeedRoot>();
                if (opt is null) return;
                // 以交易確保帳戶/人員/角色與橋接綁定一致
                await using var tx = await db.Database.BeginTransactionAsync();
                // 1) 角色確保存在
                //var roleAdmin = await FindOrCreateRoleAsync(db, opt.SysOperator.RoleId, logger);
                //var roleAdmin2 = await FindOrCreateRoleAsync(db, opt.Admin.RoleId, logger); // 允許不同設定
                //await db.SaveChangesAsync();
                await UpsertRolePermissionAsync(db);
                // 2) SysOperator：不可登入、不設密碼
                await UpsertPersonAndAccountAsync(db, user: opt.SysOperator, canLogin: false);
                // 3) Admin：可登入；只有「新建時」才設定密碼；存在就不覆蓋
                await UpsertPersonAndAccountAsync(db, user: opt.Admin, canLogin: true);
                await db.SaveChangesAsync();
                await tx.CommitAsync();
            }

            // ---- 初始角色權限資料 ----
            private static async Task UpsertRolePermissionAsync(ApplicationDbContext db)
            {
                var account = await db.Set<RoleDataModel>().FirstOrDefaultAsync(a => a.RoleId == "Admin");
                var isNew = account == null;
                if (isNew)
                {
                    account = new RoleDataModel
                    {
                        RoleId = "Admin",
                        RoleName = "系統管理員",
                        IsAdmin = true,
                        InternalId = Guid.NewGuid().ToString(),
                    };
                    await db.Set<RoleDataModel>().AddAsync(account);
                }
                await db.SaveChangesAsync();
            }

            // ---- 初始Admin/SysOperator帳號用戶 ----
            private static async Task UpsertPersonAndAccountAsync(ApplicationDbContext db, Account_DTO user, bool canLogin)
            {
                // 2-1) Person：以 UserId（或 UserName）對應一個人員；如你有別的映射規則請替換
                var person = await db.Set<PersonModel>().FirstOrDefaultAsync(p => p.PersonId == user.AccountId);
                if (person == null)
                {
                    person = new PersonModel
                    {
                        PersonId = user.AccountId,
                        PersonName = string.IsNullOrWhiteSpace(user.AccountName) ? user.AccountId : user.AccountName,
                        Email = string.Empty,
                        MobilePhone = string.Empty,
                        HomePhone = string.Empty,
                        InternalId = Guid.NewGuid().ToString(),
                    };
                    await db.Set<PersonModel>().AddAsync(person);
                }
                await db.SaveChangesAsync(); // 先保存以確保 Person.Id 可用
                // 2-2) Account：以 UserId 唯一識別
                var account = await db.Set<AccountModel>().FirstOrDefaultAsync(a => a.AccountId == user.AccountId);
                var isNew = account == null;
                if (isNew)
                {
                    (byte[] hash, byte[] salt, int ver) = canLogin ? PasswordHasher.Hash(user.Password) : (Array.Empty<byte>(), Array.Empty<byte>(), 0);
                    account = new AccountModel
                    {
                        AccountId = user.AccountId,
                        AccountName = user.AccountName,
                        PersonId = person.PersonId,
                        RoleId = user.RoleId,
                        PasswordHash = hash,
                        PasswordSalt = salt,
                        PasswordAlgoVer = ver,
                        AccountStatus = AccountStatus.Enable,
                        InternalId = Guid.NewGuid().ToString(),
                    };
                    await db.Set<AccountModel>().AddAsync(account);
                }
                await db.SaveChangesAsync();
            }

            /// <summary>
            /// 註冊網站資訊
            /// </summary>
            private static async Task RegistSiteIndex(IConfiguration cfg, ApplicationDbContext db)
            {
                var site = await db.Set<SiteMenu_IndexModel>().FirstOrDefaultAsync(p => p.SiteIndex == string.Empty);
                if (site != null) return;
                var section = cfg.GetSection("DbInit:Account:SysOperator");
                var SysOperator = section.Get<Account_DTO>();
                await using var tx = await db.Database.BeginTransactionAsync();
                var now = DateTime.Now;
                var root = new SiteMenu_IndexModel
                {
                    SiteIndex = string.Empty,
                    GoogleAnalytics = string.Empty,
                    Enable = true,
                    DefaultLang = LangCode.zhtw,//初始化一律先默認中文
                    SupportLangs = LangCodeJson.ToJsonArray(LangCode.zhtw, LangCode.en),
                    FormStatus = FormStatus.Saved,
                    DataStatus = DataStatus.Valid,
                    OrgLvId = string.Empty,
                    InternalId = Guid.NewGuid().ToString(),
                    IsIniData = true,
                    CreateTime = now,
                    ModifyTime = now,
                    CreateUserId = SysOperator.AccountId,
                    ModifyUserId = SysOperator.AccountId,
                };
                var rootDetail1 = new SiteMenu_IndexInfoModel
                {
                    // 這裡的屬性名稱請依你實際的 Model 調整
                    SiteIndex = root.SiteIndex,
                    RowId = 1,
                    Lang = LangCode.zhtw,
                    Title = string.Empty,
                    Description = string.Empty,
                    SiteHeader = string.Empty,
                    SiteFooter = string.Empty,
                    Keyword = string.Empty
                };

                var rootDetail2 = new SiteMenu_IndexInfoModel
                {
                    // 這裡的屬性名稱請依你實際的 Model 調整
                    SiteIndex = root.SiteIndex,
                    RowId = 2,
                    Lang = LangCode.en,
                    Title = string.Empty,
                    Description = string.Empty,
                    SiteHeader = string.Empty,
                    SiteFooter = string.Empty,
                    Keyword = string.Empty
                };
                await db.Set<SiteMenu_IndexModel>().AddAsync(root);
                await db.Set<SiteMenu_IndexInfoModel>().AddRangeAsync([rootDetail1, rootDetail2]);
                await db.SaveChangesAsync();
                await tx.CommitAsync();
            }
            /// <summary>
            /// 初始化萬年曆資料（從 NTPC 匯入）
            /// </summary>
            public static async Task RegistCalendar(IServiceProvider services)
            {
                using var scope = services.CreateScope();
                var svc = scope.ServiceProvider.GetRequiredService<IBizService<CalendarSet>>();
                if (svc is CalendarBiz calendarBiz) await calendarBiz.InitCalendar(CancellationToken.None);
            }
            #endregion
        }
        /// <summary>
        /// 取得「對外實際主機」：優先 X-Forwarded-Host，否則用 Request.Host
        /// </summary>
        /// <param name="ctx"></param>
        /// <returns></returns>
        private static string EffectiveHost(HttpContext ctx)
        {
            var fwd = ctx.Request.Headers["X-Forwarded-Host"].FirstOrDefault();
            var raw = !string.IsNullOrWhiteSpace(fwd) ? fwd : ctx.Request.Host.Value;
            return HostOnly(raw);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="hostPort"></param>
        /// <returns></returns>
        private static string HostOnly(string? hostPort)
        {
            if (string.IsNullOrWhiteSpace(hostPort)) return string.Empty;
            var h = hostPort.Trim();
            var i = h.IndexOf(':');
            return i >= 0 ? h[..i] : h;
        }

        private class AddAcceptLanguageHeaderOperationFilter : IOperationFilter
        {
            public void Apply(OpenApiOperation operation, OperationFilterContext context)
            {
                operation.Parameters ??= [];

                if (operation.Parameters.Any(p => p.In == ParameterLocation.Header && p.Name == "Accept-Language"))
                    return;

                operation.Parameters.Add(new OpenApiParameter
                {
                    Name = "Accept-Language",
                    In = ParameterLocation.Header,
                    Required = false,
                    Description = "i18n language (e.g. zh-TW / en)",
                    Schema = new OpenApiSchema
                    {
                        Type = "string",
                        Default = new OpenApiString("zh-TW")
                    }
                });
            }
        }

        private sealed class LoginRequestSchemaFilter : ISchemaFilter
        {
            // Swagger 顯示用：預填 Request body
            public void Apply(OpenApiSchema schema, SchemaFilterContext context)
            {
                // ✅ 只針對登入 DTO
                if (context.Type != typeof(LoginDto)) return;

                schema.Example = new OpenApiObject
                {
                    ["Account"] = new OpenApiString("Admin"),
                    ["Password"] = new OpenApiString("Z7](oRuh98Z3x1$")
                };
            }
        }
        /// <summary>
        /// 建立自訂的 400 驗證回應
        /// </summary>
        private static ApiResponse<string> BuildInvalidModelResponse(ActionContext context)
        {
            // 宣告變數
            ErrorHelper message = new();

            // 執行 function
            foreach (var item in context.ModelState.Where(x => x.Value?.Errors.Count > 0))
                AddInvalidModelMessage(context, message, item.Key);

            if (!message.Messages.Any())
                message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00035, "資料");

            // return
            return new ApiResponse<string>() { Data = [], SysMessage = message.Messages };
        }

        /// <summary>
        /// 依欄位驗證結果加入訊息
        /// </summary>
        private static void AddInvalidModelMessage(ActionContext context, ErrorHelper message, string key)
        {
            // 宣告變數
            var prop = FindModelProperty(context, key);
            var displayName = prop == null ? GetFieldName(key) : $"{I18nCache.GetLabel(prop)}【{key}】";
            var errorText = context.ModelState[key]?.Errors.FirstOrDefault()?.ErrorMessage ?? string.Empty;
            var maxLength = GetMaxLength(prop);
            // 執行 function
            if (maxLength.HasValue && !IsRequiredError(errorText))
            {
                message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00034, displayName, maxLength.Value);
                return;
            }
            message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00035, displayName);
        }

        /// <summary>
        /// 從 model key 反查實際 PropertyInfo
        /// </summary>
        private static PropertyInfo? FindModelProperty(ActionContext context, string key)
        {
            // 宣告變數
            if (context.ActionDescriptor is not ControllerActionDescriptor cad) return null;
            var cleanKey = Regex.Replace(key ?? string.Empty, @"\[\d+\]", string.Empty);

            // 執行 function
            foreach (var p in cad.MethodInfo.GetParameters())
            {
                var prop = TryResolveProperty(p.ParameterType, cleanKey, p.Name);
                if (prop != null) return prop;
            }

            // return
            return null;
        }

        /// <summary>
        /// 依照 key 路徑往下找欄位
        /// </summary>
        private static PropertyInfo? TryResolveProperty(Type rootType, string key, string? parameterName)
        {
            // 宣告變數
            var path = key;
            if (!string.IsNullOrWhiteSpace(parameterName) && path.StartsWith(parameterName + ".", StringComparison.OrdinalIgnoreCase))
                path = path[(parameterName.Length + 1)..];

            var segments = path.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length == 0) return null;

            Type currentType = rootType;
            PropertyInfo? currentProp = null;

            // 執行 function
            foreach (var seg in segments)
            {
                currentProp = currentType.GetProperties().FirstOrDefault(x => x.Name.Equals(seg, StringComparison.OrdinalIgnoreCase));
                if (currentProp == null) return null;
                currentType = GetPropertyType(currentProp.PropertyType);
            }

            // return
            return currentProp;
        }

        /// <summary>
        /// 取得實際欄位型別
        /// </summary>
        private static Type GetPropertyType(Type type)
        {
            // 宣告變數
            var realType = Nullable.GetUnderlyingType(type) ?? type;

            // 執行 function
            if (realType != typeof(string) && realType.IsGenericType && typeof(System.Collections.IEnumerable).IsAssignableFrom(realType))
                return realType.GetGenericArguments()[0];

            // return
            return realType;
        }

        /// <summary>
        /// 取得欄位長度限制
        /// </summary>
        private static int? GetMaxLength(PropertyInfo? prop)
        {
            // 宣告變數
            if (prop == null) return null;
            var stringLength = prop.GetCustomAttribute<StringLengthAttribute>();
            var maxLength = prop.GetCustomAttribute<MaxLengthAttribute>();

            // return
            if (stringLength != null) return stringLength.MaximumLength;
            return maxLength?.Length;
        }

        /// <summary>
        /// 取 model key 最後一段當欄位名
        /// </summary>
        private static string GetFieldName(string key)
        {
            // 宣告變數
            var cleanKey = Regex.Replace(key ?? string.Empty, @"\[\d+\]", string.Empty);
            var parts = cleanKey.Split('.', StringSplitOptions.RemoveEmptyEntries);

            // return
            return parts.LastOrDefault() ?? "欄位";
        }
        /// <summary>
        /// 簡單判斷是否為必填錯誤
        /// </summary>
        private static bool IsRequiredError(string errorText)
        {
            // return
            return errorText.Contains("required", StringComparison.OrdinalIgnoreCase)
                || errorText.Contains("請輸入", StringComparison.OrdinalIgnoreCase)
                || errorText.Contains("必填", StringComparison.OrdinalIgnoreCase);
        }
    }
}
