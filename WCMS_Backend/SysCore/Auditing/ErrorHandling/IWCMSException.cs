using System.Text.Json;

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

/// <summary>
/// 表示 WCMS API JSON 內容無法依目標型別正確解析。
/// </summary>
public sealed class WCMSJsonException : JsonException, IWCMSException
{
    #region Property
    public string MessageCode { get; }
    public object[] MessageArgs { get; }
    #endregion

    #region Construct
    /// <summary>
    /// 建立 WCMS JSON 解析例外，保留原始例外供後端診斷使用。
    /// </summary>
    public WCMSJsonException(string messageCode, Exception innerException, params object[] messageArgs)
        : base("WCMS JSON value is invalid.", innerException)
    {
        MessageCode = messageCode;
        MessageArgs = messageArgs ?? [];
    }
    #endregion
}

/// <summary>
/// 表示 WCMS 查詢條件無法依目前查詢契約正確解析。
/// </summary>
public sealed class WCMSQueryConditionException : Exception, IWCMSException
{
    #region Property
    public string MessageCode { get; }
    public object[] MessageArgs { get; }
    #endregion

    #region Construct
    /// <summary>
    /// 建立 WCMS 查詢條件例外，保留原始例外供後端診斷使用。
    /// </summary>
    public WCMSQueryConditionException(string messageCode, Exception innerException, params object[] messageArgs)
        : base("WCMS query condition is invalid.", innerException)
    {
        MessageCode = messageCode;
        MessageArgs = messageArgs ?? [];
    }
    #endregion
}

/// <summary>
/// 表示資料於保存前已被其他操作更新或刪除。
/// </summary>
public sealed class WCMSDataConcurrencyException : Exception, IWCMSException
{
    #region Property
    public string MessageCode { get; }
    public object[] MessageArgs { get; }
    #endregion

    #region Construct
    /// <summary>
    /// 建立 WCMS 資料競爭例外，保留原始例外供後端診斷使用。
    /// </summary>
    public WCMSDataConcurrencyException(string messageCode, Exception innerException, params object[] messageArgs)
        : base("WCMS data concurrency conflict.", innerException)
    {
        MessageCode = messageCode;
        MessageArgs = messageArgs ?? [];
    }
    #endregion
}

/// <summary>
/// 表示資料在持久化前未通過 WCMS LibField 最終驗證。
/// </summary>
public sealed class WCMSFieldValidationException : Exception, IWCMSException
{
    #region Property
    /// <summary>
    /// 驗證失敗的 Entity 型別名稱。
    /// </summary>
    public string EntityName { get; }

    /// <summary>
    /// 驗證失敗的 Property 名稱。
    /// </summary>
    public string PropertyName { get; }

    public string MessageCode { get; }
    public object[] MessageArgs { get; }
    #endregion

    #region Construct
    /// <summary>
    /// 建立 WCMS 欄位驗證例外，第一個訊息參數固定保留欄位名稱供 ErrorHandling 多語系轉換。
    /// </summary>
    public WCMSFieldValidationException(
        string entityName,
        string propertyName,
        string messageCode,
        params object[] messageArgs)
        : base("WCMS field validation failed.")
    {
        EntityName = entityName;
        PropertyName = propertyName;
        MessageCode = messageCode;
        MessageArgs = [propertyName, .. messageArgs];
    }
    #endregion
}
