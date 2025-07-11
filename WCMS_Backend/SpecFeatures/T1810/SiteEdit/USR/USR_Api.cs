using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.SpecFeatures.T1810.SiteEdit.USR
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecUSRController(IBizService<SpecUSRSet> service) : ApiDataController<SpecUSRSet>(service)
    {
    }
}
