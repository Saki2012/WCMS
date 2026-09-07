using WCMS.SysCore.Constants;
namespace WCMS.SysCore.PlatformServices.Cookies;

/// <summary>
/// 描述 Server-issued Cookie 的穩定角色屬性；SameSite 與 Secure 由 Security Policy 最終決定。
/// </summary>
public sealed record CookieDefinition(
    string Name,
    bool HttpOnly,
    bool IsEssential = false,
    string Path = SysParam.CookiePaths.Root,
    string? Domain = null);
