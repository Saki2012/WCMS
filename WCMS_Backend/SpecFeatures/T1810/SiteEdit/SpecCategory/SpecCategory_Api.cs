using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.SpecCategory;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecCategory
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecCategoryController : ApiDataController<SpecCategorySet,SpecCategorySet_DTO>
    {
        [HttpGet(nameof(GetShowColumnItems))/*, OutputCache(PolicyName = "PermanentJson")*/]
        public IActionResult GetShowColumnItems(string progId)
        {
            AddDetailTags(progId);
            var response = new ApiResponse<Dictionary<string, string>>() { Data = [(Service as SpecCategoryBiz).GetShowColumnItems(progId)], SysMessage = Message.Messages };
            return Ok(response);
        }

    }
}
