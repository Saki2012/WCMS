using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecCategory;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecCategory, SysEnum.FuncAction.MasterData)]
public class SpecCategoryController : ApiDataController<SpecCategorySet,SpecCategorySet_DTO>
{
    [HttpGet(nameof(GetShowColumnItems)), OutputCache(PolicyName = SysParam.PermanentCache), AllowAnonymous, IgnoreAntiforgeryToken]
    public IActionResult GetShowColumnItems(string progId)
    {
        AddDetailTags(progId);
        var response = new ApiResponse<Dictionary<string, string>>() { Data = [(Service as SpecCategoryBiz).GetShowColumnItems(progId)], SysMessage = Message.Messages };
        return Ok(response);
    }
}
