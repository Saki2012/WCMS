using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.SpecFeatures.T1810.SiteEdit.Research
{
    public class SpecResearchBiz(IBasicRepository<SpecResearchSet> repo) : BizService<SpecResearchSet>(repo), IBizService<SpecResearchSet> { }
}
