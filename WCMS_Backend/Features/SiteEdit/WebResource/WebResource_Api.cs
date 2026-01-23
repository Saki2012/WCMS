using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.SiteEdit.WebResource
{
    [LibApiController(ModuleCode.WebManagement, PGID.WebResource, SysEnum.FuncAction.MasterData)]
    public class WebResourceController : ApiDataController<WebResourceSet, WebResourceSet_DTO>{}
}
