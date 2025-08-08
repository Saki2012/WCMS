
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using StackExchange.Redis;
using System.Reflection;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Middleware;
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
            // 開發期 Swagger（產線預設關）
            AppSetup.AddDebugServices(builder);

            var app = builder.Build();
            // 全域錯誤攔截（你原本已有）
            app.UseMiddleware<ErrorHandlingMiddleware>();
            // 反向 Proxy/負載平衡（IIS/Nginx/K8s）常見需求
            app.UseForwardedHeaders(new ForwardedHeadersOptions { ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto });
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
                builder.WebHost.UseKestrel(o => o.AddServerHeader = false); // 移除 Server 標頭（弱掃友好）
                builder.Services.AddResponseCompression();                   // 回應壓縮（可關閉或微調）
            }
            /// <summary>
            /// 連線相關（SQL / Redis / 其他外部資源）
            /// </summary>
            public static void AddConnections(IServiceCollection services, IConfiguration cfg)
            {
                services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(cfg.GetConnectionString("RedisConnection")));
                services.AddDbContext<ApplicationDbContext>(opt => opt.UseSqlServer(cfg.GetConnectionString("SqlConnection")));
            }
            /// <summary>
            /// 核心服務/DI（Controller、Repository、Biz）
            /// </summary>
            public static void AddCoreServices(IServiceCollection services, IConfiguration cfg)
            {
                services.AddControllers().AddJsonOptions(opt => { opt.JsonSerializerOptions.PropertyNamingPolicy = null; });
                // Repository
                services.AddScoped(typeof(IBasicRepository<>), typeof(BasicRepository<>));
                services.AddScoped<IRepositoryMapProvider, RepositoryMapProvider>();
                services.Configure<FilePathOptions>(cfg.GetSection("FilePaths"));
                RegisterBizServices(services);
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
                            return host == "localhost" || host == "127.0.0.1" || host == "wcms.it-easygoapp.com";
                        })
                        .AllowAnyHeader().AllowAnyMethod().AllowCredentials();
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
            }
            /// <summary>
            /// Development-only服務（如 Swagger）
            /// </summary>
            /// <param name="builder"></param>
            public static void AddDebugServices(WebApplicationBuilder builder)
            {
                if (builder.Environment.IsDevelopment())
                {
                    builder.Services.AddEndpointsApiExplorer();
                    builder.Services.AddSwaggerGen();
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
                    // 初期較保守的 CSP；若有第三方資源，再定點放寬
                    ctx.Response.Headers.ContentSecurityPolicy = "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'";
                    await next();
                });
            }
            #endregion
        }
    }
}
