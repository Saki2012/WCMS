using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.Features.SiteEdit.WebResource
{
    public class WebResourceBiz(IRepositoryMapProvider repo) : BizService<WebResourceSet>(repo), IBizService<WebResourceSet> { }
}
