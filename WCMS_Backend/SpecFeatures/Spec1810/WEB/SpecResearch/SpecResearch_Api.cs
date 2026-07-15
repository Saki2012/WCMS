using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecResearch;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecResearch, FuncAction.BillData)]
public class SpecResearchController : ApiDataController<SpecResearchModel> { }
