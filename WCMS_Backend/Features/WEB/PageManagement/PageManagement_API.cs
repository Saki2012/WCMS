using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.WEB.PageManagement
{
    [LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.PageManagement, SysEnum.FuncAction.MasterData)]
    public class PageManagementController : ApiDataController<PageManagementSet, PageManagementSet_DTO>{}
}
