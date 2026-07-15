using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.Gallery;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.Gallery, FuncAction.MasterData)]
public class GalleryController : ApiDataController<Gallery> { }
