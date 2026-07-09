using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.WEB.Banner
{
    [LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.Banner, SysEnum.FuncAction.MasterData)]
    public class BannerController: ApiDataController<BannerSet, BannerSet_DTO>{}
}
