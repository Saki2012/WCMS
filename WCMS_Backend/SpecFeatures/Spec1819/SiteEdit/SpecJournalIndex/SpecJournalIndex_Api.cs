using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.Spec1819.SiteEdit.SpecJournalIndex
{
    [LibApiController(ModuleCode.WebManagement, PGID.SpecJournalIndex, SysEnum.FuncAction.MasterData)]
    public class SpecJournalIndexController : ApiDataController<SpecJournalIndexSet, SpecJournalIndexSet_DTO>
    {

    }
}
