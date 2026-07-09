using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.COMM.Tag
{
    [LibApiController(ProgKeys.COMM.Code, ProgKeys.COMM.Tag, SysEnum.FuncAction.MasterData)]
    public class TagController : ApiDataController<TagSet,TagSet_DTO>
    {
        
    }
}
