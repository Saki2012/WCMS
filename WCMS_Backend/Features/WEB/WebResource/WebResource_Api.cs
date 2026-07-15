using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.WebResource;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.WebResource, FuncAction.MasterData)]
public class WebResourceController : ApiDataController<WebResource> { }
