using WCMS.SysCore.Constants;
namespace WCMS.SysCore.PlatformServices.Cookies.Xsrf;

/// <summary>
/// 定義前端可讀取並回送 Header 的 XSRF Request Token Cookie。
/// </summary>
internal static class XsrfCookieDefinitions
{
    #region Property
    public static readonly CookieDefinition RequestToken = new(
        SysParam.CookieNames.XsrfToken,
        HttpOnly: false,
        Path: SysParam.CookiePaths.Root);
    #endregion
}
