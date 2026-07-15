using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.COMM.Tag;

[LibApiController(ProgKeys.COMM.Code, ProgKeys.COMM.Tag, FuncAction.MasterData)]
public class TagController : ApiDataController<TagData>
{

}
