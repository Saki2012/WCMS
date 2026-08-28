using WCMS.SysCore.Constants;
namespace WCMS.SysCore.PlatformServices.Cookies.Visitor;

/// <summary>
/// 定義匿名 Visitor Cookie 的角色屬性。
/// </summary>
internal static class VisitorCookieDefinitions
{
    #region Property
    public static readonly CookieDefinition Visitor = new(
        SysParam.CookieNames.VisitorKey,
        HttpOnly: true,
        IsEssential: true,
        Path: SysParam.CookiePaths.Root);
    #endregion
}
