using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.Routing;
using WCMS.SysCore.Enum;

namespace WCMS.SysCore.Library.LibAttribute
{
    /// <summary>
    /// 彙整 Controller 常用標記：
    /// - IApiBehaviorMetadata => 等同 [ApiController]
    /// - IRouteTemplateProvider => 等同 [Route(...)]
    /// - 權限 Metadata：ModuleCode/ProgId/TitleCode/SupportMask...
    /// </summary>
    [AttributeUsage(AttributeTargets.Class, Inherited = true, AllowMultiple = false)]
    public sealed class LibApiControllerAttribute(string moduleCode,string progId,SysEnum.FuncAction supportFuncActMask,string? routeTemplate = null) 
        : Attribute, IApiBehaviorMetadata, IRouteTemplateProvider, ILibPermissionMeta
    {
        #region Route (等同 ApiController + Route)
        public string Template { get; } = (routeTemplate ?? SysParam.ServiceRoute).Trim();
        public int? Order { get; set; }
        public string? Name { get; set; }
        #endregion

        #region Permission Meta
        public string ModuleCode { get; } = (moduleCode ?? string.Empty).Trim();
        public string ProgId { get; } = (progId ?? string.Empty).Trim();
        public string TitleCode { get; } = (progId ?? string.Empty).Trim();
        public SysEnum.FuncAction SupportFuncActMask { get; } = supportFuncActMask;
        #endregion
    }
}
