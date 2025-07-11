using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;

namespace WCMS.Features.SiteEdit.PageManagement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class PageManagementController(IBizService<PageManagementSet> service) : ApiDataController<PageManagementSet>(service)
    {
    }
}
