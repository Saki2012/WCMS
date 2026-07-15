using System.Net;
using System.Net.Sockets;

namespace WCMS.SysCore.PlatformServices.SystemMonitor;

/// <summary>
/// 提供目前應用程式所在主機的網路識別資訊。
/// </summary>
internal static class HostNetworkInfo
{
    #region Property
    /// <summary>
    /// 延遲保存目前 Process 解析到的主機 IPv4 位址。
    /// </summary>
    private static readonly Lazy<string> LocalIPv4Value = new(ResolveLocalIPv4);
    /// <summary>
    /// 取得目前主機解析到的 IPv4 位址。
    /// </summary>
    internal static string LocalIPv4 => LocalIPv4Value.Value;
    #endregion

    #region Private
    /// <summary>
    /// 解析目前主機可使用的 IPv4 位址。
    /// </summary>
    private static string ResolveLocalIPv4()
    {
        try
        {
            IPAddress[] addresses = Dns.GetHostAddresses(Dns.GetHostName());
            IPAddress? address = addresses.FirstOrDefault(IsPreferredIPv4)
                ?? addresses.FirstOrDefault(ip => ip.AddressFamily == AddressFamily.InterNetwork);
            return address?.ToString() ?? string.Empty;
        }
        catch (SocketException)
        {
            return string.Empty;
        }
    }
    /// <summary>
    /// 判斷 IP 是否為非 Loopback 的 IPv4 位址。
    /// </summary>
    private static bool IsPreferredIPv4(IPAddress ip)
    {
        return ip.AddressFamily == AddressFamily.InterNetwork && !IPAddress.IsLoopback(ip);
    }
    #endregion
}
