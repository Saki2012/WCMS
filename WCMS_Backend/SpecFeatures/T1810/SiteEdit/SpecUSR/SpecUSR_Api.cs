using Microsoft.AspNetCore.Mvc;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    [ProgId("SpecUSR")]
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecUSRController : ApiDataController<SpecUSRSet, SpecUSRSet_DTO>
    {
        
    }

}
