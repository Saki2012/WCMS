using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.WEB.WebResource
{
    [LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.WebResource, SysEnum.FuncAction.MasterData)]
    public class WebResourceController : ApiDataController<WebResourceSet, WebResourceSet_DTO>{}
}
