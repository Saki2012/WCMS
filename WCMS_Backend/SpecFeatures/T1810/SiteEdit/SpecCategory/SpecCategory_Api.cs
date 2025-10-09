using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.Features.SiteEdit.SpecCategory;
using WCMS.Features.SiteEdit.WebResource;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecCategory
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecCategoryController : ApiDataController<SpecCategorySet,SpecCategorySet_DTO>
    {
        [HttpGet(nameof(GetShowColumnItems)), OutputCache(PolicyName = "PermanentJson")]
        public IActionResult GetShowColumnItems(string progId)
        {
            AddDetailTags(progId);
            var response = new ApiResponse<Dictionary<string, string>>() { Data = [(Service as SpecCategoryBiz).GetShowColumnItems(progId)], SysMessage = Message.Messages };
            return Ok(response);
        }

    }
}
