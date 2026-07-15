using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.Survey;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.Survey, FuncAction.MasterData)]
public class SurveyController : ApiDataController<Survey> { }
