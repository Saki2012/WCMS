using WCMS.SysCore.Interface;
using WCMS.SysCore;
using WCMS.Features.SiteEdit.WebResource;

namespace WCMS.Features.SiteEdit.Tag
{
    public class TagBiz(IRepositoryMapProvider repo) : BizService<TagSet>(repo), IBizService<TagSet> { }
}
