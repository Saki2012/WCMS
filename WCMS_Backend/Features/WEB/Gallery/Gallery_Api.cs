using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.WEB.Gallery
{
    [LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.Gallery, SysEnum.FuncAction.MasterData)]
    public class GalleryController : ApiDataController<GallerySet, GallerySet_DTO>{}
}
