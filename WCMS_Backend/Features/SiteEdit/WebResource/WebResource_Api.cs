using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.Features.SiteEdit.WebResource
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class WebResourceController : ApiDataController<WebResourceSet, WebResourceSet_DTO>{}
}
