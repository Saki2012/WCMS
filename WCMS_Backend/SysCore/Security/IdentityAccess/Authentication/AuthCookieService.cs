using WCMS.SysCore.PlatformServices.Cookies;
namespace WCMS.SysCore.Security.IdentityAccess.Authentication;

/// <summary>
/// 管理 Access／Refresh Cookie 的寫入與刪除生命週期。
/// </summary>
internal sealed class AuthCookieService(CookieService cookieService)
{
    #region Public
    /// <summary>
    /// 寫入目前登入 Session 使用的 Access 與 Refresh Cookie。
    /// </summary>
    public void WriteSession(string accessToken, DateTimeOffset accessExpires, string refreshTokenId, DateTimeOffset refreshExpires)
    {
        cookieService.Write(AuthCookieDefinitions.AccessToken, accessToken, accessExpires);
        cookieService.Write(AuthCookieDefinitions.RefreshToken, refreshTokenId, refreshExpires);
    }

    /// <summary>
    /// 刪除目前登入 Session 使用的 Access 與 Refresh Cookie。
    /// </summary>
    public void DeleteSession()
    {
        cookieService.Delete(AuthCookieDefinitions.AccessToken);
        cookieService.Delete(AuthCookieDefinitions.RefreshToken);
    }
    #endregion
}
