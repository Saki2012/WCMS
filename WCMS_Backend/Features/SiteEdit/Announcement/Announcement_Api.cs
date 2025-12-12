using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.Announcement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class AnnouncementController : ApiDataController<AnnouncementSet,AnnouncementSet_DTO>
    {
        [HttpPost(nameof(QueryByValidate)), OutputCache(PolicyName = "ListJson"), AllowAnonymous, IgnoreAntiforgeryToken]
        public virtual async Task<IActionResult> QueryByValidate([FromBody] QueryListParam? queryCondition, CancellationToken ct)
        {
            queryCondition.Condition = Merge(" And ",false,queryCondition.Condition, $@"{nameof(Announcement.Validate_Start)} <= {DateTime.Today}");
            return await this.QueryList(queryCondition, ct);
        }
    }
}

