using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1821.WEB.SpecHomePage;

/// <summary>
/// 1821招生首頁設定 API
/// </summary>
[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.HomePageSetting, SysEnum.FuncAction.MasterData)]
public class SpecHomePage1821ApiController : ApiDataController<SpecHomePage1821Set, SpecHomePage1821Set_DTO>
{
}
