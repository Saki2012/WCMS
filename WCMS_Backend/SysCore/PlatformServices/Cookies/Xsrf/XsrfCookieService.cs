namespace WCMS.SysCore.PlatformServices.Cookies.Xsrf;

/// <summary>
/// 管理 XSRF Request Token Cookie 的寫入生命週期。
/// </summary>
public sealed class XsrfCookieService(CookieService cookieService)
{
    #region Public
    /// <summary>
    /// 寫入前端可讀取的 XSRF Request Token Cookie。
    /// </summary>
    public void WriteRequestToken(string requestToken)
    {
        cookieService.Write(XsrfCookieDefinitions.RequestToken, requestToken);
    }
    #endregion
}
