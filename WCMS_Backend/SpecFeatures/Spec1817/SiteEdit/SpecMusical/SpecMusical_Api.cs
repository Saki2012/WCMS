using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.SpecFeatures.Spec1817.SiteEdit.SpecMusical
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecMusicalController : ApiDataController<SpecMusicalSet, SpecMusicalSet_DTO>
    {
    }
}
