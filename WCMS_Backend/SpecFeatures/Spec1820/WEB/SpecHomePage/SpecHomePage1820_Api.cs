using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1810.WEB.SpecCategory;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1820.WEB.SpecHomePage;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.HomePageSetting, SysEnum.FuncAction.MasterData)]
public class SpecHomePageApiController : ApiDataController<SpecHomePage1820Set, SpecHomePage1820Set_DTO> {

    #region Public
    /// <summary>
    /// 獲取天氣資訊
    /// </summary>
    /// <returns></returns>
    [HttpGet(nameof(GetWeatherData)), OutputCache(PolicyName = SysParam.PermanentCache), AllowAnonymous, IgnoreAntiforgeryToken]
    public IActionResult GetWeatherData()
    {
        var response = new ApiResponse<Dictionary<string, string>>() { Data = [], SysMessage = Message.Messages };
        return Ok(response);
    }
    #endregion

}
