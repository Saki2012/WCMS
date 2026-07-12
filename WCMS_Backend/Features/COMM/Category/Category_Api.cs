using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Form;

namespace WCMS.Features.COMM.Category;

/// <summary>
/// Category 家族共用 API 基底。
/// </summary>
public abstract class CategoryControllerBase<TFormModel> : ApiDataController<TFormModel> where TFormModel : IFormModel { }

/// <summary>
/// 一般 Category API 基底。
/// </summary>
public abstract class CategoryControllerBase : CategoryControllerBase<Category> { }

/// <summary>
/// 一般 Category API。
/// </summary>
[LibApiController(ProgKeys.COMM.Code, ProgKeys.COMM.Category, SysEnum.FuncAction.MasterData)]
public class CategoryController : CategoryControllerBase { }
