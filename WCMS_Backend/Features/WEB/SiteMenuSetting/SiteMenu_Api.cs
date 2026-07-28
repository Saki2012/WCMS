using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using WCMS.Features._Resx;
using WCMS.SysCore.Auditing.OperateLog;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.SiteMenuSetting;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.SiteMenu, FuncAction.MasterData)]
public class SiteMenuController : ApiDataController<SiteMenu_Index>
{
    #region Public
    /// <summary>
    /// 保存網站選單結構。
    /// </summary>
    [HttpPut(nameof(SaveMenuStructure)), LibRequireFuncAct(FuncAction.Update)]
    public async Task<IActionResult> SaveMenuStructure(ApiRequest<SaveMenuStructure_DTO> data, CancellationToken ct)
    {
        SaveMenuStructure_DTO? request = data.Data;
        if (request == null) return BadRequest("Request data is required.");
        OperateLog operateLog = CreateOperateLog(nameof(SaveMenuStructure), request);
        SaveMenuStructure_DTO result = await ((SiteMenuBiz)Service).SaveMenuStructureAsync(request, ct);
        await EvictForDataAsync(ct, request.InternalId);
        return BuildResponse(result, operateLog, ct);
    }
    /// <summary>
    /// 保存單筆網站選單項目。
    /// </summary>
    [HttpPut(nameof(SaveMenuItem)), LibRequireFuncAct(FuncAction.Update)]
    [ProducesResponseType(typeof(ApiResponse<SaveMenuItemResult_DTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SaveMenuItem(ApiRequest<SaveMenuItem_DTO> data, CancellationToken ct)
    {
        SaveMenuItem_DTO? request = data.Data;
        if (request == null) return BadRequest("Request data is required.");
        OperateLog operateLog = CreateOperateLog(nameof(SaveMenuItem), request);
        SaveMenuItemResult_DTO result = await ((SiteMenuBiz)Service).SaveMenuItemAsync(request, ct);
        await EvictForDataAsync(ct, request.InternalId);
        return BuildResponse(result, operateLog, ct);
    }
    /// <summary>
    /// 保存網站基本資訊。
    /// </summary>
    [HttpPut(nameof(SaveSiteInfo)), LibRequireFuncAct(FuncAction.Update)]
    public async Task<IActionResult> SaveSiteInfo(ApiRequest<SaveSiteInfo_DTO> data, CancellationToken ct)
    {
        SaveSiteInfo_DTO? request = data.Data;
        if (request == null) return BadRequest("Request data is required.");
        OperateLog operateLog = CreateOperateLog(nameof(SaveSiteInfo), request);
        await SaveSiteInfoAsync(request, ct);
        await EvictForDataAsync(ct, request.InternalId);
        return BuildResponse(request, operateLog, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 呼叫 Biz 保存站台基本資訊。
    /// </summary>
    private async Task SaveSiteInfoAsync(SaveSiteInfo_DTO request, CancellationToken ct)
    {
        SiteMenu_Index index = request.SiteMenu_Index;
        await ((SiteMenuBiz)Service).SaveSiteInfoAsync(request.InternalId,index.GoogleAnalytics,index.Enable,index.DefaultLang,index.SupportLangs,request.SiteMenu_IndexInfo,ct);
    }
    /// <summary>
    /// 建立操作日誌。
    /// </summary>
    private OperateLog CreateOperateLog(string actionName, object request)
    {
        string apiName = $"{Service.ProgId}/{actionName}";
        string content = JsonConvert.SerializeObject(request);
        string ip = Request.Headers[SysParam.HttpHeaders.ClientIp].ToString();
        return OperateLog.AddOperateLog(apiName, OperateUser.UserId, content, ip);
    }
    /// <summary>
    /// 建立 API 回應並更新操作結果。
    /// </summary>
    private IActionResult BuildResponse<T>(T result, OperateLog operateLog, CancellationToken ct)
    {
        if (ct == CancellationToken.None) operateLog.ExcStatus = ExcStatus.CancelExc;
        var response = new ApiResponse<T> { Data = [result], SysMessage = Message.Messages };
        operateLog.ExcStatus = response.IsSuccess ? ExcStatus.OK : ExcStatus.Fail;
        return Ok(response);
    }
    #endregion
}
