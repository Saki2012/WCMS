
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.SysCore.FeatureDriver.Model.Contracts;

/// <summary>
/// 訊息狀態
/// </summary>
public enum MessageStatus : byte
{
    /// <summary>
    /// 執行成功
    /// </summary>
    Green = 0,
    /// <summary>
    /// 訊息
    /// </summary>
    Info = 1,
    /// <summary>
    /// 警告
    /// </summary>
    Warning = 2,
    /// <summary>
    /// 錯誤
    /// </summary>
    Error = 3,
}

/// <summary>
/// 提示訊息包
/// </summary>
public class SysMessageModel
{
    /// <summary>
    /// 訊息狀態
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public MessageStatus Status { get; set; }
    /// <summary>
    /// 訊息碼
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public string MessageCode { get; set; } = string.Empty;
    /// <summary>
    /// 訊息內容(透過resx獲取實際訊息)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public string Message { get; set; } = string.Empty;
}