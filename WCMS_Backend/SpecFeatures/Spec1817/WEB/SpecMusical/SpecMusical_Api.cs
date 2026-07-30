using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1817.WEB.SpecMusical;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecMusical, FuncAction.MasterData)]
public class SpecMusicalController : ApiDataController<SpecMusical>{}
