using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.Features.SiteEdit.Banner
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class BannerController(IBizService<BannerSet> service) : ApiDataController<BannerSet>(service)
    {
    }
}
