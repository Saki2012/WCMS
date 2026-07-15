using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.Features._Resx;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
using static WCMS.SysCore.Library.LibData;
namespace WCMS.Features.WEB.Announcement;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.Announcement, FuncAction.BillData)]
public partial class AnnouncementController : ApiDataController<Announcement>
{
    [HttpPost(nameof(QueryByValidate)), OutputCache(PolicyName = SysParam.OutputCachePolicies.ListCache), AllowAnonymous, IgnoreAntiforgeryToken]
    public virtual async Task<IActionResult> QueryByValidate([FromBody] QueryListParam? queryCondition, CancellationToken ct)
    {
        queryCondition.Condition = Merge(SysParam.QueryOperators.And,false,queryCondition.Condition, $@"{nameof(Announcement.Validate_Start)} <= {DateTime.Today}");
        return await QueryList(queryCondition, ct);
    }
}

