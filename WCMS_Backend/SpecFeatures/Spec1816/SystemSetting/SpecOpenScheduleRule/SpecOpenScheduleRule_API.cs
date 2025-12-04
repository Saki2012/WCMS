using Microsoft.AspNetCore.Mvc;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.SpecFeatures.Spec1816.SystemSetting.SpecOpenScheduleRule
{
    [ProgId("SpecOpenScheduleRule")]
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecOpenScheduleRuleController() : ApiDataController<SpecOpenScheduleRuleSet, SpecOpenScheduleRuleSet_DTO> {}
}
