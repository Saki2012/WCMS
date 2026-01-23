using System.Runtime.InteropServices;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Interface;

namespace WCMS.SpecFeatures.Spec1819.SiteEdit.SpecJournalIndex
{
    [ProgId(PGID.SpecJournalIndex)]
    public class SpecJournalIndex_Biz(BizDeps bizDeps) : BizService<SpecJournalIndexSet>(bizDeps), IBizService<SpecJournalIndexSet>
    {

    }
}
