using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using WCMS.Features.IAM.Auth;
using WCMS.Features.Setup;
using WCMS.SysCore.Auditing;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.Configuration.Startup;
using WCMS.SysCore.FeatureDriver.Setup;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Persistence;
using WCMS.SysCore.PlatformServices.Cache;
using WCMS.SysCore.PlatformServices.Setup;
using WCMS.SysCore.Security.Hardening;
using WCMS.SysCore.Security.Hardening.AccessControl;
using WCMS.SysCore.Security.IdentityAccess;
namespace WCMS;

/// <summary>
/// WCMS 後端應用程式啟動入口。
/// </summary>
public class Program
{
    #region Public
    /// <summary>
    /// 註冊服務、建立 Middleware Pipeline 並啟動 WCMS API。
    /// </summary>
    public static async Task Main(string[] args)
    {
        WebApplicationBuilder builder = WebApplication.CreateBuilder(args);
        SpecSettings.Init(builder.Configuration);
        HardeningSetup.ApplyHostSecurity(builder);
        PlatformServicesModuleSetup.AddServices(builder);
        PersistenceModuleSetup.AddServices(builder.Services, builder.Configuration);
        FeatureDriverModuleSetup.AddServices(builder.Services);
#if DEBUG
        AddSwaggerLoginExample(builder.Services);
#endif
        CacheModuleSetup.AddServices(builder.Services, builder.Configuration);
        AuditingModuleSetup.AddServices(builder.Services);
        FeaturesModuleSetup.AddServices(builder.Services);
        HardeningSetup.AddServices(builder.Services, builder.Configuration);
        IdentityAccessSetup.AddServices(builder.Services, builder.Configuration);
        WebApplication app = builder.Build();
        ConfigurePipeline(app, builder.Configuration);
        await ApplicationStartupInitializer.InitializeAsync(app.Services);
        await app.RunAsync();
    }
    #endregion

    #region Private
    /// <summary>
    /// 依安全、語系、授權與 API 順序建立 HTTP Pipeline。
    /// </summary>
    private static void ConfigurePipeline(WebApplication app, IConfiguration configuration)
    {
        app.UseMiddleware<ErrorHandlingMiddleware>();
        HardeningSetup.UseForwardedHeaders(app);
        app.UseCookiePolicy();
        HardeningSetup.UseSecurityHeaders(app, configuration);
        HardeningSetup.UseXsrfProtection(app, configuration);
        I18nModuleSetup.UseRequestLocalization(app);
        SwaggerAccessSetup.Use(app);
        HardeningSetup.UseProductionHsts(app);
        HardeningSetup.UseHttpsRedirection(app);
        app.UseCors(HardeningSetup.CorsPolicyName);
        app.UseResponseCompression();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseOutputCache();
        app.MapControllers();
    }
#if DEBUG
    /// <summary>
    /// 註冊 Swagger 登入 Request Body 的既有開發範例。
    /// </summary>
    private static void AddSwaggerLoginExample(IServiceCollection services)
    {
        services.Configure<SwaggerGenOptions>(options => options.SchemaFilter<LoginRequestSchemaFilter>());
    }
    /// <summary>
    /// 提供 Swagger 登入 Request Body 的既有開發範例。
    /// </summary>
    private sealed class LoginRequestSchemaFilter : ISchemaFilter
    {
        /// <summary>
        /// 僅替登入 DTO 設定 Swagger Request 範例。
        /// </summary>
        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            if (context.Type != typeof(LoginDto)) return;
            schema.Example = new OpenApiObject
            {
                ["Account"] = new OpenApiString("Admin"),
                ["Password"] = new OpenApiString("Z7](oRuh98Z3x1$")
            };
        }
    }
#endif
    #endregion
}
