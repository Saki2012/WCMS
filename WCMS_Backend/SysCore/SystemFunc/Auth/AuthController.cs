using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Crypto.Generators;
using System.Security.Claims;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;

namespace WCMS.SysCore.SystemFunc.Auth
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class AuthController(ITokenService tokenSvc, IUserRepository users, IConfiguration cfg) : ControllerBase
    {
        #region Property
        private readonly ITokenService _tokenSvc = tokenSvc;
        private readonly IUserRepository _users = users; // 你現有的 Repo
        private readonly IConfiguration _cfg = cfg;
        #endregion

        #region Public
        [HttpPost(nameof(Login))]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _users.FindByAccountAsync(dto.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(); // 不暴露細節，弱掃得分

            var (access, jti, exp) = _tokenSvc.IssueAccessToken(user);
            var (refresh, rid, rExp) = _tokenSvc.IssueRefreshToken(user);
            await _tokenSvc.StoreRefreshAsync(user.Id.ToString(), rid, rExp);

            // Refresh Token 走 HttpOnly Cookie（防 XSS）
            Response.Cookies.Append("rt", refresh, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = rExp
            });

            return Ok(new { token = access, expireAt = exp, user = new { user.Id, user.UserName, user.Role } });
        }

        [HttpPost(nameof(Refresh))]
        public async Task<IActionResult> Refresh([FromHeader(Name = "X-CSRF-Token")] string csrf)
        {
            // 驗 CSRF：前端呼叫前先向 /auth/csrf 拿一次 token，這邊比對（簡化略）
            if (string.IsNullOrEmpty(csrf)) return Forbid();

            var rt = Request.Cookies["rt"];
            if (string.IsNullOrEmpty(rt)) return Unauthorized();

            var parsed = JwtHelper.ReadRefresh(rt, _cfg); // 你現有 LibJWT 可擴充
            if (!await _tokenSvc.ValidateRefreshAsync(parsed.UserId, parsed.TokenId)) return Unauthorized();

            var user = await _users.FindByIdAsync(Guid.Parse(parsed.UserId));
            var (access, jti, exp) = _tokenSvc.IssueAccessToken(user);
            return Ok(new { token = access, expireAt = exp });
        }

        [Authorize]
        [HttpPost(nameof(Logout))]
        public async Task<IActionResult> Logout()
        {
            var jti = User.FindFirstValue(JwtRegisteredClaimNames.Jti);
            var expUnix = long.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Exp)!);
            var ttl = DateTimeOffset.FromUnixTimeSeconds(expUnix) - DateTimeOffset.UtcNow;
            await _tokenSvc.BlacklistAccessAsync(jti!, ttl > TimeSpan.Zero ? ttl : TimeSpan.FromMinutes(1));

            Response.Cookies.Delete("rt", new CookieOptions { Secure = true, SameSite = SameSiteMode.None });
            // 可同時 Revoke refresh（略）
            return Ok();
        }

        [Authorize(Roles = "Admin")]
        [HttpGet(nameof(Me))]
        public IActionResult Me() =>
            Ok(new { id = User.FindFirstValue(ClaimTypes.NameIdentifier), name = User.Identity!.Name });
        #endregion
    }
}
