using NLog;
using System.Text.Json;
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
                 await _next(context); // 執行下個 middleware 或 controller
            }
            //catch (DbUpdateException)
            //{

            //}
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex, message);
            }
        }
        #endregion

        #region Private
        private async Task HandleExceptionAsync(HttpContext context, Exception exception, IErrorHelper message)
        {
            var response = context.Response;
            response.ContentType = "application/json";
            var apiRes = new ApiResponse<string>() { SysMessage = message.Messages };
            switch (exception)
            {
                //case BusinessException:
                //    statusCode = (int)HttpStatusCode.BadRequest;
                //    result = new
                //    {
                //        success = false,
                //        errorCode = "INTERNAL_ERROR",
                //        message = exception.Message,
                //        data = exception.Data,
                //        detail = exception.Message
                //    };
                //    break;
                default:
                    message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00001);
                    logger.Error(exception.Message);
                    logger.Error(exception.StackTrace);
                    //response.StatusCode = StatusCodes
#if DEBUG
                    message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00000,exception);
#endif
                    break;
            }
            await response.WriteAsync(JsonSerializer.Serialize(apiRes));
        }
        #endregion
    }
}
