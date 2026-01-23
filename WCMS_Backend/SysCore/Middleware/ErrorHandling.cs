using System.Text.Json;
using NLog;
using WCMS.SysCore.I18n.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.Middleware
{
    public class ErrorHandlingMiddleware(RequestDelegate next)
    {
        #region Property
        private readonly RequestDelegate _next = next;

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
            message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00001);

#if DEBUG
            // DEBUG 額外帶 exception（你原本就有這段）
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
            var lang = req.Headers.TryGetValue("Accept-Language", out var al) ? al.ToString() : string.Empty;
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
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(apiRes));
        }
        #endregion
    }
}
