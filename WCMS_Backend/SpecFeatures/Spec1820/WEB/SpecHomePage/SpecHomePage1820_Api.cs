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
    /// <param name="req">查詢條件</param>
    /// <param name="ct">取消權杖</param>
    /// <returns></returns>
    [HttpGet(nameof(GetWeatherData)), AllowAnonymous, IgnoreAntiforgeryToken]
    [ProducesResponseType(typeof(ApiResponse<SpecHomePageWeather_DTO>), StatusCodes.Status200OK)]
    public async Task<ApiResponse<SpecHomePageWeather_DTO>> GetWeatherData(CancellationToken ct)
    {
        SpecHomePageWeather_DTO result = await ((SpecHomePage1820_Biz)Service).GetWeatherDataAsync(ct);
        return new ApiResponse<SpecHomePageWeather_DTO>() { Data = [result], SysMessage = Message.Messages };
    }
    #endregion

}
