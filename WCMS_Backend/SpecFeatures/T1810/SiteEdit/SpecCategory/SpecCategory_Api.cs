using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.Features.BizResx;
using WCMS.Features.SiteEdit.SpecCategory;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecCategory
{
    [LibApiController(ModuleCode.WebManagement, PGID.SpecCategory, SysEnum.FuncAction.MasterData)]
    public class SpecCategoryController : ApiDataController<SpecCategorySet,SpecCategorySet_DTO>
    {
        [HttpGet(nameof(GetShowColumnItems)), OutputCache(PolicyName = SysParam.PermanentCache)]
        public IActionResult GetShowColumnItems(string progId)
        {
            AddDetailTags(progId);
            var response = new ApiResponse<Dictionary<string, string>>() { Data = [(Service as SpecCategoryBiz).GetShowColumnItems(progId)], SysMessage = Message.Messages };
            return Ok(response);
        }

    }
}
