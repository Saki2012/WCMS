using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.SiteEdit.Category
{
    [LibApiController(ModuleCode.WebManagement, PGID.Category, SysEnum.FuncAction.MasterData)]
    public class CategoryController : ApiDataController<CategoryDataSet, CategoryDataSet_DTO>
    {
        
    }
}
