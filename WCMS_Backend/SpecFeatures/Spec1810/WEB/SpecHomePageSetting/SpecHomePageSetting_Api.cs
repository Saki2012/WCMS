using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecHomePageSetting;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.HomePageSetting, SysEnum.FuncAction.MasterData)]
public class SpecHomePageSettingController : ApiBaseController
{
    #region Property
    private SpecHomePageSettingBiz? _biz;

    /// <summary>
    /// 1810 首頁聚合 Biz。
    /// </summary>
    private SpecHomePageSettingBiz Biz => _biz ??= CreateBiz<SpecHomePageSettingBiz>();
    #endregion

    #region Public
    /// <summary>
    /// 取得 1810 首頁初始化資料。
    /// </summary>
    /// <param name="ct">取消權杖。</param>
    /// <returns>首頁初始化資料。</returns>
    [HttpGet(nameof(GetInitialData)), AllowAnonymous, IgnoreAntiforgeryToken]
    //[OutputCache(PolicyName = SysParam.OutputCachePolicies.ListCache)]
    [ProducesResponseType(typeof(ApiResponse<SpecHomePageInitialData_DTO>), StatusCodes.Status200OK)]
    public async Task<ApiResponse<SpecHomePageInitialData_DTO>> GetInitialData(CancellationToken ct)
    {
        SpecHomePageInitialData_DTO result = await Biz.GetInitialDataAsync(ct);
        return OkResponse(result);
    }
    #endregion
}
