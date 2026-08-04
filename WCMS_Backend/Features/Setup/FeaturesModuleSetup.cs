using WCMS.Features.COMM.Setup;
using WCMS.Features.IAM.Auth;
using WCMS.Features.IAM.RolePermission;
using WCMS.Features.IAM.Setup;
using WCMS.Features.Setup.Migration;
using WCMS.Features.WEB.Setup;
using WCMS.SysCore.Configuration.Startup;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;

namespace WCMS.Features.Setup;

/// <summary>
/// 集中註冊標準 Features 專屬服務與啟動初始化工作。
/// </summary>
internal static class FeaturesModuleSetup
{
    #region Public
    /// <summary>
    /// 註冊 IAM、WEB、COMM 與 Feature 專屬服務。
    /// </summary>
    public static void AddServices(IServiceCollection services)
    {
        services.AddScoped<AuthBiz>();
        services.AddScoped<IPermissionCache, PermissionCache>();
        services.AddSingleton<IProgMetadataRegistry, ProgMetadataRegistry>();
        services.AddSingleton<RolePermissionCatalogCache>();
        services.AddScoped<IApplicationStartupTask, ProgMetadataStartupTask>();
        IamModuleSetup.AddServices(services);
        WebModuleSetup.AddServices(services);
        CommonModuleSetup.AddServices(services);
        OldDataMigrationSetup.AddServices(services);
    }
    #endregion
}
