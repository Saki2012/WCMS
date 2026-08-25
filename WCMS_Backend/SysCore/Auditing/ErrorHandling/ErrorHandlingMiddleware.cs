using Microsoft.Data.SqlClient;
using NLog;
using System.Text.RegularExpressions;
using WCMS.Features._Resx;
using WCMS.SysCore.Auditing.Logging;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Persistence.Normalization;

namespace WCMS.SysCore.Auditing.ErrorHandling;

public class ErrorHandlingMiddleware(RequestDelegate next, I18nCache i18n)
{
    #region Property
    private const string LogSeparator = "============================================================";
    private readonly RequestDelegate _next = next;
    private readonly I18nCache _i18n = i18n;
    private static readonly Logger logger = NLogSetup.GetHttpLogger();
    #endregion

    #region Public
    /// <summary>
    /// 執行後續 HTTP 管線並統一處理未捕捉的例外。
    /// </summary>
    public async Task Invoke(HttpContext context, IErrorHelper message)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            int statusCode = AddErrorMessage(message, exception);
            if (statusCode == StatusCodes.Status500InternalServerError) WriteExceptionLog(context, exception);
            if (context.Response.HasStarted) throw;
            await WriteExceptionResponseAsync(context, statusCode, message);
        }
    }
    #endregion

    #region Private
    /// <summary>
    /// 依例外類型加入安全訊息並回傳對應的 HTTP Status。
    /// </summary>
    private int AddErrorMessage(IErrorHelper message, Exception exception)
    {
        if (TryAddWCMSQueryConditionMessage(message, exception)) return StatusCodes.Status400BadRequest;
        if (TryAddWCMSJsonMessage(message, exception)) return StatusCodes.Status400BadRequest;
        if (TryAddWCMSFieldValidationMessage(message, exception)) return StatusCodes.Status400BadRequest;
        if (TryAddForeignKeyValueMessage(message, exception)) return StatusCodes.Status400BadRequest;
        if (TryAddWCMSDataConcurrencyMessage(message, exception)) return StatusCodes.Status409Conflict;
        if (TryAddForeignKeyUsedMessage(message, exception)) return StatusCodes.Status409Conflict;
        if (TryAddForeignKeyMissingMessage(message, exception)) return StatusCodes.Status409Conflict;
        if (TryAddDuplicateDataMessage(message, exception)) return StatusCodes.Status409Conflict;

        message.AddExceptionError();
        return StatusCodes.Status500InternalServerError;
    }

    /// <summary>
    /// 將完整例外與目前 Request 識別資訊寫入 HTTP NLog。
    /// </summary>
    private static void WriteExceptionLog(HttpContext context, Exception exception)
    {
        HttpRequest request = context.Request;
        string traceId = context.TraceIdentifier ?? string.Empty;
        string method = request.Method ?? string.Empty;
        string path = request.Path.HasValue ? request.Path.Value! : string.Empty;
        string ip = context.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
        string lang = request.Headers.TryGetValue(SysParam.HttpHeaders.AcceptLanguage, out var acceptLanguage) ? acceptLanguage.ToString() : string.Empty;
        var identity = context.User.Identity;
        string userName = identity?.IsAuthenticated == true ? identity.Name ?? "(no-name)" : "(anonymous)";

        logger.Error(exception, $@"{LogSeparator}
TraceId: {traceId}
User: {userName}
IP: {ip}
Lang: {lang}
Request: {method} {path}
{LogSeparator}");
    }

    /// <summary>
    /// 以指定 HTTP Status 回傳統一的 API 錯誤訊息與空 Data。
    /// </summary>
    private static async Task WriteExceptionResponseAsync(HttpContext context, int statusCode, IErrorHelper message)
    {
        ApiResponse<object> response = new() { SysMessage = message.Messages, Data = [] };
        await WriteJsonAsync(context, statusCode, response);
    }

    /// <summary>
    /// 以指定 HTTP Status 回傳統一 ApiResponse JSON。
    /// </summary>
    private static async Task WriteJsonAsync(HttpContext context, int statusCode, ApiResponse<object> response)
    {
        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = SysParam.MediaTypes.ApplicationJson;
        await context.Response.WriteAsJsonAsync(response, context.RequestAborted);
    }

    /// <summary>
    /// 將 WCMS 查詢條件例外轉成 Request Error。
    /// </summary>
    private static bool TryAddWCMSQueryConditionMessage(IErrorHelper message, Exception exception)
    {
        WCMSQueryConditionException? queryException = GetInnerException<WCMSQueryConditionException>(exception);
        if (queryException == null) return false;
        AddWCMSExceptionMessage(message, queryException);
        return true;
    }

    /// <summary>
    /// 將 WCMS JSON 解析例外轉成 Request Error。
    /// </summary>
    private static bool TryAddWCMSJsonMessage(IErrorHelper message, Exception exception)
    {
        WCMSJsonException? jsonException = GetInnerException<WCMSJsonException>(exception);
        if (jsonException == null) return false;
        AddWCMSExceptionMessage(message, jsonException);
        return true;
    }

    /// <summary>
    /// 將 SaveChanges 前的 LibField 驗證失敗轉成欄位可讀的 Request Error。
    /// </summary>
    private bool TryAddWCMSFieldValidationMessage(IErrorHelper message, Exception exception)
    {
        WCMSFieldValidationException? validationException = GetInnerException<WCMSFieldValidationException>(exception);
        if (validationException == null) return false;

        string label = _i18n.GetDtoFirstPropertyLabel(validationException.EntityName, validationException.PropertyName);
        object[] args = [.. validationException.MessageArgs];
        if (args.Length > 0) args[0] = string.IsNullOrWhiteSpace(label) ? validationException.PropertyName : label;
        message.AddRequestError(validationException.MessageCode, args);
        return true;
    }

    /// <summary>
    /// 將 WCMS 資料競爭例外轉成 Conflict Error。
    /// </summary>
    private static bool TryAddWCMSDataConcurrencyMessage(IErrorHelper message, Exception exception)
    {
        WCMSDataConcurrencyException? concurrencyException = GetInnerException<WCMSDataConcurrencyException>(exception);
        if (concurrencyException == null) return false;
        AddWCMSExceptionMessage(message, concurrencyException);
        return true;
    }

    /// <summary>
    /// 依 WCMS 例外契約加入安全的 SysMessage。
    /// </summary>
    private static void AddWCMSExceptionMessage(IErrorHelper message, IWCMSException exception)
    {
        message.AddRequestError(exception.MessageCode, exception.MessageArgs);
    }

    /// <summary>
    /// 將字串外鍵格式錯誤轉成欄位可讀的 Request Error。
    /// </summary>
    private bool TryAddForeignKeyValueMessage(IErrorHelper message, Exception exception)
    {
        ForeignKeyValueValidationException? validationException = GetInnerException<ForeignKeyValueValidationException>(exception);
        if (validationException == null) return false;

        string label = _i18n.GetDtoFirstPropertyLabel(validationException.EntityName, validationException.PropertyName);
        if (string.IsNullOrWhiteSpace(label)) label = validationException.PropertyName;
        message.AddRequestError(SysMessageCode.BECode00035, label);
        return true;
    }

    /// <summary>
    /// 將 SQL 外鍵使用中錯誤轉成可讀的 Conflict 訊息。
    /// </summary>
    private bool TryAddForeignKeyUsedMessage(IErrorHelper message, Exception exception)
    {
        SqlException? sqlException = GetInnerException<SqlException>(exception);
        if (sqlException == null || sqlException.Number != 547) return false;
        if (!sqlException.Message.Contains("REFERENCE", StringComparison.OrdinalIgnoreCase)) return false;

        ForeignKeyUsedInfo info = ParseForeignKeyUsedInfo(sqlException.Message);
        message.AddRequestError(SysMessageCode.BECode00020,
            _i18n.GetDtoFirstTypeLabel(info.TableName),
            _i18n.GetDtoFirstPropertyLabel(info.TableName, info.ColumnName),
            info.ActionName);
        return true;
    }

    /// <summary>
    /// 將不存在或已變更的外鍵目標轉成資料狀態衝突。
    /// </summary>
    private static bool TryAddForeignKeyMissingMessage(IErrorHelper message, Exception exception)
    {
        SqlException? sqlException = GetInnerException<SqlException>(exception);
        if (sqlException == null || sqlException.Number != 547) return false;

        bool isForeignKey = sqlException.Message.Contains("FOREIGN KEY", StringComparison.OrdinalIgnoreCase)
            || sqlException.Message.Contains("外部索引鍵", StringComparison.OrdinalIgnoreCase);
        if (!isForeignKey) return false;

        message.AddRequestError(SysMessageCode.BECode00044);
        return true;
    }

    /// <summary>
    /// 將 SQL 重複鍵或唯一索引衝突轉成資料重複 Conflict。
    /// </summary>
    private static bool TryAddDuplicateDataMessage(IErrorHelper message, Exception exception)
    {
        SqlException? sqlException = GetInnerException<SqlException>(exception);
        if (sqlException == null) return false;

        bool isDuplicate = sqlException.Number is 2627 or 2601;
        if (!isDuplicate) return false;

        message.AddRequestError(SysMessageCode.BECode00045);
        return true;
    }

    /// <summary>
    /// 從例外鏈中取得指定型別的 Exception。
    /// </summary>
    private static TException? GetInnerException<TException>(Exception exception) where TException : Exception
    {
        Exception? current = exception;
        while (current != null)
        {
            if (current is TException result) return result;
            current = current.InnerException;
        }
        return null;
    }

    /// <summary>
    /// 解析外鍵錯誤內的資料表、欄位與動作。
    /// </summary>
    private static ForeignKeyUsedInfo ParseForeignKeyUsedInfo(string errorMessage)
    {
        string tableName = ParseRegexValue(errorMessage, @"(?:table|資料表)\s+""(?:[^"".]+\.)?(?<value>[^""]+)""");
        string columnName = ParseRegexValue(errorMessage, @"(?:column|資料行)\s+'(?<value>[^']+)'");
        string actionName = GetDbActionName(errorMessage);
        return new ForeignKeyUsedInfo(tableName, columnName, actionName);
    }

    /// <summary>
    /// 解析指定 Regex 群組值。
    /// </summary>
    private static string ParseRegexValue(string value, string pattern)
    {
        Match match = Regex.Match(value, pattern, RegexOptions.IgnoreCase);
        return match.Success ? match.Groups["value"].Value : "未知資料";
    }

    /// <summary>
    /// 依 SQL 錯誤內容判斷目前資料動作。
    /// </summary>
    private static string GetDbActionName(string errorMessage)
    {
        if (errorMessage.Contains("DELETE", StringComparison.OrdinalIgnoreCase)) return "刪除";
        if (errorMessage.Contains("UPDATE", StringComparison.OrdinalIgnoreCase)) return "更新";
        return "保存";
    }

    /// <summary>
    /// 保存外鍵使用中錯誤的解析資訊。
    /// </summary>
    private sealed record ForeignKeyUsedInfo(string TableName, string ColumnName, string ActionName);
    #endregion
}
