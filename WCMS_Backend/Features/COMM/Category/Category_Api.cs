using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.COMM.Category;

/// <summary>
/// Category 家族共用 API 基底。
/// </summary>
public abstract class CategoryControllerBase<TFormModel> : ApiDataController<TFormModel> where TFormModel : class { }

/// <summary>
/// 一般 Category API 基底。
/// </summary>
public abstract class CategoryControllerBase : CategoryControllerBase<Category> { }

/// <summary>
/// 一般 Category API。
/// </summary>
[LibApiController(ProgKeys.COMM.Code, ProgKeys.COMM.Category, SysEnum.FuncAction.MasterData)]
public class CategoryController : CategoryControllerBase { }
