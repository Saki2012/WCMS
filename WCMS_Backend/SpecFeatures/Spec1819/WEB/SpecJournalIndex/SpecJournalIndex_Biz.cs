using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournalIndex;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.Spec.SpecJournalIndex)]
public class SpecJournalIndex_Biz(BizDeps bizDeps) : BizService<SpecJournalIndexModel>(bizDeps), IBizService<SpecJournalIndexModel>
{

}
