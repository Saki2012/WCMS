using Microsoft.AspNetCore.Mvc;
using System.Runtime.InteropServices;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    [LibApiController(ModuleCode.WebManagement, PGID.SpecUSR, SysEnum.FuncAction.BillData)]
    public class SpecUSRController : ApiDataController<SpecUSRSet, SpecUSRSet_DTO>
    {
        
    }

}
