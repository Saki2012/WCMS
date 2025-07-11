using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.Features.SiteEdit.WebResource
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class WebResourceController(IBizService<WebResourceSet> service) : ApiDataController<WebResourceSet>(service)
    {
    }
}
