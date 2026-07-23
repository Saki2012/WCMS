using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1820.WEB.SpecHomePage;

/// <summary>
/// 1820 首頁設定與天氣資訊 API。
/// </summary>
[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.HomePageSetting, FuncAction.MasterData)]
public class SpecHomePageApiController : ApiDataController<SpecHomePage1820>
{
    #region Public
    /// <summary>
    /// 取得首頁天氣資訊。
    /// </summary>
    /// <param name="ct">取消權杖。</param>
    /// <returns>首頁天氣資訊。</returns>
    [HttpGet(nameof(GetWeatherData)), AllowAnonymous, IgnoreAntiforgeryToken]
    [ProducesResponseType(typeof(ApiResponse<SpecHomePageWeather_DTO>), StatusCodes.Status200OK)]
    public async Task<ApiResponse<SpecHomePageWeather_DTO>> GetWeatherData(CancellationToken ct)
    {
        SpecHomePageWeather_DTO result = await ((SpecHomePage1820_Biz)Service).GetWeatherDataAsync(ct);
        return OkResponse(result);
    }
    #endregion
}
