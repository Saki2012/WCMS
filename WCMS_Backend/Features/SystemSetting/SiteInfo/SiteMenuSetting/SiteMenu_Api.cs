using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.SystemSetting.SiteInfo.SiteMenuSetting
{
    [LibApiController(ModuleCode.SystemSetting, PGID.SiteMenu, SysEnum.FuncAction.MasterData)]
    public class SiteMenuController : ApiDataController<SiteMenuSet, SiteMenuSet_DTO>
    {
    }

}
