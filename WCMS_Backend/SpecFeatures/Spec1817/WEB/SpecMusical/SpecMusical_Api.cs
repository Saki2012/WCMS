using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1817.WEB.SpecMusical;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecMusical, SysEnum.FuncAction.MasterData)]
public class SpecMusicalController : ApiDataController<SpecMusicalModel>{}
