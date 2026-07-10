using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecUSR;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecUSR, SysEnum.FuncAction.BillData)]
public class SpecUSRController : ApiDataController<SpecUSRModel>{}
