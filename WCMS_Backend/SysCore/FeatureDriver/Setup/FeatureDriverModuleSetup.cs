using WCMS.SysCore.Configuration;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Setup;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Repo;
using WCMS.SysCore.FeatureDriver.Repo.Graph;
using WCMS.SysCore.FeatureDriver.Repo.Operations.Query;
using WCMS.SysCore.FeatureDriver.Repo.Operations.Write;
namespace WCMS.SysCore.FeatureDriver.Setup;

/// <summary>
/// 集中註冊 WCMS API、Repository、Biz 與系統版本服務。
/// </summary>
internal static class FeatureDriverModuleSetup
{
    #region Public
    /// <summary>
    /// 註冊 FeatureDriver 共用服務與目前 Spec Biz。
    /// </summary>
    public static void AddServices(IServiceCollection services)
    {
        FeatureDriverApiSetup.AddServices(services);
        services.AddScoped(typeof(RepositoryQueryOperations<>), typeof(RepositoryQueryOperations<>));
        services.AddScoped(typeof(TrackedEntityResolver<>), typeof(TrackedEntityResolver<>));
        services.AddScoped(typeof(EntityChangeApplier<>), typeof(EntityChangeApplier<>));
        services.AddScoped(typeof(RepositoryWriteOperations<>), typeof(RepositoryWriteOperations<>));
        services.AddScoped(typeof(BasicRepository<>), typeof(BasicRepository<>));
        services.AddScoped<DbRepositoryProvider>();
        services.AddScoped<FormGraphRepoProvider>();
        services.AddScoped<BizDeps>();
        RegisterBizServices(services);
        RegisterSystemVersionService(services);
    }
    #endregion

    #region Private
    /// <summary>
    /// 反射註冊 Core、Feature 與目前 Spec 的 IBizService 實作。
    /// </summary>
    private static void RegisterBizServices(IServiceCollection services)
    {
        Type bizType = typeof(BizService<>);
        Type serviceType = typeof(IBizService<>);
        var pairs = typeof(Program).Assembly.GetTypes()
            .Where(type => !type.IsAbstract && !type.IsInterface && type != bizType)
            .SelectMany(type => type.GetInterfaces()
                .Where(item => item.IsGenericType && item.GetGenericTypeDefinition() == serviceType)
                .Select(item => new BizRegistration(item, type, type.Namespace ?? string.Empty)))
            .ToArray();
        RegisterFeatureBizServices(services, pairs);
        RegisterCoreBizServices(services, pairs);
        RegisterSpecBizServices(services, pairs);
    }
    /// <summary>
    /// 註冊標準 Features 內的 BizService。
    /// </summary>
    private static void RegisterFeatureBizServices(IServiceCollection services, IEnumerable<BizRegistration> pairs)
    {
        foreach (BizRegistration pair in pairs.Where(item => item.Namespace.StartsWith(SysParam.NamespacePrefixes.Features, StringComparison.Ordinal)))
            services.AddScoped(pair.Service, pair.Implementation);
    }
    /// <summary>
    /// 註冊 SysCore 與非 Spec 範圍的 BizService。
    /// </summary>
    private static void RegisterCoreBizServices(IServiceCollection services, IEnumerable<BizRegistration> pairs)
    {
        foreach (BizRegistration pair in pairs.Where(item =>
            !item.Namespace.StartsWith(SysParam.NamespacePrefixes.Features, StringComparison.Ordinal)
            && !SpecSettings.IsSpecFeaturesNamespace(item.Namespace)))
            services.AddScoped(pair.Service, pair.Implementation);
    }
    /// <summary>
    /// 註冊目前啟用 Spec 內的 BizService。
    /// </summary>
    private static void RegisterSpecBizServices(IServiceCollection services, IEnumerable<BizRegistration> pairs)
    {
        foreach (BizRegistration pair in pairs.Where(item => SpecSettings.IsCurrentSpecNamespace(item.Namespace)))
            services.AddScoped(pair.Service, pair.Implementation);
    }
    /// <summary>
    /// 註冊目前 Spec 可覆寫的系統版本服務。
    /// </summary>
    private static void RegisterSystemVersionService(IServiceCollection services)
    {
        Type serviceType = typeof(SystemVersion);
        Type implementationType = ResolveSpecSystemVersionType(serviceType) ?? serviceType;
        services.AddScoped(serviceType, implementationType);
    }
    /// <summary>
    /// 取得目前 Spec 提供的系統版本服務型別。
    /// </summary>
    private static Type? ResolveSpecSystemVersionType(Type serviceType)
    {
        return typeof(Program).Assembly.GetTypes().FirstOrDefault(type =>
            !type.IsAbstract
            && !type.IsInterface
            && type != serviceType
            && serviceType.IsAssignableFrom(type)
            && SpecSettings.IsCurrentSpecNamespace(type.Namespace ?? string.Empty));
    }
    /// <summary>
    /// 保存 Biz DI 掃描結果。
    /// </summary>
    private sealed record BizRegistration(Type Service, Type Implementation, string Namespace);
    #endregion
}
