using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Interface;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    [ProgId("SpecUSR")]
    public class SpecUSRBiz(IRepositoryMapProvider repo) : BizService<SpecUSRSet>(repo), IBizService<SpecUSRSet> { }
}
