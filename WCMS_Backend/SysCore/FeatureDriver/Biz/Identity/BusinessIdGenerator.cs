namespace WCMS.SysCore.FeatureDriver.Biz.Identity;

/// <summary>
/// 建立 WCMS 每日業務流水編號。
/// </summary>
internal static class BusinessIdGenerator
{
    #region Property
    private const int SerialLength = 3;
    private const string SerialFormat = "D3";
    #endregion

    #region Internal
    /// <summary>
    /// 建立業務編號的每日固定前綴。
    /// </summary>
    internal static string BuildDailyPrefix(string prefix, DateTime now)
    {
        return prefix + now.ToString("yyyyMMdd");
    }
    /// <summary>
    /// 依目前最大編號建立下一個業務編號。
    /// </summary>
    internal static string BuildNextId(string dailyPrefix, string? maxId)
    {
        int nextSerial = ResolveNextSerial(dailyPrefix, maxId);
        return dailyPrefix + nextSerial.ToString(SerialFormat);
    }
    #endregion

    #region Private
    /// <summary>
    /// 從目前最大編號解析下一個流水值。
    /// </summary>
    private static int ResolveNextSerial(string dailyPrefix, string? maxId)
    {
        if (string.IsNullOrEmpty(maxId)) return 1;
        if (maxId.Length < dailyPrefix.Length + SerialLength) return 1;
        string serialText = maxId.Substring(dailyPrefix.Length, SerialLength);
        return int.TryParse(serialText, out int serial) ? serial + 1 : 1;
    }
    #endregion
}
