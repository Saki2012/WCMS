using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.Features.SystemSetting.SiteInfo.SiteMenuSetting
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SiteMenuController : ApiDataController<SiteMenuSet, SiteMenuSet_DTO>
    {
    }

}
