using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.SiteEdit.Gallery
{
    [LibApiController(ModuleCode.WebManagement, PGID.Gallery, SysEnum.FuncAction.MasterData)]
    public class GalleryController : ApiDataController<GallerySet, GallerySet_DTO>{}
}
