using Microsoft.AspNetCore.Mvc;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;
using WCMS.Features.SiteEdit.Gallery;

namespace WCMS.Features.SiteEdit.Gallery
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class GalleryController(IBizService<GallerySet> service) : ApiDataController<GallerySet>(service)
    {
    }
}
