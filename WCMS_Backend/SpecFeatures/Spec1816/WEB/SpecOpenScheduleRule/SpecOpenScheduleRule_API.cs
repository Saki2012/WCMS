using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecOpenScheduleRule, FuncAction.BillData)]
public class SpecOpenScheduleRuleController() : ApiDataController<SpecOpenScheduleRuleModel> {}
