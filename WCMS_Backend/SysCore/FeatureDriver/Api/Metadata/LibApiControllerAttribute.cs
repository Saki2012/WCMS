using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.Routing;
using WCMS.Features._Resx;
using WCMS.SysCore.Constants;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SysCore.FeatureDriver.Api.Metadata;

/// <summary>
/// 彙整 Controller 常用標記：
/// - IApiBehaviorMetadata => 等同 [ApiController]
/// - IRouteTemplateProvider => 等同 [Route(...)]
/// - 權限 Metadata：ModuleCode/ProgId/TitleCode/SupportMask...
/// </summary>
[AttributeUsage(AttributeTargets.Class, Inherited = true, AllowMultiple = false)]
public sealed class LibApiControllerAttribute(ModuleCodeEnum moduleCode, string progId, FuncAction supportFuncActMask, string? routeTemplate = null) : Attribute, IApiBehaviorMetadata, IRouteTemplateProvider
{
    #region Route (等同 ApiController + Route)
    public string Template { get; } = (routeTemplate ?? SysParam.ApiRoutes.Service).Trim();
    public int? Order { get; set; }
    public string? Name { get; set; }
    #endregion

    #region Permission Meta
    public ModuleCodeEnum ModuleCode { get; } = moduleCode;
    public string ProgId { get; } = (progId ?? string.Empty).Trim();
    public FuncAction SupportFuncActMask { get; } = supportFuncActMask;
    #endregion
}
