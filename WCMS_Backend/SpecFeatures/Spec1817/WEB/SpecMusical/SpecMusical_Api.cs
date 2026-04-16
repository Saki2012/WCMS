using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1817.WEB.SpecMusical;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecMusical, SysEnum.FuncAction.MasterData)]
public class SpecMusicalController : ApiDataController<SpecMusicalSet, SpecMusicalSet_DTO>{}
