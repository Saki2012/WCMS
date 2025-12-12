using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.Features.SiteEdit.Gallery
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class GalleryController : ApiDataController<GallerySet, GallerySet_DTO>{}
}
