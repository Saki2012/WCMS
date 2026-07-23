using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;

/// <summary>
/// 提供學年度開館規則的標準表單 API。
/// </summary>
[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecOpenScheduleRule, FuncAction.BillData)]
public class SpecOpenScheduleRuleController() : ApiDataController<SpecOpenScheduleRule> { }
