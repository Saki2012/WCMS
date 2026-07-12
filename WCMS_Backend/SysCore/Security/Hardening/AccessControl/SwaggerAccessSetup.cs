using System.Net;
namespace WCMS.SysCore.Security.Hardening.AccessControl;

/// <summary>
/// 管理開發與正式環境的 Swagger 啟用方式與本機存取限制。
/// </summary>
internal static class SwaggerAccessSetup
{
    #region Property
    private const string SwaggerPath = "/swagger";
    private const string SwaggerRoutePrefix = "swagger";
    private const string SwaggerEndpoint = "/swagger/v1/swagger.json";
    private const string SwaggerDocumentName = "WCMS API v1";
    private const string AllowedSwaggerHost = "127.0.0.1";
    #endregion

    #region Public
    /// <summary>
    /// 依目前環境啟用 Swagger，正式環境只允許本機存取。
    /// </summary>
    public static void Use(WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            UseDevelopmentSwagger(app);
            return;
        }
        UseProductionSwagger(app);
    }
    #endregion

    #region Private
    /// <summary>
    /// 開發環境直接啟用 Swagger 文件與介面。
    /// </summary>
    private static void UseDevelopmentSwagger(WebApplication app)
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    /// <summary>
    /// 正式環境加入 Swagger 本機限制後再啟用文件與介面。
    /// </summary>
    private static void UseProductionSwagger(WebApplication app)
    {
        app.UseWhen(IsSwaggerRequest, branch => branch.Use(ValidateLocalSwaggerAsync));
        app.UseWhen(IsLoopbackRequest, ConfigureSwaggerBranch);
    }

    /// <summary>
    /// 驗證正式環境 Swagger 是否由本機且指定 Host 存取。
    /// </summary>
    private static async Task ValidateLocalSwaggerAsync(HttpContext context, Func<Task> next)
    {
        var remoteIp = context.Connection.RemoteIpAddress;
        var isAllowed = remoteIp is not null && IPAddress.IsLoopback(remoteIp)
            && string.Equals(context.Request.Host.Host, AllowedSwaggerHost, StringComparison.OrdinalIgnoreCase);
        if (isAllowed)
        {
            await next();
            return;
        }
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsync("Swagger is local-only.");
    }

    /// <summary>
    /// 在本機請求分支中啟用 Swagger Middleware。
    /// </summary>
    private static void ConfigureSwaggerBranch(IApplicationBuilder branch)
    {
        branch.UseSwagger();
        branch.UseSwaggerUI(options =>
        {
            options.RoutePrefix = SwaggerRoutePrefix;
            options.SwaggerEndpoint(SwaggerEndpoint, SwaggerDocumentName);
        });
    }

    /// <summary>
    /// 判斷是否為 Swagger 路徑。
    /// </summary>
    private static bool IsSwaggerRequest(HttpContext context)
    {
        return context.Request.Path.StartsWithSegments(SwaggerPath, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 判斷是否為本機請求。
    /// </summary>
    private static bool IsLoopbackRequest(HttpContext context)
    {
        var remoteIp = context.Connection.RemoteIpAddress;
        return remoteIp is not null && IPAddress.IsLoopback(remoteIp);
    }
    #endregion
}
