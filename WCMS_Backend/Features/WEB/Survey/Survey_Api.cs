using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.WEB.Survey;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.Survey, SysEnum.FuncAction.MasterData)]
public class SurveyController : ApiDataController<SurveySet, SurveySet_DTO>{ }
