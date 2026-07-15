using Microsoft.Data.SqlClient;
using NLog;
using System.Text.Json;
using System.Text.RegularExpressions;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
namespace WCMS.SysCore.Auditing.ErrorHandling;

public class ErrorHandlingMiddleware(RequestDelegate next, I18nCache i18n)
{
    #region Property
    private readonly RequestDelegate _next = next;
    private readonly I18nCache _i18n = i18n;

    // 一般 Logger（Info / Error）
    private static readonly Logger logger = LogManager.GetCurrentClassLogger();
    #endregion

    #region Public
    public async Task Invoke(HttpContext context, IErrorHelper message)
    {
        try
        {
            // 執行下個 middleware 或 controller
            await _next(context);
        }
        catch (Exception ex)
        {
            // 統一處理 Exception
            await HandleExceptionAsync(context, ex, message);
        }
    }
    #endregion

    #region Private
    private async Task HandleExceptionAsync(HttpContext context, Exception exception, IErrorHelper message)
    {
        // 1) 建立 API 回傳結構
        var apiRes = BuildApiResponse(message, exception);

        // 2) 寫入更完整的 log（含 request context + 分隔線）
        WriteExceptionLog(context, exception);

        // 3) 回傳 JSON
        await WriteJsonAsync(context, apiRes);
    }
    /// <summary>
    /// 建立 ApiResponse，並補上 SysMessage
    /// </summary>
    private ApiResponse<string> BuildApiResponse(IErrorHelper message, Exception exception)
    {
        // 執行：資料被使用的 FK 錯誤轉成可讀訊息
        if (TryAddForeignKeyUsedMessage(message, exception))
            return new ApiResponse<string>() { SysMessage = message.Messages };

        // 執行：非預期錯誤維持原本系統錯誤
        message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00001);

#if DEBUG
        message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00000, exception);
#endif

        return new ApiResponse<string>() { SysMessage = message.Messages };
    }
    /// <summary>
    /// 將錯誤以「一筆一區塊」的方式記錄，包含 request 必要資訊
    /// </summary>
    private void WriteExceptionLog(HttpContext context, Exception exception)
    {
        var req = context.Request;
        var traceId = context.TraceIdentifier ?? string.Empty;
        var method = req.Method ?? string.Empty;
        var path = req.Path.HasValue ? req.Path.Value! : string.Empty;
        var query = req.QueryString.HasValue ? req.QueryString.Value : string.Empty;
        var ip = context.Connection?.RemoteIpAddress?.ToString() ?? string.Empty;
        var lang = req.Headers.TryGetValue(SysParam.HttpHeaders.AcceptLanguage, out var al) ? al.ToString() : string.Empty;
        var userName = context.User?.Identity?.IsAuthenticated == true ? (context.User.Identity?.Name ?? "(no-name)") : "(anonymous)";
        var sep = $@"
============================================================
";

        // ✅ 用 logger.Error(exception, ...) 會自動把 inner exception 全部吐出來（比 message/stacktrace 分兩行好）
        logger.Error(exception, $@"{sep}
TraceId: {traceId}
User: {userName}
IP: {ip}
Lang: {lang}
Request: {method} {path}{query}
{sep}
");
    }
    /// <summary>
    /// 回傳 JSON（統一 ContentType）
    /// </summary>
    private async Task WriteJsonAsync(HttpContext context, ApiResponse<string> apiRes)
    {
        context.Response.ContentType = SysParam.MediaTypes.ApplicationJson;
        await context.Response.WriteAsync(JsonSerializer.Serialize(apiRes));
    }
    /// <summary>
    /// 嘗試將 SQL FK 使用中錯誤轉成使用者可讀訊息。
    /// </summary>
    private bool TryAddForeignKeyUsedMessage(IErrorHelper message, Exception exception)
    {
        SqlException? sqlException = GetSqlException(exception);
        if (sqlException == null || sqlException.Number != 547) return false;
        if (!sqlException.Message.Contains("REFERENCE", StringComparison.OrdinalIgnoreCase)) return false;
        var info = ParseForeignKeyUsedInfo(sqlException.Message);
        message.AddMessage(MessageStatus.Error,SysMessageCode.BECode00020, _i18n.GetDtoFirstTypeLabel(info.TableName), _i18n.GetDtoFirstPropertyLabel(info.TableName, info.ColumnName), info.ActionName);
        return true;
    }
    /// <summary>
    /// 從例外鏈中取得 SqlException。
    /// </summary>
    private static SqlException? GetSqlException(Exception exception)
    {
        Exception? current = exception;
        while (current != null)
        {
            if (current is SqlException sqlException) return sqlException;
            current = current.InnerException;
        }
        return null;
    }
    /// <summary>
    /// 解析 FK 錯誤內的資料表、欄位與動作。
    /// </summary>
    private static ForeignKeyUsedInfo ParseForeignKeyUsedInfo(string errorMessage)
    {
        string tableName = ParseRegexValue(errorMessage, @"(?:table|資料表)\s+""(?:[^"".]+\.)?(?<value>[^""]+)""");
        string columnName = ParseRegexValue(errorMessage, @"(?:column|資料行)\s+'(?<value>[^']+)'");
        string actionName = GetDbActionName(errorMessage);
        return new ForeignKeyUsedInfo(tableName, columnName, actionName);
    }
    /// <summary>
    /// 解析 Regex 群組值。
    /// </summary>
    private static string ParseRegexValue(string value, string pattern)
    {
        var match = Regex.Match(value, pattern, RegexOptions.IgnoreCase);
        return match.Success ? match.Groups["value"].Value : "未知資料";
    }
    /// <summary>
    /// 依 SQL 訊息判斷目前動作。
    /// </summary>
    private static string GetDbActionName(string errorMessage)
    {
        // 執行：刪除失敗
        if (errorMessage.Contains("DELETE", StringComparison.OrdinalIgnoreCase)) return "刪除";
        // 執行：更新失敗
        if (errorMessage.Contains("UPDATE", StringComparison.OrdinalIgnoreCase)) return "更新";
        return "保存";
    }

    /// <summary>
    /// FK 使用中錯誤資訊。
    /// </summary>
    private sealed record ForeignKeyUsedInfo(string TableName, string ColumnName, string ActionName);
    #endregion
}
