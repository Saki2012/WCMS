using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.Spec1817.SiteEdit.SpecMusical
{
    [LibApiController(ModuleCode.WebManagement, PGID.SpecMusical, SysEnum.FuncAction.MasterData)]
    public class SpecMusicalController : ApiDataController<SpecMusicalSet, SpecMusicalSet_DTO>
    {
    }
}
