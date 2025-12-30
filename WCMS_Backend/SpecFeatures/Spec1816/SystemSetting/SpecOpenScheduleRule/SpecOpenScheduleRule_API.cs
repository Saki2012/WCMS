using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.Spec1816.SystemSetting.SpecOpenScheduleRule
{
    [LibApiController(ModuleCode.SystemSetting, PGID.SpecOpenScheduleRule, SysEnum.FuncAction.BillData)]
    public class SpecOpenScheduleRuleController() : ApiDataController<SpecOpenScheduleRuleSet, SpecOpenScheduleRuleSet_DTO> {}
}
