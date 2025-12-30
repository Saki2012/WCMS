using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.SiteEdit.PageManagement
{
    [LibApiController(ModuleCode.WebManagement, PGID.PageManagement, SysEnum.FuncAction.MasterData)]
    public class PageManagementController : ApiDataController<PageManagementSet, PageManagementSet_DTO>{}
}
