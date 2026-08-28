namespace WCMS.SysCore.PlatformServices.Cookies;

/// <summary>
/// 提供 Server-issued Cookie 的共用讀取、寫入與刪除入口；安全傳輸屬性由 Cookie Policy Middleware 最終套用。
/// </summary>
internal sealed class CookieService(IHttpContextAccessor httpContextAccessor)
{
    #region Property
    private HttpContext Context => httpContextAccessor.HttpContext ?? throw new InvalidOperationException("CookieService requires an active HttpContext.");
    #endregion

    #region Public
    /// <summary>
    /// 讀取指定 Cookie Definition 的目前值。
    /// </summary>
    public string? Read(CookieDefinition definition)
    {
        return Context.Request.Cookies.TryGetValue(definition.Name, out string? value) ? value : null;
    }

    /// <summary>
    /// 依 Cookie Definition 寫入值與必要生命週期。
    /// </summary>
    public void Write(CookieDefinition definition, string value, DateTimeOffset? expires = null)
    {
        Context.Response.Cookies.Append(definition.Name, value, BuildOptions(definition, expires));
    }

    /// <summary>
    /// 依 Cookie Definition 使用一致 Path／Domain 刪除 Cookie。
    /// </summary>
    public void Delete(CookieDefinition definition)
    {
        Context.Response.Cookies.Delete(definition.Name, BuildOptions(definition));
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立角色層 CookieOptions；SameSite 與 Secure 保留給中央 Security Policy。
    /// </summary>
    private static CookieOptions BuildOptions(CookieDefinition definition, DateTimeOffset? expires = null)
    {
        var options = new CookieOptions
        {
            HttpOnly = definition.HttpOnly,
            IsEssential = definition.IsEssential,
            Path = definition.Path,
            Expires = expires,
        };
        if (!string.IsNullOrWhiteSpace(definition.Domain)) options.Domain = definition.Domain;
        return options;
    }
    #endregion
}
