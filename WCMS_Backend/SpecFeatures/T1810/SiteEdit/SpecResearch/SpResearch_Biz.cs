using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore.Interface;
using WCMS.SysCore;
using System.Runtime.InteropServices;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch
{
    [ProgId("SpecResearch")]
    public class SpecResearchBiz(IRepositoryMapProvider repo) : BizService<SpecResearchSet>(repo), IBizService<SpecResearchSet> { }
}
