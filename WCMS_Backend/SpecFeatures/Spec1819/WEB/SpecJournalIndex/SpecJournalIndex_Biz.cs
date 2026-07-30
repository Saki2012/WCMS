using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournalIndex;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.Spec.SpecJournalIndex)]
public class SpecJournalIndex_Biz(BizDeps bizDeps) : BizService<SpecJournalIndex>(bizDeps)
{

}
