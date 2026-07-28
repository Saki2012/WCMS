using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.SiteMenuSetting;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.SiteMenu, FuncAction.MasterData)]
public class SiteMenuController : ApiDataController<SiteMenuSet, SiteMenuSet_DTO>
{
    #region Public
    /// <summary>
    /// 保存網站選單結構
    /// </summary>
    [HttpPut(nameof(SaveMenuStructure)), LibRequireFuncAct(FuncAction.Update)]
    public async Task<IActionResult> SaveMenuStructure(ApiRequest<SaveMenuStructure_DTO> data, CancellationToken ct)
    {
        var req = data.Data;
        OperateLogModel opLog = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(SaveMenuStructure)}", OperateUser.UserId, JsonConvert.SerializeObject(req), Request.Headers["HTTP_CLIENT_IP"].ToString());
        var result = await ((SiteMenuBiz)Service).SaveMenuStructureAsync(req, ct);
        await EvictForSetAsync(ct, req.InternalId);
        if (ct == CancellationToken.None) opLog.ExcStatus = ExcStatus.CancelExc;
        var response = new ApiResponse<SaveMenuStructure_DTO>() { Data = [result], SysMessage = Message.Messages };
        opLog.ExcStatus = response.IsSuccess ? ExcStatus.OK : ExcStatus.Fail;
        return Ok(response);
    }
    /// <summary>
    /// 保存單筆網站選單項目
    /// </summary>
    [HttpPut(nameof(SaveMenuItem)), LibRequireFuncAct(FuncAction.Update)]
    [ProducesResponseType(typeof(ApiResponse<SaveMenuItemResult_DTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SaveMenuItem(ApiRequest<SaveMenuItem_DTO> data, CancellationToken ct)
    {
        var req = data.Data;
        OperateLogModel opLog = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(SaveMenuItem)}", OperateUser.UserId, JsonConvert.SerializeObject(req), Request.Headers["HTTP_CLIENT_IP"].ToString());
        var result = await ((SiteMenuBiz)Service).SaveMenuItemAsync(req, ct);
        await EvictForSetAsync(ct, req.InternalId);
        if (ct == CancellationToken.None) opLog.ExcStatus = ExcStatus.CancelExc;
        var response = new ApiResponse<SaveMenuItemResult_DTO>() { Data = [result], SysMessage = Message.Messages };
        opLog.ExcStatus = response.IsSuccess ? ExcStatus.OK : ExcStatus.Fail;
        return Ok(response);
    }
    /// <summary>
    /// 保存網站基本資訊
    /// </summary>
    [HttpPut(nameof(SaveSiteInfo)), LibRequireFuncAct(FuncAction.Update)]
    public async Task<IActionResult> SaveSiteInfo(ApiRequest<SaveSiteInfo_DTO> data, CancellationToken ct)
    {
        var req = data.Data;
        OperateLogModel opLog = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(SaveSiteInfo)}", OperateUser.UserId, JsonConvert.SerializeObject(req), Request.Headers["HTTP_CLIENT_IP"].ToString());

        await ((SiteMenuBiz)Service).SaveSiteInfoAsync(
            req.InternalId,
            req.SiteMenu_Index.GoogleAnalytics,
            req.SiteMenu_Index.Enable,
            req.SiteMenu_Index.DefaultLang,
            req.SiteMenu_Index.SupportLangs,
            ToSiteMenuIndexInfoModels(req.SiteMenu_IndexInfo),
            ct);

        await EvictForSetAsync(ct, req.InternalId);
        if (ct == CancellationToken.None) opLog.ExcStatus = ExcStatus.CancelExc;

        var response = new ApiResponse<SaveSiteInfo_DTO>() { Data = [req], SysMessage = Message.Messages };
        opLog.ExcStatus = response.IsSuccess ? ExcStatus.OK : ExcStatus.Fail;
        return Ok(response);
    }
    #endregion

    #region Private
    /// <summary>
    /// 將站台多語 DTO 轉成 Biz 使用的 Model
    /// </summary>
    private List<SiteMenu_IndexInfoModel> ToSiteMenuIndexInfoModels(List<SiteMenu_IndexInfo_DTO> src)
    {
        return [.. (src ?? []).Select(x => new SiteMenu_IndexInfoModel()
        {
            SiteIndex = x.SiteIndex,
            RowId = x.RowId,
            Lang = x.Lang,
            Title = x.Title,
            Description = x.Description,
            BannerId = x.BannerId,
            SiteHeader = x.SiteHeader,
            SiteFooter = x.SiteFooter,
            Keyword = x.Keyword,
        })];
    }
    #endregion
}