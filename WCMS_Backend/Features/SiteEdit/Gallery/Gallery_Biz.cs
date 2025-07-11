using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore.Interface;
using WCMS.SysCore;
using WCMS.Features.SiteEdit.Gallery;

namespace WCMS.Features.SiteEdit.Gallery
{
    public class GalleryBiz(IRepositoryMapProvider repoMapProvider) : BizService<GallerySet>(repoMapProvider), IBizService<GallerySet> { }
}
