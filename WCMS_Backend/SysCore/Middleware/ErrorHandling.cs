using System.Net;
using System.Text.Json;

namespace WCMS.SysCore.Middleware
{
    public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        #region Property
        private readonly RequestDelegate _next = next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger = logger;
        #endregion

        #region Public
        public async Task Invoke(HttpContext context)
        {
            try
            {
                 await _next(context); // 執行下個 middleware 或 controller
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }
        #endregion

        #region Private
        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var response = context.Response;
            response.ContentType = "application/json";

            object result;
            int statusCode;

            switch (exception)
            {
                //case BusinessException ex:
                //    statusCode = (int)HttpStatusCode.BadRequest;
                //    result = new
                //    {
                //        success = false,
                //        errorCode = ex.Code,
                //        message = ex.Message,
                //        data = ex.ExtraData
                //    };
                //    break;

                default:
                    statusCode = (int)HttpStatusCode.InternalServerError;
                    result = new
                    {
                        success = false,
                        errorCode = "INTERNAL_ERROR",
                        message = "系統錯誤，請稍後再試。",
                        detail = exception.Message
                    };
                    break;
            }

            _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);

            response.StatusCode = statusCode;
            var json = JsonSerializer.Serialize(result);
            await response.WriteAsync(json);
        }
        #endregion
    }
}
