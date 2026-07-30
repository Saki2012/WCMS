using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.Features._Resx;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecCategory;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecCategory, FuncAction.MasterData)]
public class SpecCategoryController : ApiDataController<SpecCategory>
{
    [HttpGet(nameof(GetShowColumnItems)), OutputCache(PolicyName = SysParam.OutputCachePolicies.PermanentCache), AllowAnonymous, IgnoreAntiforgeryToken]
    public IActionResult GetShowColumnItems(string progId)
    {
        AddDetailTags(progId);
        var response = new ApiResponse<Dictionary<string, string>>() { Data = [(Service as SpecCategoryBiz).GetShowColumnItems(progId)], SysMessage = Message.Messages };
        return Ok(response);
    }
}
