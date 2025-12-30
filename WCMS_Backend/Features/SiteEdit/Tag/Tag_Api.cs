using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.SiteEdit.Tag
{
    [LibApiController(ModuleCode.WebManagement, PGID.Tag, SysEnum.FuncAction.MasterData)]
    public class TagController : ApiDataController<TagSet,TagSet_DTO>
    {
        
    }
}
