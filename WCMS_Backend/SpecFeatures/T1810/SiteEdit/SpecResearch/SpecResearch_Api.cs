using Microsoft.AspNetCore.Mvc;
using System.Runtime.InteropServices;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch
{
    [LibApiController(ModuleCode.WebManagement, PGID.SpecResearch, SysEnum.FuncAction.BillData)]
    public class SpecResearchController : ApiDataController<SpecResearchSet,SpecResearchSet_DTO>
    {
        
    }

}
