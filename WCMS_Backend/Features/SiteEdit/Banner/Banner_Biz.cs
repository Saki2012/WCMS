using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore.Interface;
using WCMS.SysCore;
using System.Runtime.InteropServices;

namespace WCMS.Features.SiteEdit.Banner
{
    [ProgId("Banner")]
    public class BannerBiz(IRepositoryMapProvider repo) : BizService<BannerSet>(repo), IBizService<BannerSet> { }
}
