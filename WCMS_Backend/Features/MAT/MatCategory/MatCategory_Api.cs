using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.Features.MAT.MatCategory;

[LibApiController(ProgKeys.MAT.Code, ProgKeys.MAT.MatCategory, SysEnum.FuncAction.MasterData)]
public class MatCategoryController : CategoryControllerBase<MatCategoryDataSet, MatCategoryDataSet_DTO>{ }
