using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;

namespace WCMS.Features.SiteEdit.Announcement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class AnnouncementController(IBizService<PageManagementSet> service) : ApiDataController<PageManagementSet>(service)
    {
    }
}
