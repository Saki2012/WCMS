using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Text.Json.Serialization;
using WCMS.Features.SiteEdit.Banner;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;

namespace WCMS.Features.SiteEdit.Category
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class CategoryController : ApiDataController<CategoryDataSet, CategoryDataSet_DTO>
    {
        
    }
}
