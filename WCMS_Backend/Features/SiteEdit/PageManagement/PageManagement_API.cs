using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.Features.SiteEdit.PageManagement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class PageManagementController : ApiDataController<PageManagementSet, PageManagementSet_DTO>{}
}
