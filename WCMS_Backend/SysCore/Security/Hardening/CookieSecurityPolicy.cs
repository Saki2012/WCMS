namespace WCMS.SysCore.Security.Hardening;

/// <summary>
/// 定義 Cookie SameSite 的語意型安全 Profile。
/// </summary>
internal enum CookieSecurityProfile
{
    DefaultStrict,
    NavigationLax,
    ExplicitCrossSite,
}

/// <summary>
/// 集中解析 Server-issued Cookie 的 SameSite 與 Secure 安全政策。
/// </summary>
internal static class CookieSecurityPolicy
{
    #region Public
    /// <summary>
    /// 依 Cookie 名稱套用中央 Security Profile；未列例外者一律採 Strict。
    /// </summary>
    public static void Apply(string cookieName, CookieOptions options, bool secure)
    {
        CookieSecurityProfile profile = Resolve(cookieName);
        options.SameSite = profile switch
        {
            CookieSecurityProfile.NavigationLax => SameSiteMode.Lax,
            CookieSecurityProfile.ExplicitCrossSite => SameSiteMode.None,
            _ => SameSiteMode.Strict,
        };
        options.Secure = secure;
    }
    #endregion

    #region Private
    /// <summary>
    /// 解析具名 Cookie Security Profile；目前 Backend 尚無核准的 Lax／None 例外。
    /// </summary>
    private static CookieSecurityProfile Resolve(string cookieName)
    {
        _ = cookieName;
        return CookieSecurityProfile.DefaultStrict;
    }
    #endregion
}
