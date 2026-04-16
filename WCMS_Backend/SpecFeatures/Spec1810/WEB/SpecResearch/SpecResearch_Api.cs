using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecResearch;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecResearch, SysEnum.FuncAction.BillData)]
public class SpecResearchController : ApiDataController<SpecResearchSet,SpecResearchSet_DTO>{}
