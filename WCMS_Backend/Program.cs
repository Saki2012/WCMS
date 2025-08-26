
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using System.IdentityModel.Tokens.Jwt;
using System.IO.Compression;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization.Metadata;
using WCMS.SysCore;
using WCMS.SysCore.AppSettingsOptions;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Middleware;
using WCMS.SysCore.SystemFunc.Auth;

namespace WCMS
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
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
            // 開發期 Swagger（產線預設關）
            AppSetup.AddDebugServices(builder);
            ///啟動時自動建立資料夾
            //builder.Services.AddHostedService<EnsureStorageFoldersHostedService>();

            var app = builder.Build();
            // 全域錯誤攔截（你原本已有）
            app.UseMiddleware<ErrorHandlingMiddleware>();
            // 反向 Proxy/負載平衡（IIS/Nginx/K8s）常見需求
            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost,
                //KnownProxies = { System.Net.IPAddress.Loopback }
                //KnownNetworks = { },
                //KnownProxies = { }
            });
            // 產線請確保有 HTTPS（若由前置 Proxy 終結 TLS，保留這行也 OK）
            //app.UseHttpsRedirection();
            // 安全標頭（弱掃友好）
            AppSetup.UseSecurityHeaders(app, builder.Configuration);
            //AppSetup.UseSecurityCSRF(app, builder.Configuration);
            // Swagger 僅開發期
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else 
            {
                app.UseWhen(ctx =>
                {
                    var ip = ctx.Connection.RemoteIpAddress;
                    return ip is not null && IPAddress.IsLoopback(ip);
                },
                branch =>
                {
                    branch.UseSwagger();
                    branch.UseSwaggerUI();
                });
                app.UseHsts();
            }
            using (var scope = app.Services.CreateScope())
            {
                var cacheStore = scope.ServiceProvider.GetRequiredService<IOutputCacheStore>();
                cacheStore.EvictByTagAsync("perm", default).GetAwaiter().GetResult();
            }

            app.UseCookiePolicy(new CookiePolicyOptions {MinimumSameSitePolicy = SameSiteMode.None,Secure = CookieSecurePolicy.Always});
            // CORS 放在 Auth 前
            app.UseCors(AppSetup.CorsPolicyName);
            app.UseOutputCache();
            app.UseResponseCompression();

            app.UseAuthentication();
            app.UseAuthorization();
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

                services.AddDbContextPool<ApplicationDbContext>(opt =>
                {
                    opt.UseSqlServer(cfg.GetConnectionString("SqlConnection"));
                    opt.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking); // 讀取預設不追蹤
                });

            }
            /// <summary>
            /// 核心服務/DI（Controller、Repository、Biz）
            /// </summary>
            public static void AddCoreServices(IServiceCollection services, IConfiguration cfg)
            {
                services.AddControllers().AddJsonOptions(opt =>
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
                    options.AddPolicy("ListJson", b => b
                        .Expire(TimeSpan.FromSeconds(60))
                        .SetVaryByQuery("*")                    // 條件、分頁都影響快取
                        .SetVaryByHeader(LangHeader)
                        .Tag("set:list")                        // 共用 Tag
                    );
                    // 明細快取
                    options.AddPolicy("DetailJson", b => b
                        .Expire(TimeSpan.FromSeconds(60))
                        .SetVaryByQuery("internalId")           // 按 QueryString 分片
                        .SetVaryByHeader(LangHeader)
                        .Tag("set:detail")                      // 共用 Tag
                    );
                    // 永久參數
                    options.AddPolicy("PermanentJson", b => b
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
                    o.Cookie.Name = "xsrf";          // HttpOnly = false 預設，給前端可讀
                    o.HeaderName = "X-XSRF-TOKEN";   // 前端送在這個 header
                });
                var whitelist = cfg.GetSection("Whitelist:Frontend").Get<string[]>();

                // CORS：只允許本機與你的網域。要再加網域請到 appsettings 或改這裡。
                services.AddCors(options =>
                {
                    options.AddPolicy(CorsPolicyName, policy =>
                    {
                        policy
                        .WithOrigins(whitelist!)
                        .WithHeaders("Content-Type", "X-XSRF-TOKEN", "X-CSRF-Token", "Authorization", "X-Requested-With", "Access-Control-Allow-Origin")
                        .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                        .AllowCredentials();
                        ;
                    });
                });

                services.AddHsts(o =>
                {
                    o.Preload = false;
                    o.IncludeSubDomains = false;
                    o.MaxAge = TimeSpan.FromDays(30); // 先短期，避免鎖死
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
                    opt.Cookie.SameSite = SameSiteMode.None;  // 代理 + HTTPS
                    opt.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                    //opt.Cookie.Domain = "wcms.it-easygoapp.com"; // 同網域可省略，但建議固定
                });
            }

            /// <summary>
            /// 反射註冊 BizService
            /// </summary>
            private static void RegisterBizServices(IServiceCollection services)
            {
                var bizServiceType = typeof(BizService<>);
                var ibizServiceType = typeof(IBizService<>);
                var pairs = typeof(Program).Assembly.GetTypes()
                    .Where(t => !t.IsAbstract && !t.IsInterface && t != bizServiceType)
                    .SelectMany(t => t.GetInterfaces()
                        .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == ibizServiceType)
                        .Select(i => new { Service = i, Impl = t }));

                foreach (var p in pairs) services.AddScoped(p.Service, p.Impl);
                //添加登入服務
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
                    });
                //}
            }

            public static void APIBehavior(IServiceCollection services)
            {
                services.Configure<ApiBehaviorOptions>(opt =>
                {
                    opt.InvalidModelStateResponseFactory = context =>
                    {
                        // 只回必要訊息，避免把欄位結構或堆疊訊息洩漏出去
                        var errors = context.ModelState
                            .Where(kvp => kvp.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                            );

                        return new BadRequestObjectResult(new
                        {
                            message = "輸入格式不正確",
                            errors
                        });
                    };
                });
            }

            public static void AddAppSettingsOptions(IServiceCollection services, IConfiguration cfg)
            {
                services.Configure<FilePathOptions>(cfg.GetSection("FilePaths"));
                services.Configure<WhitelistOptions>(cfg.GetSection("Whitelist"));
            }
            #endregion

            #region App
            /// <summary>
            /// 安全標頭（弱掃友好）– 若有 CSP 衝突，再放寬
            /// </summary>
            public static void UseSecurityHeaders(WebApplication app,IConfiguration cfg)
            {

                var whitelist = cfg.GetSection("Whitelist:Backend").Get<string[]>();

                app.Use(async (ctx, next) =>
                {
                    ctx.Response.Headers.XContentTypeOptions = "nosniff";
                    ctx.Response.Headers.XFrameOptions = "DENY";
                    ctx.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                    ctx.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), fullscreen=(self)";
                    ctx.Response.Headers.ContentSecurityPolicy = app.Environment.IsDevelopment()
                    ? "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'"
                    : "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'";

                    if (app.Environment.IsProduction())
                    {
                        // ⬇️ 新增：本機請求直接放行（避免 403）
                        var ip = ctx.Connection.RemoteIpAddress;
                        var isLoopback = ip is not null && IPAddress.IsLoopback(ip);
                        var host = ctx.Request.Host.Host;
                        var allowed = whitelist;

                        if (!IPAddress.IsLoopback(ctx.Connection.RemoteIpAddress) && !allowed.Contains(host, StringComparer.OrdinalIgnoreCase))
                        {
                            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                            return;
                        }
                    }

                    await next();
                });
            }

            public static void UseSecurityCSRF(WebApplication app, IConfiguration cfg)
            {
                var whitelist = cfg.GetSection("Whitelist:Frontend").Get<string[]>();

                app.Use(async (ctx, next) =>
                {
                    var path = ctx.Request.Path.Value ?? "";
                    var method = ctx.Request.Method;
                    bool isApi = path.StartsWith("/Service/", StringComparison.OrdinalIgnoreCase);
                    bool isUnsafe = !HttpMethods.IsGet(method) && !HttpMethods.IsHead(method) && !HttpMethods.IsOptions(method);
                    bool hasOurCookie = ctx.Request.Cookies.ContainsKey("access"); // 你用 Cookie 存 JWT

                    // 1) 在 GET 時發 token（同時把 request token 種成前端可讀 cookie）
                    if (HttpMethods.IsGet(method) && isApi)
                    {
                        var af = ctx.RequestServices.GetRequiredService<IAntiforgery>();
                        var tokens = af.GetAndStoreTokens(ctx); // 會種伺服器用的 xsrf cookie

                        if (!string.IsNullOrEmpty(tokens.RequestToken))
                        {
                            ctx.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken, new CookieOptions
                            {
                                HttpOnly = false,                      // 前端要讀來塞 header
                                Secure = true,
                                SameSite = SameSiteMode.None,          // 與後端不同網域需要 None
                                Path = "/"
                            });
                        }
                    }

                    // 2) 只有「會改資料」且「走受保護 API」時才驗證 CSRF
                    if (isApi && isUnsafe && hasOurCookie)
                    {
                        // 先做 Origin/Referer 白名單
                        var allowed = whitelist ?? [];
                        var origin = ctx.Request.Headers.Origin.FirstOrDefault();
                        var referer = ctx.Request.Headers.Referer.FirstOrDefault();

                        bool passOrigin = !string.IsNullOrEmpty(origin) && allowed.Any(h => origin.Contains(h, StringComparison.OrdinalIgnoreCase));
                        bool passReferer = !string.IsNullOrEmpty(referer) && allowed.Any(h => referer.Contains(h, StringComparison.OrdinalIgnoreCase));
                        if (!passOrigin && !passReferer)
                        {
                            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                            await ctx.Response.WriteAsJsonAsync(new { success = false, message = "Invalid Origin/Referer." });
                            return;
                        }

                        // 驗證 XSRF（需要 xsrf cookie + X-XSRF-TOKEN header ）
                        try
                        {
                            var af = ctx.RequestServices.GetRequiredService<IAntiforgery>();
                            await af.ValidateRequestAsync(ctx);
                        }
                        catch
                        {
                            ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
                            await ctx.Response.WriteAsJsonAsync(new { success = false, message = "Invalid XSRF token." });
                            return;
                        }
                    }

                    await next();
                });
            }
            #endregion
        }
    }
}
