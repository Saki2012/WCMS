using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.SiteEdit.Banner
{
    [LibApiController(ModuleCode.WebManagement, PGID.Banner, SysEnum.FuncAction.MasterData)]
    public class BannerController: ApiDataController<BannerSet, BannerSet_DTO>{}
}
