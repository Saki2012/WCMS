using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1821.WEB.SpecHomePage;

/// <summary>
/// 1821招生首頁設定 API
/// </summary>
[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.HomePageSetting, FuncAction.MasterData)]
public class SpecHomePageApiController : ApiDataController<SpecHomePage1821>
{
}
