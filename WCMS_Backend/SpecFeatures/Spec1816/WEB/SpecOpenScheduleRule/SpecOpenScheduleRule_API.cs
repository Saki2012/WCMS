using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecOpenScheduleRule, SysEnum.FuncAction.BillData)]
public class SpecOpenScheduleRuleController() : ApiDataController<SpecOpenScheduleRuleModel> {}
