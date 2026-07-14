using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using WCMS.Features._Resx;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Library;
using WCMS.SysCore.PlatformServices.Cache;
using WCMS.SysCore.Security.IdentityAccess.Authorization;

namespace WCMS.Features.IAM.RolePermission;

/// <summary>
/// 快取目前 Spec 可使用的角色權限功能目錄結構。
/// </summary>
public sealed class RolePermissionCatalogCache : LibCacheBase
{
    #region Property
    private const string CacheRegionName = "role-permission-catalog";
    private const string CatalogKey = "catalog";
    private static readonly CacheOptions RuntimeOptions = new()
    {
        Mode = CacheMode.LocalOnly,
        ExpirationStrategy = CacheExpirationStrategy.ProcessLifetime,
    };
    private readonly object _catalogLock = new();
    private readonly IActionDescriptorCollectionProvider _actionDescriptors;
    protected override string CacheRegion => CacheRegionName;
    #endregion

    #region Public
    /// <summary>
    /// 初始化角色權限功能目錄 Cache。
    /// </summary>
    public RolePermissionCatalogCache(
        CacheService cacheService,
        IActionDescriptorCollectionProvider actionDescriptors) : base(cacheService)
    {
        _actionDescriptors = actionDescriptors;
    }
    #endregion

    #region Internal
    /// <summary>
    /// 取得目前 Spec 的角色權限功能目錄結構。
    /// </summary>
    internal IReadOnlyList<RolePermissionCatalogModule> GetCatalog()
    {
        string key = BuildCatalogCacheKey();
        CacheReadResult<IReadOnlyList<RolePermissionCatalogModule>> cached = CacheService.GetLocal<IReadOnlyList<RolePermissionCatalogModule>>(key, RuntimeOptions);
        if (cached.IsHit) return cached.Value ?? [];
        lock (_catalogLock)
        {
            return GetOrCreateLocal(key, RuntimeOptions, BuildCatalog) ?? [];
        }
    }
    /// <summary>
    /// 清除目前 Spec 的角色權限功能目錄結構。
    /// </summary>
    internal void Clear()
    {
        string key = BuildCatalogCacheKey();
        lock (_catalogLock)
        {
            RemoveLocal(key, RuntimeOptions);
        }
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立包含目前 Spec 的 Cache Key。
    /// </summary>
    private string BuildCatalogCacheKey()
    {
        string specCode = string.IsNullOrWhiteSpace(SpecSettings.SpecCode) ? "core" : SpecSettings.SpecCode;
        return BuildCacheKey(CatalogKey, specCode);
    }
    /// <summary>
    /// 掃描 Controller Action 並建立不含語系文字的權限目錄。
    /// </summary>
    private IReadOnlyList<RolePermissionCatalogModule> BuildCatalog()
    {
        var modules = new Dictionary<ModuleCodeEnum, Dictionary<string, FuncAction>>();
        foreach (LibApiControllerAttribute meta in EnumeratePermissionMetas()) UpsertModuleProg(modules, meta);
        return modules
            .OrderBy(item => item.Key)
            .Select(BuildModule)
            .ToArray();
    }
    /// <summary>
    /// 列舉目前 Spec 可使用的權限 Metadata。
    /// </summary>
    private IEnumerable<LibApiControllerAttribute> EnumeratePermissionMetas()
    {
        foreach (var descriptor in _actionDescriptors.ActionDescriptors.Items)
        {
            if (descriptor is not ControllerActionDescriptor action) continue;
            if (!IsAllowedBySpec(action)) continue;
            LibApiControllerAttribute? meta = GetPermissionMeta(action);
            if (meta == null || string.IsNullOrWhiteSpace(meta.ProgId)) continue;
            yield return meta;
        }
    }
    /// <summary>
    /// 判斷 Controller 是否屬於 Core 或目前啟用的 Spec。
    /// </summary>
    private static bool IsAllowedBySpec(ControllerActionDescriptor action)
    {
        string targetNamespace = action.ControllerTypeInfo.Namespace ?? string.Empty;
        string specCode = SpecSettings.SpecCode ?? string.Empty;
        if (!targetNamespace.StartsWith(SysParam.NamespacePrefixes.SpecFeatures, StringComparison.OrdinalIgnoreCase)) return true;
        if (string.IsNullOrWhiteSpace(specCode)) return true;
        return targetNamespace.StartsWith($"{SysParam.NamespacePrefixes.SpecFeatures}{specCode}.", StringComparison.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 取得 Action 優先、Controller 次之的權限 Metadata。
    /// </summary>
    private static LibApiControllerAttribute? GetPermissionMeta(ControllerActionDescriptor action)
    {
        LibApiControllerAttribute? actionMeta = action.MethodInfo
            .GetCustomAttributes(typeof(LibApiControllerAttribute), true)
            .OfType<LibApiControllerAttribute>()
            .FirstOrDefault();
        if (actionMeta != null) return actionMeta;
        return action.ControllerTypeInfo
            .GetCustomAttributes(typeof(LibApiControllerAttribute), true)
            .OfType<LibApiControllerAttribute>()
            .FirstOrDefault();
    }
    /// <summary>
    /// 合併相同 Module 與 Prog 的支援權限遮罩。
    /// </summary>
    private static void UpsertModuleProg(
        Dictionary<ModuleCodeEnum, Dictionary<string, FuncAction>> modules,
        LibApiControllerAttribute meta)
    {
        if (!modules.TryGetValue(meta.ModuleCode, out var progs))
        {
            progs = new Dictionary<string, FuncAction>(StringComparer.OrdinalIgnoreCase);
            modules.Add(meta.ModuleCode, progs);
        }
        progs.TryGetValue(meta.ProgId, out FuncAction currentMask);
        progs[meta.ProgId] = currentMask | meta.SupportFuncActMask;
    }
    /// <summary>
    /// 將 Module Dictionary 轉為排序後的唯讀結構。
    /// </summary>
    private static RolePermissionCatalogModule BuildModule(
        KeyValuePair<ModuleCodeEnum, Dictionary<string, FuncAction>> module)
    {
        RolePermissionCatalogProg[] progs = module.Value
            .OrderBy(item => item.Key, StringComparer.OrdinalIgnoreCase)
            .Select(item => new RolePermissionCatalogProg(item.Key, item.Value))
            .ToArray();
        return new RolePermissionCatalogModule(module.Key, progs);
    }
    #endregion
}

/// <summary>
/// 保存不受語系影響的權限模組結構。
/// </summary>
internal sealed record RolePermissionCatalogModule(
    ModuleCodeEnum ModuleCode,
    IReadOnlyList<RolePermissionCatalogProg> Progs);

/// <summary>
/// 保存不受語系影響的權限程式結構。
/// </summary>
internal sealed record RolePermissionCatalogProg(
    string ProgId,
    FuncAction SupportMask);
