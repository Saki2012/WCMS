using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1819.WEB.SpecJournalIndex;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournalIndex;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecJournalIndex, SysEnum.FuncAction.MasterData)]
public class SpecJournalIndexController : ApiDataController<SpecJournalIndexSet, SpecJournalIndexSet_DTO>{ }
