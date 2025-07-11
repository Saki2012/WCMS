using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.Features.SiteEdit.Banner
{
    public class BannerBiz(IRepositoryMapProvider repo) : BizService<BannerSet>(repo), IBizService<BannerSet> { }
}
