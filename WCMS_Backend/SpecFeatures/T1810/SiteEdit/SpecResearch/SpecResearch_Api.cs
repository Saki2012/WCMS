using Microsoft.AspNetCore.Mvc;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch
{
    [ProgId("SpecResearch")]
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecResearchController : ApiDataController<SpecResearchSet,SpecResearchSet_DTO>
    {
        
    }

}
