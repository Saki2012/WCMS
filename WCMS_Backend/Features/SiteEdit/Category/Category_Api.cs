using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.Features.SiteEdit.Category
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class CategoryController : ApiDataController<CategoryDataSet, CategoryDataSet_DTO>
    {
        
    }
}
