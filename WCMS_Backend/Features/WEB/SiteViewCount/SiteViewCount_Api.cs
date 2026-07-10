using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Enum.SysParam;
namespace WCMS.Features.WEB.SiteViewCount;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.SiteViewCount, FuncAction.Report)]
public class SiteViewCountController : ApiDataQueryController<SiteViewCountHeaderModel>
{
    #region Public
    /// <summary>
    /// 計算主站整體瀏覽次數
    /// </summary>
    [HttpPost(nameof(TryCountSiteView)), AllowAnonymous, IgnoreAntiforgeryToken]
    [ProducesResponseType(typeof(ApiResponse<TryCountResult_DTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TryCountResult_DTO>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TryCountSiteView([FromBody] TryCountSiteViewRequest_DTO request, CancellationToken ct)
    {
        return await ExecuteSiteViewAsync(request, ct);
    }
    /// <summary>
    /// 計算頁面瀏覽次數
    /// </summary>
    [HttpPost(nameof(TryCountPageView)), AllowAnonymous, IgnoreAntiforgeryToken]
    public async Task<IActionResult> TryCountPageView([FromBody] TryCountDetailViewRequest_DTO request, CancellationToken ct)
    {
        return await ExecuteDetailViewAsync(request, ViewCountActionType.PageView, ct);
    }
    /// <summary>
    /// 計算檔案預覽次數
    /// </summary>
    [HttpPost(nameof(TryCountFilePreview)), AllowAnonymous, IgnoreAntiforgeryToken]
    public async Task<IActionResult> TryCountFilePreview([FromBody] TryCountDetailViewRequest_DTO request, CancellationToken ct)
    {
        return await ExecuteDetailViewAsync(request, ViewCountActionType.FilePreview, ct);
    }
    /// <summary>
    /// 計算檔案下載次數
    /// </summary>
    [HttpPost(nameof(TryCountFileDownload)), AllowAnonymous, IgnoreAntiforgeryToken]
    public async Task<IActionResult> TryCountFileDownload([FromBody] TryCountDetailViewRequest_DTO request, CancellationToken ct)
    {
        return await ExecuteDetailViewAsync(request, ViewCountActionType.FileDownload, ct);
    }
    /// <summary>
    /// 計算連結點擊次數
    /// </summary>
    [HttpPost(nameof(TryCountLinkClick)), AllowAnonymous, IgnoreAntiforgeryToken]
    public async Task<IActionResult> TryCountLinkClick([FromBody] TryCountDetailViewRequest_DTO request, CancellationToken ct)
    {
        return await ExecuteDetailViewAsync(request, ViewCountActionType.LinkClick, ct);
    }
    /// <summary>
    /// 查詢最近 10 分鐘內站台瀏覽人數
    /// </summary>
    [HttpPost(nameof(GetRecentlySiteViewCount)), AllowAnonymous, IgnoreAntiforgeryToken]
    [ProducesResponseType(typeof(ApiResponse<GetCurrentSiteOnlineCountResult_DTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<GetCurrentSiteOnlineCountResult_DTO>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetRecentlySiteViewCount([FromBody] GetCurrentSiteOnlineCountRequest_DTO request, CancellationToken ct)
    {
        GetCurrentSiteOnlineCountResult_DTO result = await ((SiteViewCountFunc_Biz)Service).BizGetRecentlySiteViewCount(request?.SiteIndex ?? string.Empty, ct);
        ApiResponse<GetCurrentSiteOnlineCountResult_DTO> response = new() { Data = [result], SysMessage = Message.Messages, };
        return Message.HasError ? BadRequest(response) : Ok(response);
    }

    /// <summary>
    /// 取得 SiteViewCount Form Model 結構
    /// 僅供 Swagger / 前端型別產生使用
    /// </summary>
    [HttpGet(nameof(GetSiteViewCountHeaderSchema)), AllowAnonymous, IgnoreAntiforgeryToken]
    [ProducesResponseType(typeof(ApiResponse<SiteViewCountHeaderModel>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<SiteViewCountHeaderModel>> GetSiteViewCountHeaderSchema()
    {
        ApiResponse<SiteViewCountHeaderModel> response = new()
        {
            Data = [new SiteViewCountHeaderModel()],
            SysMessage = [],
        };

        return Ok(response);
    }
    #endregion

    #region Private
    /// <summary>
    /// 執行主站整體瀏覽計次
    /// </summary>
    private async Task<IActionResult> ExecuteSiteViewAsync(TryCountSiteViewRequest_DTO request, CancellationToken ct)
    {
        string visitorKey = GetVisitorKey();
        string refererUrl = GetRefererUrl();
        TryCountResult_DTO result = await ((SiteViewCountFunc_Biz)Service).BizUpdateSiteViewCount(request?.SiteIndex ?? string.Empty, visitorKey, refererUrl, ct);
        ApiResponse<TryCountResult_DTO> response = new() { Data = [result], SysMessage = Message.Messages, };
        return Message.HasError ? BadRequest(response) : Ok(response);
    }
    /// <summary>
    /// 執行功能/頁面個別計次
    /// </summary>
    private async Task<IActionResult> ExecuteDetailViewAsync(TryCountDetailViewRequest_DTO request, ViewCountActionType actionType, CancellationToken ct)
    {
        string visitorKey = GetVisitorKey();
        string refererUrl = GetRefererUrl();
        TryCountResult_DTO result = await ((SiteViewCountFunc_Biz)Service).BizUpdatePageViewCount(request?.SiteIndex ?? string.Empty, request?.ProgId ?? string.Empty, request?.InternalId ?? string.Empty, actionType, visitorKey, refererUrl, ct);
        ApiResponse<TryCountResult_DTO> response = new() { Data = [result], SysMessage = Message.Messages, };
        return Message.HasError ? BadRequest(response) : Ok(response);
    }

    /// <summary>
    /// 取得匿名訪客識別碼，若不存在則建立 Cookie
    /// </summary>
    private string GetVisitorKey()
    {
        string? visitorKey = Request.Cookies[CookieNames.VisitorKey];
        if (!string.IsNullOrWhiteSpace(visitorKey)) return visitorKey.Trim();
        visitorKey = Guid.NewGuid().ToString("N");
        Response.Cookies.Append(CookieNames.VisitorKey, visitorKey, BuildVisitorCookieOptions());
        return visitorKey;
    }
    /// <summary>
    /// 取得 Referer URL
    /// </summary>
    private string GetRefererUrl()
    {
        return Request.Headers.Referer.ToString().Trim();
    }
    /// <summary>
    /// 建立匿名訪客 Cookie 設定
    /// </summary>
    private CookieOptions BuildVisitorCookieOptions()
    {
        return new CookieOptions { HttpOnly = true, IsEssential = true, SameSite = SameSiteMode.Lax, Secure = Request.IsHttps, Expires = DateTimeOffset.UtcNow.AddYears(1),};
    }
    #endregion
}