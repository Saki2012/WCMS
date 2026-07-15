using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.Timeline;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.Timeline, FuncAction.MasterData)]
public class TimelineController : ApiDataController<Timeline>{ }

