using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.SpecFeatures.T1810.SiteEdit.Research
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecResearchController(IBizService<SpecResearchSet> service) : ApiDataController<SpecResearchSet>(service)
    {
    }
}
