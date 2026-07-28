using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using System.Security.Claims;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.IAM.Auth
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class AuthController(
        IMemoryCache cache,
        ITokenService tokenSvc,
        IConfiguration cfg,
        IAuthService authBiz,
        ILibPermissionChecker permissionChecker) : ControllerBase
    {
        #region Property
        private readonly ITokenService _tokenSvc = tokenSvc;
        private readonly IConfiguration _cfg = cfg;
        private readonly IAuthService _authBiz = authBiz;
        private readonly ILibPermissionChecker _permissionChecker = permissionChecker;
        private readonly IMemoryCache _cache = cache;
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
            OperateLog.AddOperateLog(nameof(Login), req.Account, JsonConvert.SerializeObject(req.Account), Request.Headers["HTTP_CLIENT_IP"].ToString());
            const string GENERIC_LOGIN_ERROR = "帳號或密碼錯誤";
            var key = $"login_attempts:{req.Account}";
            var attempts = _cache.Get<int>(key);
            if (attempts >= 3) return StatusCode(StatusCodes.Status429TooManyRequests, new { message = "登入嘗試過多，請稍後再試。" });
            var (ok, userInfo) = await _authBiz.CheckLoginValid(req.Account, req.Password);
            if (!ok || userInfo == null)
            {
                _cache.Set(key, attempts + 1, TimeSpan.FromMinutes(5)); // 五分鐘封鎖
                return Unauthorized(GENERIC_LOGIN_ERROR);
            }
            _cache.Remove(key); // 成功登入就清除計數
            _permissionChecker.InvalidateUser(userInfo.UserId); // 重新登入時讀取最新權限
            // 2) 簽發 AccessToken
            var (accessToken, jti, accessExp) = _tokenSvc.IssueAccessToken(userInfo);
            // 3) 產生 Refresh 資料並寫入 HttpOnly Cookie（同源 HTTPS）
            var (refreshToken, tokenId, refreshExp) = _tokenSvc.IssueRefreshToken(userInfo);
            await _tokenSvc.StoreRefreshAsync(userInfo.UserId, tokenId, refreshExp);
            // ✅ 同源 HTTPS（正式上線）：Secure=true；同源可用 Lax
            var baseOpt = new CookieOptions
            {
                Path = "/",
                Secure = true,
                SameSite = SameSiteMode.Lax
            };
            // ⬅ Refresh Id（HttpOnly）：名稱統一用 rtid
            Response.Cookies.Append("rtid", tokenId, new CookieOptions
            {
                HttpOnly = true,
                Secure = baseOpt.Secure,
                SameSite = baseOpt.SameSite,
                Path = baseOpt.Path,
                Expires = refreshExp
            });
            // ⬅ Anti-XSRF（非 HttpOnly）
            Response.Cookies.Append("XSRF-TOKEN", Guid.NewGuid().ToString("N"), new CookieOptions
            {
                HttpOnly = false,
                Secure = baseOpt.Secure,
                SameSite = baseOpt.SameSite,
                Path = baseOpt.Path,
                Expires = refreshExp
            });
            // ✅ 額外：把 AccessToken 也發成 HttpOnly Cookie，讓 JwtBearer 能從 Cookie 讀到
            Response.Cookies.Append("access", accessToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = baseOpt.Secure,
                SameSite = baseOpt.SameSite,
                Path = baseOpt.Path,
                Expires = accessExp
            });
            var userContext = await BuildCurrentUserContextAsync(userInfo, HttpContext.RequestAborted);
            return Ok(userContext);
        }
        /// <summary>
        /// 刷新狀態
        /// </summary>
        /// <param name="xsrfHeader"></param>
        /// <returns></returns>
        [HttpPost(nameof(Refresh)), AllowAnonymous]
        public async Task<IActionResult> Refresh([FromHeader(Name = "X-XSRF-Token")] string? xsrfHeader)
        {
            // 1) 取 Cookie + 驗 XSRF
            if (!Request.Cookies.TryGetValue("rtid", out var oldRtid))
                return Unauthorized("No refresh token id.");

            var xsrfCookie = Request.Cookies["XSRF-TOKEN"];
            if (string.IsNullOrEmpty(xsrfHeader) || xsrfHeader != xsrfCookie)
                return Unauthorized("Invalid XSRF.");

            // 2) 用 rtid 找回 userId
            var userId = await _tokenSvc.GetUserIdByRefreshIdAsync(oldRtid);
            if (string.IsNullOrEmpty(userId)) return Unauthorized("Refresh not found.");

            // 3) 從 DB 載入使用者與角色
            var user = await _authBiz.FindByAccountAsync(userId);
            if (user is null) return Unauthorized("User disabled.");

            //var roleIds = await rolesBiz.GetRolesByUserIdAsync(u.Id);
            //var user = new UserModel { UserId = u.Id, UserName = u.UserName, RoleId = roleIds.FirstOrDefault() ?? "User" };

            // 4) 簽新 token、旋轉 refresh
            var (access, jti, accessExp) = _tokenSvc.IssueAccessToken(user);
            var (_, newRtid, refreshExp) = _tokenSvc.IssueRefreshToken(user);
            await _tokenSvc.StoreRefreshAsync(user.UserId, newRtid, refreshExp);
            await _tokenSvc.RevokeRefreshAsync(user.UserId, oldRtid);

            // 5) 寫回 cookies（同源 HTTPS）
            var baseOpt = new CookieOptions { Path = "/", Secure = true, SameSite = SameSiteMode.Lax };

            Response.Cookies.Append("rtid", newRtid, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = refreshExp
            });

            Response.Cookies.Append("XSRF-TOKEN", xsrfCookie!, new CookieOptions
            {
                HttpOnly = false,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = refreshExp
            });

            // ⬅ 同步刷新 access cookie
            Response.Cookies.Append("access", access, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = "/",
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
            // Access 黑名單
            var jti = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti)?.Value;
            var ttl = TimeSpan.FromMinutes(int.Parse(_cfg["Jwt:AccessTokenMinutes"] ?? "15"));
            if (!string.IsNullOrEmpty(jti)) await _tokenSvc.BlacklistAccessAsync(jti, ttl);

            // 撤銷目前裝置的 refresh
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            if (Request.Cookies.TryGetValue("rtid", out var rtid) && !string.IsNullOrEmpty(userId))
                await _tokenSvc.RevokeRefreshAsync(userId, rtid);

            // 清 cookie
            var delOpt = new CookieOptions { Path = "/", Secure = true, SameSite = SameSiteMode.Lax };

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = nameof(Logout);
            followInfo.UserId = OperateUser.UserId;
            followInfo.followingDT = JsonConvert.SerializeObject(delOpt);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddOperateLog(followInfo);

            Response.Cookies.Delete("rtid", delOpt);
            Response.Cookies.Delete("XSRF-TOKEN", delOpt);
            Response.Cookies.Delete("access", delOpt);

            return Ok();
        }
        /// <summary>
        /// 取得目前登入者（驗證 JWT；失效就 401）
        /// </summary>
        [HttpGet(nameof(Me)), Authorize, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<IActionResult> Me(CancellationToken ct)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            var userInfo = await _authBiz.FindByAccountAsync(userId);
            if (userInfo == null) return Unauthorized("User disabled.");

            var userContext = await BuildCurrentUserContextAsync(userInfo, ct);
            return Ok(userContext);
        }
        #endregion

        #region Private
        /// <summary>
        /// 建立目前登入者與完整有效權限內容。
        /// </summary>
        private async Task<CurrentUserContext_DTO> BuildCurrentUserContextAsync(User_DTO user, CancellationToken ct)
        {
            var effective = await _permissionChecker.GetEffectivePermissionsAsync(user.UserId, ct);
            return new CurrentUserContext_DTO
            {
                User = user,
                IsAdmin = effective.IsAdmin,
                Permissions = effective.Permissions.ToDictionary(x => x.Key, x => x.Value, StringComparer.OrdinalIgnoreCase),
            };
        }
        #endregion
    }
}
