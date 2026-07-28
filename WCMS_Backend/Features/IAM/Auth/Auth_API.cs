using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Security.Claims;
using WCMS.SysCore.Auditing.OperateLog;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.Security.IdentityAccess.Authentication;
using WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.IAM.Auth;

[ApiController, Route(SysParam.ApiRoutes.Service)]
public class AuthController(
    LoginAttemptCache loginAttemptCache,
    TokenService tokenSvc,
    IConfiguration cfg,
    AuthBiz authBiz,
    IPermissionCache permissionCache) : ControllerBase
{
    #region Property
    private readonly TokenService _tokenSvc = tokenSvc;
    private readonly IConfiguration _cfg = cfg;
    private readonly AuthBiz _authBiz = authBiz;
    private readonly LoginAttemptCache _loginAttemptCache = loginAttemptCache;
    private readonly IPermissionCache _permissionCache = permissionCache;
    protected IOperateLog OperateLog => _OperateLog ??= HttpContext.RequestServices.GetRequiredService<IOperateLog>();
    private IOperateLog? _OperateLog;
    private ICurrentUserAccessor _Current;
    protected ICurrentUserAccessor Current => _Current ??= HttpContext.RequestServices.GetRequiredService<ICurrentUserAccessor>();
    public User_DTO OperateUser { get { return Current.User; } }
    #endregion

    #region Public
    /// <summary>
    /// 登入
    /// </summary>
    /// <param name="req"></param>
    /// <returns></returns>
    [HttpPost(nameof(Login)), AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto req)
    {
        OperateLog.AddOperateLog(nameof(Login), req.Account, JsonConvert.SerializeObject(req.Account), Request.Headers[SysParam.HttpHeaders.ClientIp].ToString());
        const string GENERIC_LOGIN_ERROR = "帳號或密碼錯誤";
        CancellationToken ct = HttpContext.RequestAborted;
        int attempts = await _loginAttemptCache.GetAttemptsAsync(req.Account, ct);
        if (attempts >= 3) return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "登入嘗試過多，請稍後再試。" });
        var (ok, userInfo) = await _authBiz.CheckLoginValid(req.Account, req.Password);
        if (!ok || userInfo == null)
        {
            await _loginAttemptCache.SetAttemptsAsync(req.Account, attempts + 1, ct);
            return Unauthorized(GENERIC_LOGIN_ERROR);
        }
        await _loginAttemptCache.ClearAsync(req.Account, ct);
        // 2) 簽發 AccessToken
        var (accessToken, _, accessExp) = _tokenSvc.IssueAccessToken(userInfo);
        // 3) 產生 Refresh 資料並寫入 HttpOnly Cookie（同源 HTTPS）
        var (tokenId, refreshExp) = _tokenSvc.IssueRefreshToken();
        await _tokenSvc.StoreRefreshAsync(userInfo.UserId, tokenId, refreshExp, ct);
        // ✅ 同源 HTTPS（正式上線）：Secure=true；同源可用 Lax
        var baseOpt = new CookieOptions { Path = SysParam.CookiePaths.Root, Secure = true, SameSite = SameSiteMode.Lax };
        // ⬅ Refresh Id（HttpOnly）：名稱統一用 rtid
        Response.Cookies.Append(SysParam.CookieNames.RefreshTokenId, tokenId, new CookieOptions
        {
            HttpOnly = true,
            Secure = baseOpt.Secure,
            SameSite = baseOpt.SameSite,
            Path = baseOpt.Path,
            Expires = refreshExp
        });
        // ⬅ Anti-XSRF（非 HttpOnly）
        Response.Cookies.Append(SysParam.CookieNames.XsrfToken, Guid.NewGuid().ToString(SysParam.Formats.GuidCompact), new CookieOptions
        {
            HttpOnly = false,
            Secure = baseOpt.Secure,
            SameSite = baseOpt.SameSite,
            Path = baseOpt.Path,
            Expires = refreshExp
        });
        // ✅ 額外：把 AccessToken 也發成 HttpOnly Cookie，讓 JwtBearer 能從 Cookie 讀到
        Response.Cookies.Append(SysParam.CookieNames.AccessToken, accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = baseOpt.Secure,
            SameSite = baseOpt.SameSite,
            Path = baseOpt.Path,
            Expires = accessExp
        });
        await _permissionCache.InvalidateUsersAsync([userInfo.UserId], ct);
        CurrentUserContext_DTO context = await BuildCurrentUserContextAsync(userInfo, ct);
        return Ok(context);
    }
    /// <summary>
    /// 刷新狀態
    /// </summary>
    /// <param name="xsrfHeader"></param>
    /// <returns></returns>
    [HttpPost(nameof(Refresh)), AllowAnonymous]
    public async Task<IActionResult> Refresh([FromHeader(Name = SysParam.HttpHeaders.XsrfToken)] string? xsrfHeader)
    {
        CancellationToken ct = HttpContext.RequestAborted;
        // 1) 取 Cookie + 驗 XSRF
        if (!Request.Cookies.TryGetValue(SysParam.CookieNames.RefreshTokenId, out var oldRtid))
            return Unauthorized("No refresh token id.");

        var xsrfCookie = Request.Cookies[SysParam.CookieNames.XsrfToken];
        if (string.IsNullOrEmpty(xsrfHeader) || xsrfHeader != xsrfCookie)
            return Unauthorized("Invalid XSRF.");

        // 2) 用 rtid 找回 userId
        var userId = await _tokenSvc.GetUserIdByRefreshIdAsync(oldRtid, ct);
        if (string.IsNullOrEmpty(userId)) return Unauthorized("Refresh not found.");

        // 3) 從 DB 載入使用者與角色
        var user = await _authBiz.FindByAccountAsync(userId);
        if (user is null) return Unauthorized("User disabled.");

        // 4) 簽新 token、旋轉 refresh
        var (access, _, accessExp) = _tokenSvc.IssueAccessToken(user);
        var (newRtid, refreshExp) = _tokenSvc.IssueRefreshToken();
        await _tokenSvc.StoreRefreshAsync(user.UserId, newRtid, refreshExp, ct);
        await _tokenSvc.RevokeRefreshAsync(oldRtid, ct);

        // 5) 寫回 cookies（同源 HTTPS）
        Response.Cookies.Append(SysParam.CookieNames.RefreshTokenId, newRtid, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = SysParam.CookiePaths.Root,
            Expires = refreshExp
        });

        Response.Cookies.Append(SysParam.CookieNames.XsrfToken, xsrfCookie!, new CookieOptions
        {
            HttpOnly = false,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = SysParam.CookiePaths.Root,
            Expires = refreshExp
        });

        // ⬅ 同步刷新 access cookie
        Response.Cookies.Append(SysParam.CookieNames.AccessToken, access, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = SysParam.CookiePaths.Root,
            Expires = accessExp
        });

        return Ok(new { AccessToken = access, ExpiresAt = accessExp });
    }
    /// <summary>
    /// 登出此裝置
    /// </summary>
    /// <returns></returns>
    [HttpPost(nameof(Logout)), Authorize]
    public async Task<IActionResult> Logout()
    {
        CancellationToken ct = HttpContext.RequestAborted;
        // Access 黑名單
        var jti = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;
        var ttl = TimeSpan.FromMinutes(int.Parse(_cfg[SysParam.Configuration.Jwt.AccessTokenMinutesPath] ?? "15"));
        if (!string.IsNullOrEmpty(jti)) await _tokenSvc.BlacklistAccessAsync(jti, ttl, ct);

        // 撤銷目前裝置的 refresh
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        if (Request.Cookies.TryGetValue(SysParam.CookieNames.RefreshTokenId, out var rtid) && !string.IsNullOrEmpty(userId))
            await _tokenSvc.RevokeRefreshAsync(rtid, ct);
        // 清 cookie
        var delOpt = new CookieOptions { Path = SysParam.CookiePaths.Root, Secure = true, SameSite = SameSiteMode.Lax };
        OperateLog followInfo = new OperateLog();
        followInfo.APIName = nameof(Logout);
        followInfo.UserId = OperateUser.UserId;
        followInfo.followingDT = JsonConvert.SerializeObject(delOpt);
        followInfo.IP = Request.Headers[SysParam.HttpHeaders.ClientIp].ToString();
        OperateLog.AddOperateLog(followInfo);
        Response.Cookies.Delete(SysParam.CookieNames.RefreshTokenId, delOpt);
        Response.Cookies.Delete(SysParam.CookieNames.XsrfToken, delOpt);
        Response.Cookies.Delete(SysParam.CookieNames.AccessToken, delOpt);
        return Ok();
    }
    /// <summary>
    /// 取得目前登入者（驗證 JWT；失效就 401）
    /// </summary>
    [HttpGet(nameof(Me)), Authorize, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        string userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        User_DTO? user = await _authBiz.FindByAccountAsync(userId);
        if (user == null) return Unauthorized("User disabled.");
        CurrentUserContext_DTO context = await BuildCurrentUserContextAsync(user, ct);
        return Ok(context);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立目前登入者與完整有效權限內容。
    /// </summary>
    private async Task<CurrentUserContext_DTO> BuildCurrentUserContextAsync(User_DTO user, CancellationToken ct)
    {
        EffectivePermissionSet effective = await _permissionCache.GetEffectivePermissionsAsync(user.UserId, ct);
        return new CurrentUserContext_DTO { User = user, IsAdmin = effective.IsAdmin, Permissions = effective.Permissions };
    }
    #endregion
}
