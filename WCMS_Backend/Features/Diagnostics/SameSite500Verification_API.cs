using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;
using WCMS.SysCore.Security.IdentityAccess.Authorization;

namespace WCMS.Features.Diagnostics;

/// <summary>
/// 提供 SameSite 弱掃複驗使用的受控 HTTP 500 驗證端點。
/// 僅供已登入且具系統管理者權限的人員人工驗證；不列入 Swagger，且需額外驗證 Header。
/// </summary>
[ApiController]
[Route("Service/Diagnostics/SameSite500")]
[Authorize]
[ApiExplorerSettings(IgnoreApi = true)]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class SameSite500VerificationController(
    ICurrentUserAccessor current,
    IPermissionCache permissionCache) : ControllerBase
{
    #region Property
    private const string VerificationHeaderName = "X-WCMS-Security-Verification";
    private const string VerificationHeaderValue = "SameSite500";
    private const string DiagnosticCookieName = "wcms.diag500";
    #endregion

    #region Public
    /// <summary>
    /// 實際拋出未處理例外，驗證 ErrorHandlingMiddleware 的 HTTP 500 回應不會額外發行 Cookie。
    /// </summary>
    [HttpGet("Throw")]
    public async Task<IActionResult> Throw(CancellationToken ct)
    {
        IActionResult? rejected = await ValidateVerificationRequestAsync(ct);
        if (rejected != null) return rejected;

        throw new InvalidOperationException("Controlled SameSite 500 verification exception.");
    }

    /// <summary>
    /// 回傳 HTTP 500 並刻意寫入未自行指定 SameSite／Secure 的短效診斷 Cookie，
    /// 驗證中央 CookiePolicy 在 500 Response 上仍會套用安全屬性。
    /// </summary>
    [HttpGet("Cookie")]
    public async Task<IActionResult> Cookie(CancellationToken ct)
    {
        IActionResult? rejected = await ValidateVerificationRequestAsync(ct);
        if (rejected != null) return rejected;

        Response.Cookies.Append(
            DiagnosticCookieName,
            Guid.NewGuid().ToString("N"),
            new CookieOptions
            {
                Path = "/",
                HttpOnly = true,
                IsEssential = true,
                Expires = DateTimeOffset.UtcNow.AddMinutes(5),
            });

        return StatusCode(
            StatusCodes.Status500InternalServerError,
            new
            {
                message = "Controlled SameSite 500 CookiePolicy verification.",
                cookie = DiagnosticCookieName,
            });
    }
    #endregion

    #region Private
    /// <summary>
    /// 限制驗證端點僅能由系統管理者搭配明確驗證 Header 呼叫，避免一般操作誤觸。
    /// </summary>
    private async Task<IActionResult?> ValidateVerificationRequestAsync(CancellationToken ct)
    {
        string verificationValue = Request.Headers[VerificationHeaderName].ToString();
        if (!string.Equals(verificationValue, VerificationHeaderValue, StringComparison.Ordinal)) return NotFound();

        EffectivePermissionSet effective = await permissionCache.GetEffectivePermissionsAsync(current.User.UserId, ct);
        return effective.IsAdmin ? null : Forbid();
    }
    #endregion
}
