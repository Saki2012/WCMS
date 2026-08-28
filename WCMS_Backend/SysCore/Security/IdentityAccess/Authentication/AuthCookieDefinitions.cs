using WCMS.SysCore.Constants;
using WCMS.SysCore.PlatformServices.Cookies;
namespace WCMS.SysCore.Security.IdentityAccess.Authentication;

/// <summary>
/// 定義 Authentication Cookie 的角色屬性。
/// </summary>
internal static class AuthCookieDefinitions
{
    #region Property
    public static readonly CookieDefinition AccessToken = new(
        SysParam.CookieNames.AccessToken,
        HttpOnly: true,
        Path: SysParam.CookiePaths.Root);

    public static readonly CookieDefinition RefreshToken = new(
        SysParam.CookieNames.RefreshTokenId,
        HttpOnly: true,
        Path: SysParam.CookiePaths.Root);
    #endregion
}
