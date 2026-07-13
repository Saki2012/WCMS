using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Globalization;
using System.IO.Compression;
using System.Reflection;
using System.Text.Json.Serialization.Metadata;
using System.Text.RegularExpressions;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Calendar;
using WCMS.Features.COMM.Person;
using WCMS.Features.IAM.Account;
using WCMS.Features.IAM.Auth;
using WCMS.Features.IAM.RolePermission;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.SysCore;
using WCMS.SysCore.AppSettingsOptions;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Api.Filter;
using WCMS.SysCore.FeatureDriver.Api.OpenApi;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Repo;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Observability.OperateLog;
using WCMS.SysCore.Persistence;
using WCMS.SysCore.Persistence.Diagnostics;
using WCMS.SysCore.PlatformServices.FileManagement;
using WCMS.SysCore.PlatformServices.Cache;
using WCMS.SysCore.PlatformServices.Cache.Stores;
using WCMS.SysCore.Security.Hardening;
using WCMS.SysCore.Security.Hardening.AccessControl;
using WCMS.SysCore.Security.IdentityAccess;
using WCMS.SysCore.Security.IdentityAccess.Authentication;
using WCMS.SysCore.SystemFunc.Captcha;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        SpecSettings.Init(builder.Configuration);
        HardeningSetup.ApplyHostSecurity(builder);
        AppSetup.BasicSetting(builder);
        AppSetup.AddConnections(builder.Services, builder.Configuration);
        AppSetup.AddCoreServices(builder.Services, builder.Configuration);
        AppSetup.AddAppSettingsOptions(builder.Services, builder.Configuration);
        HardeningSetup.AddServices(builder.Services, builder.Configuration);
        IdentityAccessSetup.AddServices(builder.Services, builder.Configuration);
        AppSetup.APIBehavior(builder.Services);
        //HardeningSetup.AddRateLimiting(builder.Services);
        AppSetup.AddDebugServices(builder);

        var app = builder.Build();
        app.UseMiddleware<ErrorHandlingMiddleware>();
        HardeningSetup.UseForwardedHeaders(app);
        app.UseCookiePolicy();
        HardeningSetup.UseSecurityHeaders(app, builder.Configuration);
        HardeningSetup.UseXsrfProtection(app, builder.Configuration);

        var supported = new[] { new CultureInfo("zh-TW"), new CultureInfo("en") };
        app.UseRequestLocalization(new RequestLocalizationOptions
        {
            DefaultRequestCulture = new RequestCulture("zh-TW"),
            SupportedCultures = supported,
            SupportedUICultures = supported,
            RequestCultureProviders = [new AcceptLanguageHeaderRequestCultureProvider()]
        });

        await AppSetup.InitDbSettingsAsync(app.Services, builder.Configuration, app.Environment);
        SwaggerAccessSetup.Use(app);
        HardeningSetup.UseProductionHsts(app);
        HardeningSetup.UseHttpsRedirection(app);

        using (var scope = app.Services.CreateScope())
        {
            var cacheStore = scope.ServiceProvider.GetRequiredService<IOutputCacheStore>();
            cacheStore.EvictByTagAsync(SysParam.OutputCacheTags.Permanent, default).GetAwaiter().GetResult();
        }

        app.UseCors(HardeningSetup.CorsPolicyName);
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
    /// ✅ 開發者修改指引：把「連線、注入、初始化」集中到這個類別，
    /// Identity Access 與弱掃防護分別集中到 IdentityAccessSetup 與 HardeningSetup。
    /// </summary>
    internal static class AppSetup
    {
        #region Services
        /// <summary>
        /// 註冊 IIS 與 API 回應壓縮設定。
        /// </summary>
        public static void BasicSetting(WebApplicationBuilder builder)
        {
            builder.WebHost.UseIIS();
            builder.Services.AddResponseCompression(options =>
            {
                options.EnableForHttps = true;
                options.MimeTypes = [SysParam.MediaTypes.ApplicationJson, SysParam.MediaTypes.TextJson];
                options.Providers.Clear();
                options.Providers.Add<BrotliCompressionProvider>();
                options.Providers.Add<GzipCompressionProvider>();
            });
            builder.Services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
            builder.Services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
        }
        /// <summary>
        /// 連線相關（SQL / Redis / 其他外部資源）
        /// </summary>
        public static void AddConnections(IServiceCollection services, IConfiguration cfg)
        {
            //暫時先不用Redis，等開始能架Docker包Linux後再來
            //services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(cfg.GetConnectionString(SysParam.Configuration.ConnectionStrings.RedisConnection)));

            var cs = cfg.GetConnectionString(SysParam.Configuration.ConnectionStrings.SqlConnection);
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
            services.AddScoped(typeof(BasicRepository<>), typeof(BasicRepository<>));
            services.AddScoped<DbRepositoryProvider>();
            services.AddScoped<FormGraphRepoProvider>();
            services.AddScoped<IErrorHelper, ErrorHelper>();
            services.AddScoped<IOperateLog, OperateLog>();
            services.AddScoped<BizDeps>();
            services.AddHttpClient();
            services.AddScoped<ICaptchaBiz, Captcha_BIZ>();
            RegisterBizServices(services);
            RegisterSystemVersionBiz(services);
            // 暫時先不用Redis，等開始能架Docker包Linux後再來
            //services.AddStackExchangeRedisOutputCache(o =>
            //{
            //    // 用你的連線字串；這會由擴充方法內部建立連線
            //    o.Configuration = cfg.GetConnectionString(SysParam.Configuration.ConnectionStrings.RedisConnection);
            //    o.InstanceName = "oc:";   // Redis key 前綴，避免與其他功能衝突
            //});

            services.AddOutputCache(options =>
            {
                // 清單快取
                options.AddPolicy(SysParam.OutputCachePolicies.ListCache, b => b
                    .Expire(TimeSpan.FromSeconds(60))
                    .SetVaryByQuery(SysParam.Wildcards.All)                    // 條件、分頁都影響快取
                    .SetVaryByHeader(SysParam.HttpHeaders.AcceptLanguage)
                    .Tag(SysParam.OutputCacheTags.List)                        // 共用 Tag
                );
                // 明細快取
                options.AddPolicy(SysParam.OutputCachePolicies.DetailCache, b => b
                    .Expire(TimeSpan.FromSeconds(60))
                    .SetVaryByQuery(SysParam.ApiQuery.InternalId)           // 按 QueryString 分片
                    .SetVaryByHeader(SysParam.HttpHeaders.AcceptLanguage)
                    .Tag(SysParam.OutputCacheTags.Detail)                      // 共用 Tag
                );
                // 永久參數
                options.AddPolicy(SysParam.OutputCachePolicies.PermanentCache, b => b
                    .Expire(TimeSpan.FromDays(365))
                    .SetVaryByHeader(SysParam.HttpHeaders.AcceptLanguage)
                    .Tag(SysParam.OutputCacheTags.Permanent));
            });


            services.AddMemoryCache();
            services.Configure<CacheSettings>(cfg.GetSection(CacheSettings.SectionName));
            services.AddSingleton<ILocalCacheStore, MemoryCacheStore>();
            services.AddSingleton<IDistributedCacheStore, DistributedCacheStore>();
            services.AddSingleton<ICacheRoute, CacheRoute>();
            services.AddSingleton<CacheService>();
        }
        /// <summary>
        /// 反射註冊 BizService。
        /// </summary>
        private static void RegisterBizServices(IServiceCollection services)
        {
            var asm = typeof(Program).Assembly;
            var biz = typeof(BizService<>);
            var ibiz = typeof(IBizService<>);

            var pairs = asm.GetTypes().Where(t => !t.IsAbstract && !t.IsInterface && t != biz).SelectMany(t => t.GetInterfaces().Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == ibiz).Select(i => new
            {
                Service = i,
                Impl = t,
                Ns = t.Namespace ?? string.Empty
            })).ToList();
            foreach (var p in pairs.Where(p => p.Ns.StartsWith(SysParam.NamespacePrefixes.Features, StringComparison.Ordinal))) services.AddScoped(p.Service, p.Impl);
            foreach (var p in pairs.Where(p => !p.Ns.StartsWith(SysParam.NamespacePrefixes.Features, StringComparison.Ordinal) && !SpecSettings.IsSpecFeaturesNamespace(p.Ns))) services.AddScoped(p.Service, p.Impl);
            foreach (var p in pairs.Where(p => SpecSettings.IsCurrentSpecNamespace(p.Ns))) services.AddScoped(p.Service, p.Impl);
            services.AddScoped<IAuthService, AuthBiz>();
        }

        /// <summary>
        /// 註冊系統版本服務。
        /// </summary>
        private static void RegisterSystemVersionBiz(IServiceCollection services)
        {
            Type serviceType = typeof(SystemVersion);
            Type implType = GetCurrentSpecSystemVersionBizType() ?? serviceType;
            services.AddScoped(serviceType, implType);
        }
        /// <summary>
        /// 取得目前 Spec 的系統版本服務型別。
        /// </summary>
        private static Type? GetCurrentSpecSystemVersionBizType()
        {
            Type serviceType = typeof(SystemVersion);
            Type? specBizType = typeof(Program).Assembly.GetTypes().FirstOrDefault(t => !t.IsAbstract && !t.IsInterface && t != serviceType && serviceType.IsAssignableFrom(t) && SpecSettings.IsCurrentSpecNamespace(t.Namespace ?? string.Empty));
            return specBizType;
        }
        /// <summary>
        /// 取得目前 SysCore 與 Spec 組合後的後端版本號。
        /// </summary>
        private static string GetCurrentBackendVersion()
        {
            Type serviceType = typeof(SystemVersion);
            Type implType = GetCurrentSpecSystemVersionBizType() ?? serviceType;
            var versionBiz = Activator.CreateInstance(implType) as SystemVersion
                ?? throw new InvalidOperationException($"無法建立系統版本服務：{implType.FullName}");
            return versionBiz.GetBackendVersion();
        }

        /// <summary>
        /// Development-only服務（如 Swagger）
        /// </summary>
        /// <param name="builder"></param>
        public static void AddDebugServices(WebApplicationBuilder builder)
        {
            //if (builder.Environment.IsDevelopment())
            //{
            AppContext.SetSwitch(SysParam.RuntimeSwitches.JsonReflectionEnabled, true);
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.OperationFilter<AddAcceptLanguageHeaderOperationFilter>();
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "WCMS API", Version = GetCurrentBackendVersion() });
                c.AddWcmsSchemaFilters();
                // 加上這段才會有 Authorize 按鈕
                c.AddWcmsBearerSecurity();
#if DEBUG
                c.SchemaFilter<LoginRequestSchemaFilter>();
#endif
            });
            //}
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
            services.Configure<FilePathOptions>(cfg.GetSection(SysParam.Configuration.Sections.FilePaths));
            services.Configure<CaptchaOptions>(cfg.GetSection(SysParam.Configuration.Sections.Captcha));
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
            await PersistenceInitializer.EnsureDbSpecCodeAsync(db);
            // 宣告變數：判斷是否執行其他初始化資料
            var enabled = cfg.GetValue(SysParam.Configuration.DbInit.EnabledPath, true);
            if (!enabled) return;
            // 執行初始化：註冊 UDF 與必要系統資料
            await PersistenceInitializer.RegistUDFAsync(cfg, env, db);
            await RegistSysAccountAsync(cfg, db);
            await RegistSiteIndex(cfg, db);
            await RegistCalendar(services);
        }
        private sealed class AccountsSeedRoot
        {
            public AccountSeedSetting SysOperator { get; init; } = new();
            public AccountSeedSetting Admin { get; init; } = new();
        }
        /// <summary>
        /// 資料庫初始化帳號設定。
        /// </summary>
        private sealed class AccountSeedSetting
        {
            public string AccountId { get; init; } = string.Empty;
            public string AccountName { get; init; } = string.Empty;
            public string Password { get; init; } = string.Empty;
            public string RoleId { get; init; } = string.Empty;
        }
        /// <summary>
        /// 註冊系統用戶
        /// </summary>
        private static async Task RegistSysAccountAsync(IConfiguration cfg, ApplicationDbContext db)
        {
            var section = cfg.GetSection(SysParam.Configuration.DbInit.AccountPath);
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
        private static async Task UpsertPersonAndAccountAsync(ApplicationDbContext db, AccountSeedSetting user, bool canLogin)
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
            var section = cfg.GetSection(SysParam.Configuration.DbInit.SysOperatorPath);
            var sysOperator = section.Get<AccountSeedSetting>()
                ?? throw new InvalidOperationException("DbInit:Account:SysOperator 尚未設定。");
            await using var tx = await db.Database.BeginTransactionAsync();
            var now = DateTime.Now;
            var root = new SiteMenu_IndexModel
            {
                SiteIndex = string.Empty,
                GoogleAnalytics = string.Empty,
                Enable = true,
                DefaultLang = LangCode.zhtw,//初始化一律先默認中文
                SupportLangs = LangCodeJson.ToJsonArray(LangCode.zhtw, LangCode.en),

                InternalId = Guid.NewGuid().ToString(),
                IsIniData = true,
                CreateTime = now,
                ModifyTime = now,
                CreateUserId = sysOperator.AccountId,
                ModifyUserId = sysOperator.AccountId,
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
            var svc = scope.ServiceProvider.GetRequiredService<BizService<CalendarModel>>();
            if (svc is CalendarBiz calendarBiz) await calendarBiz.InitCalendar(CancellationToken.None);
        }
        #endregion
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
        var prop = FindModelProperty(context, key);
        var displayName = prop == null ? GetFieldName(key) : $"{I18nCache.GetLabel(prop)}";
        var errorText = context.ModelState[key]?.Errors.FirstOrDefault()?.ErrorMessage ?? string.Empty;
        var maxLength = GetMaxLength(prop);
        if (maxLength.HasValue && !IsRequiredError(errorText)) message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00034, displayName, maxLength.Value);
        else message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00035, displayName);
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
