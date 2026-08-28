using WCMS.SysCore.Constants;
namespace WCMS.SysCore.PlatformServices.Cookies.Visitor;

/// <summary>
/// 管理匿名 Visitor Cookie 的建立與讀取生命週期。
/// </summary>
internal sealed class VisitorCookieService(CookieService cookieService)
{
    #region Public
    /// <summary>
    /// 取得既有 Visitor Key；不存在時建立新的匿名識別碼與一年期 Cookie。
    /// </summary>
    public string GetOrCreate()
    {
        string? current = cookieService.Read(VisitorCookieDefinitions.Visitor)?.Trim();
        if (!string.IsNullOrWhiteSpace(current)) return current;
        string visitorKey = Guid.NewGuid().ToString(SysParam.Formats.GuidCompact);
        cookieService.Write(VisitorCookieDefinitions.Visitor, visitorKey, DateTimeOffset.UtcNow.AddYears(1));
        return visitorKey;
    }
    #endregion
}
