using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.SystemFunc.UserRolePermission.Role;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.Auth
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class AuthController(ITokenService tokenSvc, IConfiguration cfg, IAuthService authBiz) : ControllerBase
    {
        #region Property
        private readonly ITokenService _tokenSvc = tokenSvc;
        private readonly IConfiguration _cfg = cfg;
        private readonly IAuthService _authBiz=authBiz;
        #endregion

        #region Public
        /// <summary>
        /// 登入
        /// </summary>
        /// <param name="req"></param>
        /// <returns></returns>
        [HttpPost(nameof(Login)), AllowAnonymous] public async Task<IActionResult> Login([FromBody] LoginDto req)
        {
            if (string.IsNullOrWhiteSpace(req?.Account) || string.IsNullOrWhiteSpace(req?.Password)) return BadRequest("帳密不可為空");

            // 1) 登入帳號
            var r = await _authBiz.SignInAsync(req.Account, req.Password);
            if (!r.ok) return Unauthorized();

            // 2) 簽發 AccessToken
            var (accessToken, jti, accessExp) = _tokenSvc.IssueAccessToken(r.user);

            // 3) 產生 Refresh 資料並寫入 HttpOnly Cookie（同源 HTTPS）
            var (refreshToken, tokenId, refreshExp) = _tokenSvc.IssueRefreshToken(r.user);
            await _tokenSvc.StoreRefreshAsync(r.user.UserId, tokenId, refreshExp);

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

            // ⬅ Anti-CSRF（非 HttpOnly）
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
            // 4) 回傳給前端
            var result = new User_DTO
            {
                UserId = r.user.UserId,
                UserName = r.user.UserName,
                AccountStatus = r.user.AccountStatus,
            };
            return Ok(result);
        }
        /// <summary>
        /// 刷新狀態
        /// </summary>
        /// <param name="xsrfHeader"></param>
        /// <returns></returns>
        [HttpPost(nameof(Refresh)), AllowAnonymous] public async Task<IActionResult> Refresh([FromHeader(Name = "X-CSRF-Token")] string? xsrfHeader)
        {
            // 1) 取 Cookie + 驗 CSRF
            if (!Request.Cookies.TryGetValue("rtid", out var oldRtid))
                return Unauthorized("No refresh token id.");

            var xsrfCookie = Request.Cookies["XSRF-TOKEN"];
            if (string.IsNullOrEmpty(xsrfHeader) || xsrfHeader != xsrfCookie)
                return Unauthorized("Invalid CSRF.");

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
        [HttpPost(nameof(Logout)), Authorize] public async Task<IActionResult> Logout()
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
            Response.Cookies.Delete("rtid", delOpt);
            Response.Cookies.Delete("XSRF-TOKEN", delOpt);
            Response.Cookies.Delete("access", delOpt);

            return Ok();
        }
        /// <summary>
        /// 取得目前登入者（驗證 JWT；失效就 401）
        /// </summary>
        [HttpGet(nameof(Me)), Authorize] public IActionResult Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var userName = User.FindFirstValue(ClaimTypes.Name) ?? userId;
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "User";
            // 回傳你前端需要的最小欄位；之後要接 DB 再補充
            return Ok(new
            {
                Id = userId,
                Name = userName,
                Role = role
            });
        }
        #endregion

        #region DTO
        public sealed class LoginDto
        {
            public string Account { get; set; } = "";
            public string Password { get; set; } = "";
        }

        public sealed class User_DTO
        {
            /// <summary>
            /// 使用者編號
            /// </summary>
            [LibDesc] public string UserId { get; set; }
            /// <summary>
            /// 使用者名稱
            /// </summary>
            [LibDesc] public string UserName { get; set; }
            /// <summary>
            /// 帳戶狀態
            /// </summary>
            [LibDesc] public AccountStatus AccountStatus { get; set; }
        }
        #endregion
    }
}
