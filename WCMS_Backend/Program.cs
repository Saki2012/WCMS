using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
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
using System.Threading.RateLimiting;
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
            AppSetup.AddRateLimit(builder.Services);
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
                KnownProxies = { IPAddress.Loopback, IPAddress.IPv6Loopback, IPAddress.Parse("127.0.0.1") },
                RequireHeaderSymmetry = false,
            });
            
            // 安全標頭（弱掃友好）
            AppSetup.UseSecurityHeaders(app, builder.Configuration);
            AppSetup.UseSecurityXSRF(app, builder.Configuration);
            // Swagger 僅開發期
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                // 只允許本機打 /swagger/*
                app.UseWhen(ctx => ctx.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase),sub => sub.Use(async (ctx, next) =>
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

            app.UseCookiePolicy(new CookiePolicyOptions
            {
                MinimumSameSitePolicy = SameSiteMode.Strict,
                HttpOnly = HttpOnlyPolicy.None,
                Secure = CookieSecurePolicy.Always
            });
            // CORS 放在 Auth 前
            app.UseCors(AppSetup.CorsPolicyName);
            app.UseOutputCache();
            app.UseResponseCompression();

            app.UseRateLimiter();
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
                    if(builder.Environment.IsProduction()) o.ListenLocalhost(5624);// 後端只聽本機（IIS/Nginx 反向 Proxy）
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
                services.AddScoped<IErrorHelper, ErrorHelper>();
                services.AddScoped<IOperateLog, OperateLog>();

                
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
                    opt.Cookie.SameSite = SameSiteMode.Strict;  // 代理 + HTTPS
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
                            context.HttpContext.Response.Headers.RetryAfter = "300";
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
            /// 安全標頭（弱掃友好）– 若有 CSP 衝突，再放寬
            /// </summary>
            public static void UseSecurityHeaders(WebApplication app, IConfiguration cfg)
            {

                var beHosts = (cfg.GetSection("Whitelist:Backend").Get<string[]>() ?? []).Select(HostOnly).ToHashSet(StringComparer.OrdinalIgnoreCase);

                app.Use(async (ctx, next) =>
                {
                    ctx.Response.Headers.XContentTypeOptions = "nosniff";
                    ctx.Response.Headers.XFrameOptions = "DENY";
                    ctx.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                    ctx.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), fullscreen=(self)";
                    ctx.Response.Headers.StrictTransportSecurity = "max-age=31536000";

                    if (ctx.Request.Path.StartsWithSegments("/Service"))
                    {
                        // API：超嚴 CSP（不影響 JSON/檔案傳輸）
                        ctx.Response.Headers.ContentSecurityPolicy =
                        "default-src 'none'; script-src 'none'; connect-src 'self'; img-src 'none'; " +
                        "style-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; " +
                        "frame-ancestors 'none'; form-action 'self'; require-trusted-types-for 'script'";
                    }
                    else
                    {
                        // 非 API（真的有 HTML 才需要）
                        // 先保留你現有策略，之後有需要再做 nonce 化
                        ctx.Response.Headers.ContentSecurityPolicy = "default-src 'self'; img-src 'self' data:; style-src 'self'";
                    }

                    if (app.Environment.IsProduction() && beHosts.Count > 0)
                    {
                        // ⬇️ 新增：本機請求直接放行（避免 403）
                        var effectiveHost = EffectiveHost(ctx); // 支援代理的 X-Forwarded-Host
                        var isLoopback = ctx.Connection.RemoteIpAddress is IPAddress ip && IPAddress.IsLoopback(ip);
                        if (!isLoopback && !beHosts.Contains(effectiveHost))
                        {
                            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                            return;
                        }
                    }

                    await next();
                });
            }

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
                    bool isWrite =
                        HttpMethods.IsPost(ctx.Request.Method) || HttpMethods.IsPut(ctx.Request.Method) ||
                        HttpMethods.IsDelete(ctx.Request.Method) || HttpMethods.IsPatch(ctx.Request.Method);

                    // 來源判斷：Referer 指向本機 swagger，或 Origin 是 http://127.0.0.1
                    string referer = ctx.Request.Headers.Referer.ToString();
                    string origin = ctx.Request.Headers.Origin.ToString();
                    bool fromLocalSwagger =
                        isLocal &&
                        (referer.Contains("http://127.0.0.1/swagger", StringComparison.OrdinalIgnoreCase) ||
                         origin.Equals("http://127.0.0.1", StringComparison.OrdinalIgnoreCase));

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
        private static string HostOnly(string? hostPort)
        {
            if (string.IsNullOrWhiteSpace(hostPort)) return string.Empty;
            var h = hostPort.Trim();
            var i = h.IndexOf(':');
            return i >= 0 ? h[..i] : h;
        }
        private static Uri? TryParseUri(string? s) => !string.IsNullOrWhiteSpace(s) && Uri.TryCreate(s, UriKind.Absolute, out var u) ? u : null;
    }
}
