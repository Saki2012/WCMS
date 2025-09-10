using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Linq;
using WCMS.Features.SiteEdit.PageManagement;
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

        
    }
}
