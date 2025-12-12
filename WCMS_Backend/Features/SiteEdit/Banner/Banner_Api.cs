using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.Features.SiteEdit.Banner
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class BannerController: ApiDataController<BannerSet, BannerSet_DTO>{}
}
