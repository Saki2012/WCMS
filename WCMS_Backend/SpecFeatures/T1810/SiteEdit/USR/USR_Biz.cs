using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.SpecFeatures.T1810.SiteEdit.USR
{
    public class SpecUSRBiz(IBasicRepository<SpecUSRSet> repo) : BizService<SpecUSRSet>(repo), IBizService<SpecUSRSet> { }
}
