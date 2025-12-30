using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.Announcement
{
    [LibApiController(ModuleCode.WebManagement, PGID.Announcement, SysEnum.FuncAction.BillData)]
    public class AnnouncementController : ApiDataController<AnnouncementSet,AnnouncementSet_DTO>
    {
        [HttpPost(nameof(QueryByValidate)), OutputCache(PolicyName = SysParam.ListCache), AllowAnonymous, IgnoreAntiforgeryToken]
        public virtual async Task<IActionResult> QueryByValidate([FromBody] QueryListParam? queryCondition, CancellationToken ct)
        {
            queryCondition.Condition = Merge(" And ",false,queryCondition.Condition, $@"{nameof(Announcement.Validate_Start)} <= {DateTime.Today}");
            return await this.QueryList(queryCondition, ct);
        }
    }
}

