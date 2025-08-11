
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.OutputCaching.StackExchangeRedis;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using System.IdentityModel.Tokens.Jwt;
using System.IO.Compression;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization.Metadata;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Middleware;
using WCMS.SysCore.SystemFunc.Auth;
using WCMS.SysCore.SystemFunc.FileManagement;

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
            // ④ 安全性（CORS/安全標頭/Anti-forgery）
            AppSetup.AddSecurityServices(builder.Services, builder.Configuration);
            // ⑤ 認證/授權（JWT）– 請在 appsettings 的 Jwt 節調整
            AppSetup.AddJwtAuthentication(builder.Services, builder.Configuration);
            AppSetup.AddAppCookie(builder.Services);
            // 開發期 Swagger（產線預設關）
            AppSetup.AddDebugServices(builder);

            var app = builder.Build();
            // 全域錯誤攔截（你原本已有）
            app.UseMiddleware<ErrorHandlingMiddleware>();
            app.UseOutputCache();
            // 反向 Proxy/負載平衡（IIS/Nginx/K8s）常見需求
            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
                //KnownProxies = { System.Net.IPAddress.Loopback }
            });
            // 產線請確保有 HTTPS（若由前置 Proxy 終結 TLS，保留這行也 OK）
            app.UseHttpsRedirection();
            // 安全標頭（弱掃友好）
            AppSetup.UseSecurityHeaders(app);
            // Swagger 僅開發期
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else 
            {
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
                services.Configure<FilePathOptions>(cfg.GetSection("FilePaths"));
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
                services.AddAntiforgery(); // 若 /auth/refresh 使用 Cookie，建議搭配 CSRF 驗證

                // CORS：只允許本機與你的網域。要再加網域請到 appsettings 或改這裡。
                services.AddCors(options =>
                {
                    options.AddPolicy(CorsPolicyName, policy =>
                    {
                        policy.SetIsOriginAllowed(origin =>
                        {
                            var host = new Uri(origin).Host;
                            return host == "localhost" || host == "127.0.0.1" || host == "wcms.it-easygoapp.com" || host == "wcms_service.it-easygoapp.com";
                        })
                        .WithHeaders("Content-Type", "Authorization", "X-CSRF-Token")
                        .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
                        .WithOrigins("http://localhost:5173", "https://localhost:5173", "http://localhost:5174", "https://localhost:5174")
                        .AllowAnyHeader().AllowAnyMethod().AllowCredentials();
                        ;
                    });
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
                if (builder.Environment.IsDevelopment())
                {
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
                }
            }
            #endregion

            #region App
            /// <summary>
            /// 安全標頭（弱掃友好）– 若有 CSP 衝突，再放寬
            /// </summary>
            public static void UseSecurityHeaders(WebApplication app)
            {
                app.Use(async (ctx, next) =>
                {
                    ctx.Response.Headers.XContentTypeOptions = "nosniff";
                    ctx.Response.Headers.XFrameOptions = "DENY";
                    ctx.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                    ctx.Response.Headers["Permissions-Policy"] = "geolocation=()";
                    ctx.Response.Headers.ContentSecurityPolicy = app.Environment.IsDevelopment()
                    ? "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'"
                    : "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'";

                    if (app.Environment.IsProduction())
                    {
                        var host = ctx.Request.Host.Host;
                        if (!string.Equals(host, "wcms.it-easygoapp.com", StringComparison.OrdinalIgnoreCase)
                            && !string.Equals(host, "wcms_service.it-easygoapp.com", StringComparison.OrdinalIgnoreCase))
                        {
                            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
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
