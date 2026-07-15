using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Security.Claims;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.Auditing.OperateLog;
using WCMS.SysCore.Security.IdentityAccess.Authentication;
using WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;
using WCMS.SysCore.Constants;
namespace WCMS.Features.IAM.Auth;

[ApiController, Route(SysParam.ApiRoutes.Service)]
public class AuthController(LoginAttemptCache loginAttemptCache, TokenService tokenSvc, IConfiguration cfg, IAuthService authBiz) : ControllerBase
{
    #region Property
    private readonly TokenService _tokenSvc = tokenSvc;
    private readonly IConfiguration _cfg = cfg;
    private readonly IAuthService _authBiz = authBiz;
    private readonly LoginAttemptCache _loginAttemptCache = loginAttemptCache;
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
        if (!ok)
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
        var baseOpt = new CookieOptions
        {
            Path = SysParam.CookiePaths.Root,
            Secure = true,
            SameSite = SameSiteMode.Lax
        };
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
        return Ok(userInfo);
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
        OperateLogModel followInfo = new OperateLogModel();
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
    [HttpGet(nameof(Me)), Authorize]
    public IActionResult Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var userName = User.FindFirstValue(ClaimTypes.Name) ?? userId;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "User";
        var interanlId = User.FindFirstValue(nameof(HeaderModel.InternalId)) ?? "";
        // 回傳你前端需要的最小欄位；之後要接 DB 再補充
        var dt = new
        {
            Id = userId,
            Name = userName,
            Role = role,
            InternalId = interanlId,
        };
        return Ok(dt);
    }
    #endregion
}
