using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.COMM.Category
{
    [LibApiController(ProgKeys.COMM.Code, ProgKeys.COMM.Category, SysEnum.FuncAction.MasterData)]
    public class CategoryController : ApiDataController<CategoryDataSet, CategoryDataSet_DTO>{}
}
