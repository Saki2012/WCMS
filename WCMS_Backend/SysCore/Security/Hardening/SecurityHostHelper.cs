using System.Net;

namespace WCMS.SysCore.Security.Hardening;

/// <summary>
/// 提供安全設定共用的 Host、來源與 Loopback 判斷。
/// </summary>
internal static class SecurityHostHelper
{
    #region Public
    /// <summary>
    /// 讀取指定白名單區段並轉成不區分大小寫的 Host 集合。
    /// </summary>
    public static HashSet<string> GetAllowedHosts(IConfiguration configuration, string sectionName)
    {
        var hosts = configuration.GetSection(sectionName).Get<string[]>() ?? [];
        return hosts.Select(GetHostOnly).Where(x => !string.IsNullOrWhiteSpace(x)).ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 取得對外實際主機，優先使用 X-Forwarded-Host。
    /// </summary>
    public static string GetEffectiveHost(HttpContext context)
    {
        var forwardedHost = context.Request.Headers[SysParam.HttpHeaders.ForwardedHost].FirstOrDefault();
        var rawHost = !string.IsNullOrWhiteSpace(forwardedHost) ? forwardedHost : context.Request.Host.Value;
        return GetHostOnly(rawHost);
    }

    /// <summary>
    /// 判斷目前請求是否來自本機 Loopback。
    /// </summary>
    public static bool IsLoopback(HttpContext context)
    {
        var remoteIp = context.Connection.RemoteIpAddress;
        return remoteIp is not null && IPAddress.IsLoopback(remoteIp);
    }

    /// <summary>
    /// 判斷來源 Uri 是否位於允許的 Host 集合。
    /// </summary>
    public static bool IsAllowedOrigin(string origin, HashSet<string> allowedHosts)
    {
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
        return allowedHosts.Contains(uri.Host);
    }

    /// <summary>
    /// 嘗試解析來源 Uri。
    /// </summary>
    public static Uri? TryParseUri(string? value)
    {
        return !string.IsNullOrWhiteSpace(value) && Uri.TryCreate(value, UriKind.Absolute, out var uri) ? uri : null;
    }
    #endregion

    #region Private
    /// <summary>
    /// 去除 Host 中的 Port。
    /// </summary>
    private static string GetHostOnly(string? hostPort)
    {
        if (string.IsNullOrWhiteSpace(hostPort)) return string.Empty;
        var host = hostPort.Trim();
        var separatorIndex = host.IndexOf(':');
        return separatorIndex >= 0 ? host[..separatorIndex] : host;
    }
    #endregion
}
