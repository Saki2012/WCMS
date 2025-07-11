using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.Features.SiteEdit.Category
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class CategoryController(IBizService<CategoryDataSet> service) : ApiDataController<CategoryDataSet>(service)
    {
    }
}
