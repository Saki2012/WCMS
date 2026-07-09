using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.WEB.Timeline;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.Timeline, SysEnum.FuncAction.MasterData)]
public class TimelineController : ApiDataController<TimelineSet,TimelineSet_DTO>
{

}

