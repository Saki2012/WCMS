using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.Banner;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.Banner, FuncAction.MasterData)]
public class BannerController : ApiDataController<Banner> { }
