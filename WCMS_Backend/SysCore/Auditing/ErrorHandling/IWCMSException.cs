namespace WCMS.SysCore.Auditing.ErrorHandling;

/// <summary>
/// 定義 WCMS 可辨識例外提供給 SysMessage 的訊息資訊。
/// </summary>
public interface IWCMSException
{
    /// <summary>
    /// 前端安全訊息使用的系統訊息代碼。
    /// </summary>
    string MessageCode { get; }

    /// <summary>
    /// 系統訊息格式化時使用的參數。
    /// </summary>
    object[] MessageArgs { get; }
}
