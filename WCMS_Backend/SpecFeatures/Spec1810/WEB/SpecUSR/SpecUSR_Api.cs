using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecUSR;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecUSR, FuncAction.BillData)]
public class SpecUSRController : ApiDataController<SpecUSRModel>{}
