using System.Text.Json;

namespace WCMS.SysCore.Auditing.ErrorHandling;

/// <summary>
/// 表示 WCMS API JSON 內容無法依目標型別正確解析。
/// </summary>
public sealed class WCMSJsonException : JsonException, IWCMSException
{
    #region Property
    /// <summary>
    /// 前端安全訊息使用的系統訊息代碼。
    /// </summary>
    public string MessageCode { get; }

    /// <summary>
    /// 系統訊息格式化時使用的參數。
    /// </summary>
    public object[] MessageArgs { get; }
    #endregion

    #region Construct
    /// <summary>
    /// 建立 WCMS JSON 解析例外，保留原始例外供後端診斷使用。
    /// </summary>
    public WCMSJsonException(
        string messageCode,
        Exception innerException,
        params object[] messageArgs)
        : base("WCMS JSON value is invalid.", innerException)
    {
        MessageCode = messageCode;
        MessageArgs = messageArgs ?? [];
    }
    #endregion
}
