using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.Features.COMM.Category;

/// <summary>
/// Category 家族共用 API 基底
/// </summary>
public abstract class CategoryControllerBase<TSet, TDto> : ApiDataController<TSet, TDto>where TSet : CategoryDataSet, new()where TDto : CategoryDataSet_DTO, new(){}

[LibApiController(ProgKeys.COMM.Code, ProgKeys.COMM.Category, SysEnum.FuncAction.MasterData)]
public class CategoryController : CategoryControllerBase<CategoryDataSet, CategoryDataSet_DTO>{ }
