using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Newtonsoft.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
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
    IPermissionCache permissionCache,
    IWebHostEnvironment environment) : ControllerBase
{
    #region Property
    private const int FingerprintLength = 12;
    private const int LoginValidationFilterOrder = -3000;
    private const string GenericLoginError = "帳號或密碼錯誤";
    private readonly TokenService _tokenSvc = tokenSvc;
    private readonly IConfiguration _cfg = cfg;
    private readonly AuthBiz _authBiz = authBiz;
    private readonly LoginAttemptCache _loginAttemptCache = loginAttemptCache;
    private readonly IPermissionCache _permissionCache = permissionCache;
    private readonly IWebHostEnvironment _environment = environment;
    private AuthCookieService AuthCookieService => HttpContext.RequestServices.GetRequiredService<AuthCookieService>();
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
    [HttpPost(nameof(Login)), AllowAnonymous, LoginCredentialValidationFilter(Order = LoginValidationFilterOrder)]
    public async Task<IActionResult> Login([FromBody] LoginDto req)
    {
        OperateLog.AddOperateLog(nameof(Login), req.Account, JsonConvert.SerializeObject(req.Account), Request.Headers[SysParam.HttpHeaders.ClientIp].ToString());
        CancellationToken ct = HttpContext.RequestAborted;
        int attempts = await _loginAttemptCache.GetAttemptsAsync(req.Account, ct);
        if (attempts >= 3) return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "登入嘗試過多，請稍後再試。" });
        var (ok, userInfo) = await _authBiz.CheckLoginValid(req.Account, req.Password);
        if (!ok || userInfo == null)
        {
            await _loginAttemptCache.SetAttemptsAsync(req.Account, attempts + 1, ct);
            return Unauthorized(GenericLoginError);
        }
        await _loginAttemptCache.ClearAsync(req.Account, ct);
        var (accessToken, _, accessExp) = _tokenSvc.IssueAccessToken(userInfo);
        var (tokenId, refreshExp) = _tokenSvc.IssueRefreshToken();
        await _tokenSvc.StoreRefreshAsync(userInfo.UserId, tokenId, refreshExp, ct);
        AuthCookieService.WriteSession(accessToken, accessExp, tokenId, refreshExp);
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
        if (!Request.Cookies.TryGetValue(SysParam.CookieNames.RefreshTokenId, out var oldRtid)) return Unauthorized("No refresh token id.");
        var xsrfCookie = Request.Cookies[SysParam.CookieNames.XsrfToken];
        if (string.IsNullOrEmpty(xsrfHeader) || xsrfHeader != xsrfCookie) return Unauthorized("Invalid XSRF.");
        var userId = await _tokenSvc.GetUserIdByRefreshIdAsync(oldRtid, ct);
        if (string.IsNullOrEmpty(userId)) return Unauthorized("Refresh not found.");
        var user = await _authBiz.FindByAccountAsync(userId);
        if (user is null) return Unauthorized("User disabled.");
        var (access, _, accessExp) = _tokenSvc.IssueAccessToken(user);
        var (newRtid, refreshExp) = _tokenSvc.IssueRefreshToken();
        bool rotated = await _tokenSvc.TryRotateRefreshAsync(user.UserId, oldRtid, newRtid, refreshExp, ct);
        if (!rotated) return Unauthorized("Refresh already consumed.");
        AuthCookieService.WriteSession(access, accessExp, newRtid, refreshExp);
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
        var jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
        var ttl = TimeSpan.FromMinutes(int.Parse(_cfg[SysParam.Configuration.Jwt.AccessTokenMinutesPath] ?? "1440"));
        if (!string.IsNullOrEmpty(jti)) await _tokenSvc.BlacklistAccessAsync(jti, ttl, ct);
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        if (Request.Cookies.TryGetValue(SysParam.CookieNames.RefreshTokenId, out var rtid) && !string.IsNullOrEmpty(userId)) await _tokenSvc.RevokeRefreshAsync(rtid, ct);
        OperateLog followInfo = new OperateLog();
        followInfo.APIName = nameof(Logout);
        followInfo.UserId = OperateUser.UserId;
        followInfo.followingDT = JsonConvert.SerializeObject(new { Cookies = new[] { SysParam.CookieNames.RefreshTokenId, SysParam.CookieNames.AccessToken, SysParam.CookieNames.XsrfToken } });
        followInfo.IP = Request.Headers[SysParam.HttpHeaders.ClientIp].ToString();
        OperateLog.AddOperateLog(followInfo);
        AuthCookieService.DeleteSession();
        Response.Cookies.Delete(SysParam.CookieNames.XsrfToken, new CookieOptions { Path = SysParam.CookiePaths.Root });
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

    /// <summary>
    /// 取得 Development 環境登入 Session 診斷資訊，正式環境永遠不提供此端點內容。
    /// </summary>
    [HttpGet(nameof(SessionDiagnostics)), Authorize, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> SessionDiagnostics(CancellationToken ct)
    {
        if (!_environment.IsDevelopment()) return NotFound();
        AuthSessionDiagnostics_DTO diagnostics = await BuildSessionDiagnosticsAsync(ct);
        return Ok(diagnostics);
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

    /// <summary>
    /// 彙整目前 Request 的 Token、Cookie 與 Cache 診斷狀態。
    /// </summary>
    private async Task<AuthSessionDiagnostics_DTO> BuildSessionDiagnosticsAsync(CancellationToken ct)
    {
        DateTime now = DateTime.UtcNow;
        string userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        Request.Cookies.TryGetValue(SysParam.CookieNames.AccessToken, out string? accessToken);
        Request.Cookies.TryGetValue(SysParam.CookieNames.RefreshTokenId, out string? refreshId);
        string? refreshOwner = string.IsNullOrEmpty(refreshId) ? null : await _tokenSvc.GetUserIdByRefreshIdAsync(refreshId, ct);
        JwtSecurityToken? jwt = ReadJwt(accessToken);
        string jti = jwt?.Id ?? User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value ?? string.Empty;
        bool blacklisted = !string.IsNullOrEmpty(jti) && await _tokenSvc.IsAccessBlacklistedAsync(jti, ct);
        return BuildSessionDiagnosticsModel(now, userId, refreshOwner, accessToken, refreshId, jwt, jti, blacklisted);
    }

    /// <summary>
    /// 建立可安全回傳給 Development UI 的 Session 診斷模型。
    /// </summary>
    private AuthSessionDiagnostics_DTO BuildSessionDiagnosticsModel(DateTime now, string userId, string? refreshOwner, string? accessToken, string? refreshId, JwtSecurityToken? jwt, string jti, bool blacklisted)
    {
        DateTime? accessExpires = jwt?.ValidTo == DateTime.MinValue ? null : jwt?.ValidTo;
        int? remaining = accessExpires.HasValue ? Math.Max(0, (int)Math.Floor((accessExpires.Value - now).TotalSeconds)) : null;
        return new AuthSessionDiagnostics_DTO
        {
            ServerTimeUtc = now,
            AccessExpiresAtUtc = accessExpires,
            AccessRemainingSeconds = remaining,
            AccessTokenMinutes = int.Parse(_cfg[SysParam.Configuration.Jwt.AccessTokenMinutesPath] ?? "1440"),
            RefreshTokenDays = int.Parse(_cfg[SysParam.Configuration.Jwt.RefreshTokenDaysPath] ?? "7"),
            AccessCookiePresent = !string.IsNullOrEmpty(accessToken),
            RefreshCookiePresent = !string.IsNullOrEmpty(refreshId),
            RefreshCacheHit = !string.IsNullOrEmpty(refreshOwner),
            RefreshOwnerMatchesCurrentUser = !string.IsNullOrEmpty(refreshOwner) && string.Equals(refreshOwner, userId, StringComparison.OrdinalIgnoreCase),
            XsrfCookiePresent = Request.Cookies.ContainsKey(SysParam.CookieNames.XsrfToken),
            AccessBlacklisted = blacklisted,
            AccessJtiFingerprint = BuildFingerprint(jti),
            RefreshFingerprint = BuildFingerprint(refreshId),
            AuthenticationType = User.Identity?.AuthenticationType ?? string.Empty,
            EnvironmentName = _environment.EnvironmentName,
        };
    }

    /// <summary>
    /// 僅解析目前 Access Cookie 的 JWT Metadata，不執行第二次身分驗證。
    /// </summary>
    private static JwtSecurityToken? ReadJwt(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        try
        {
            return new JwtSecurityTokenHandler().ReadJwtToken(token);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// 將敏感識別值轉為不可逆短指紋，避免 Diagnostics 洩漏 Token 原文。
    /// </summary>
    private static string BuildFingerprint(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes)[..FingerprintLength];
    }

    /// <summary>
    /// 將 Login DTO 自動驗證失敗統一成認證失敗回應，避免透過狀態差異枚舉帳號。
    /// </summary>
    private sealed class LoginCredentialValidationFilterAttribute : ActionFilterAttribute
    {
        /// <summary>
        /// 在 ApiController 內建 ModelState Filter 前攔截 Login 驗證失敗。
        /// </summary>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (context.ModelState.IsValid) return;
            context.Result = new UnauthorizedObjectResult(GenericLoginError);
        }
    }
    #endregion
}
