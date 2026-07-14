using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.DependencyInjection.Extensions;
using WCMS.Features.IAM.RolePermission;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Serialization;
using WCMS.SysCore.FeatureDriver.Model.MetaData;
using WCMS.SysCore.FeatureDriver.Repo.Cache;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.PlatformServices.Cache.Output;
using WCMS.SysCore.PlatformServices.Cache.Stores;

namespace WCMS.SysCore.PlatformServices.Cache;

/// <summary>
/// 集中註冊 WCMS 共用 Cache 主線、Runtime Cache 與 OutputCache Store。
/// </summary>
internal static class CacheModuleSetup
{
    #region Public
    /// <summary>
    /// 註冊 WCMS 共用 Cache 模組與應用程式 Cache。
    /// </summary>
    public static void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        AddCacheSettings(services, configuration);
        AddCacheRouteServices(services);
        AddRuntimeCaches(services);
        AddOutputCache(services);
    }
    #endregion

    #region Private
    /// <summary>
    /// 綁定並驗證 WCMS Cache 全域設定。
    /// </summary>
    private static void AddCacheSettings(IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<CacheSettings>()
            .Bind(configuration.GetSection(CacheSettings.SectionName))
            .Validate(settings => !string.IsNullOrWhiteSpace(settings.DataKeyPrefix), "Cache:DataKeyPrefix 不可為空白。")
            .Validate(settings => !settings.Distributed.Enabled || !string.IsNullOrWhiteSpace(settings.Distributed.RedisConnection), "Cache:Distributed:Enabled=true 時必須設定 RedisConnection。")
            .ValidateOnStart();
    }
    /// <summary>
    /// 註冊 Local、Distributed Store 與統一路由服務。
    /// </summary>
    private static void AddCacheRouteServices(IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddSingleton<ILocalCacheStore, MemoryCacheStore>();
        services.AddSingleton<IDistributedCacheStore, DistributedCacheStore>();
        services.AddSingleton<ICacheRoute, CacheRoute>();
        services.AddSingleton<CacheService>();
    }
    /// <summary>
    /// 註冊 Process Runtime、Metadata 與應用程式目錄 Cache。
    /// </summary>
    private static void AddRuntimeCaches(IServiceCollection services)
    {
        AddJsonSerializationCache(services);
        services.AddSingleton<PropertyAccessorCache>();
        services.AddSingleton<ModelTypeMetadataCache>();
        services.AddSingleton<I18nCache>();
        services.AddSingleton<EfRepositoryMetadataCache>();
        services.AddSingleton<RolePermissionCatalogCache>();
    }
    /// <summary>
    /// 註冊 JSON Runtime Cache 與 MVC、HTTP JSON Resolver。
    /// </summary>
    private static void AddJsonSerializationCache(IServiceCollection services)
    {
        services.AddSingleton<JsonSerializationRuntimeCache>();
        services.AddOptions<Microsoft.AspNetCore.Mvc.JsonOptions>()
            .Configure<JsonSerializationRuntimeCache>((options, cache) =>
                options.JsonSerializerOptions.AddLibJsonNullDefaultHandling(cache));
        services.AddOptions<Microsoft.AspNetCore.Http.Json.JsonOptions>()
            .Configure<JsonSerializationRuntimeCache>((options, cache) =>
                options.SerializerOptions.AddLibJsonNullDefaultHandling(cache));
    }
    /// <summary>
    /// 註冊 OutputCache Policy 並以 WCMS Store 取代內建 Store。
    /// </summary>
    private static void AddOutputCache(IServiceCollection services)
    {
        services.AddOutputCache(options =>
        {
            AddListPolicy(options);
            AddDetailPolicy(options);
            AddPermanentPolicy(options);
        });
        services.Replace(ServiceDescriptor.Singleton<IOutputCacheStore, LibOutputCacheStore>());
    }
    /// <summary>
    /// 註冊清單查詢使用的 OutputCache Policy。
    /// </summary>
    private static void AddListPolicy(OutputCacheOptions options)
    {
        options.AddPolicy(SysParam.OutputCachePolicies.ListCache, builder => builder
            .Expire(TimeSpan.FromSeconds(60))
            .SetVaryByQuery(SysParam.Wildcards.All)
            .SetVaryByHeader(SysParam.HttpHeaders.AcceptLanguage)
            .Tag(SysParam.OutputCacheTags.List));
    }
    /// <summary>
    /// 註冊明細查詢使用的 OutputCache Policy。
    /// </summary>
    private static void AddDetailPolicy(OutputCacheOptions options)
    {
        options.AddPolicy(SysParam.OutputCachePolicies.DetailCache, builder => builder
            .Expire(TimeSpan.FromSeconds(60))
            .SetVaryByQuery(SysParam.ApiQuery.InternalId)
            .SetVaryByHeader(SysParam.HttpHeaders.AcceptLanguage)
            .Tag(SysParam.OutputCacheTags.Detail));
    }
    /// <summary>
    /// 註冊長效固定參數使用的 OutputCache Policy。
    /// </summary>
    private static void AddPermanentPolicy(OutputCacheOptions options)
    {
        options.AddPolicy(SysParam.OutputCachePolicies.PermanentCache, builder => builder
            .Expire(TimeSpan.FromDays(365))
            .SetVaryByHeader(SysParam.HttpHeaders.AcceptLanguage)
            .Tag(SysParam.OutputCacheTags.Permanent));
    }
    #endregion
}
