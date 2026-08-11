using System.Globalization;
using WCMS.Features._Resx;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;
namespace WCMS.SysCore.Auditing.ErrorHandling;

/// <summary>
/// 定義 WCMS 系統訊息的建立與收集能力。
/// </summary>
public interface IErrorHelper
{
    #region Property
    /// <summary>
    /// 目前 Request 已建立的系統訊息。
    /// </summary>
    IList<SysMessageModel> Messages { get; set; }
    /// <summary>
    /// 判斷目前訊息集合是否包含錯誤。
    /// </summary>
    bool HasError { get; }
    #endregion

    #region Public
    /// <summary>
    /// 加入 Request 或 Validation 錯誤訊息。
    /// </summary>
    void AddRequestError(string code, params object[] args);
    /// <summary>
    /// 加入系統異常的安全訊息，未指定代碼時使用未知異常訊息。
    /// </summary>
    void AddExceptionError(string code = SysMessageCode.BECode00001, params object[] args);
    /// <summary>
    /// 相容既有多筆訊息加入方式。
    /// </summary>
    void AddMessage(List<SysMessageModel> messages);
    /// <summary>
    /// 相容既有訊息建立方式。
    /// </summary>
    void AddMessage(MessageStatus status, string code, params object[] args);
    /// <summary>
    /// 相容既有單筆訊息加入方式。
    /// </summary>
    void AddMessage(SysMessageModel message);
    #endregion
}

/// <summary>
/// 集中將 SysMessageCode 轉為多語系訊息並保存於目前 Request。
/// </summary>
public class ErrorHelper : IErrorHelper
{
    #region Property
    public enum LogType { info, oprate, error }
    public IList<SysMessageModel> Messages { get; set; } = [];
    public bool HasError => Messages.Any(message => message.Status == MessageStatus.Error);
    #endregion

    #region Public
    /// <summary>
    /// 加入 Request 或 Validation 錯誤，狀態固定為 Error。
    /// </summary>
    public void AddRequestError(string code, params object[] args)
    {
        AddMessageCore(MessageStatus.Error, code, args);
    }
    /// <summary>
    /// 加入系統異常的安全訊息，避免回傳原始 Exception 內容。
    /// </summary>
    public void AddExceptionError(string code = SysMessageCode.BECode00001, params object[] args)
    {
        AddMessageCore(MessageStatus.Error, code, args);
    }
    /// <summary>
    /// 相容既有多筆訊息加入方式，後續逐步改用語意化入口。
    /// </summary>
    public void AddMessage(List<SysMessageModel> messages)
    {
        foreach (SysMessageModel message in messages) AddMessage(message);
    }
    /// <summary>
    /// 相容既有單筆訊息加入方式，後續逐步改用語意化入口。
    /// </summary>
    public void AddMessage(SysMessageModel message)
    {
        Messages.Add(message);
    }
    /// <summary>
    /// 相容既有訊息建立方式，後續逐步改用語意化入口。
    /// </summary>
    public void AddMessage(MessageStatus status, string code, params object[] args)
    {
        AddMessageCore(status, code, args);
    }
    /// <summary>
    /// 依 SysMessageCode 取得目前語系的訊息內容。
    /// </summary>
    public static string GetResxMsg(string code, params object[] args)
    {
        string coreBaseName = typeof(SysMessageCode).FullName!;
        string? specBaseName = string.IsNullOrWhiteSpace(SpecSettings.SpecCode) ? null : $"{SysParam.NamespacePrefixes.SpecFeatures}{SpecSettings.SpecCode}.Resx.SpecMessageCode";
        var assembly = typeof(SysMessageCode).Assembly;
        string? text = LibResxReader.TryGetSpecOrCore(coreBaseName, specBaseName, assembly, code, CultureInfo.CurrentUICulture);
        if (string.IsNullOrWhiteSpace(text)) return $@"【{code}】";
        if (args.Length == 0) return text;
        try { return string.Format(CultureInfo.CurrentCulture, text, args); }
        catch (FormatException) { return $@"【{code}】"; }
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立多語系系統訊息並加入目前訊息集合。
    /// </summary>
    private void AddMessageCore(MessageStatus status, string code, params object[] args)
    {
        string messageCode = string.IsNullOrWhiteSpace(code) ? SysMessageCode.BECode00001 : code;
        SysMessageModel message = new() { Status = status, MessageCode = messageCode, Message = GetResxMsg(messageCode, args) };
        Messages.Add(message);
    }
    #endregion
}
