using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;
using System.Runtime.InteropServices;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    [ProgId("SpecUSR")]
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecUSRController(IBizService<SpecUSRSet> service) : ApiDataController<SpecUSRSet>(service)
    {
    }
}
