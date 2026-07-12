using Newtonsoft.Json;
using System.Diagnostics;
using System.Security.Claims;
using WCMS.SysCore.Observability.OperateLog;
using WCMS.SysCore.Observability.OperateLog.Metadata;
namespace WCMS.SysCore.Auditing.OperateLog.Middleware;


public sealed class OperateLogMiddleware
{
    private readonly RequestDelegate _next;

    public OperateLogMiddleware(RequestDelegate next)
    {
        // 儲存 next pipeline
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IOperateLog operateLog)
    {
        // 判斷是否需要記錄（例如 /Public 或 SkipOperateLog）
        if (ShouldSkip(context))
        {
            await _next(context);
            return;
        }

        // 建立 log（開始）
        var follow = BuildStartLog(context, operateLog);
        var sw = Stopwatch.StartNew();

        try
        {
            // 執行後續 pipeline
            await _next(context);

            // 完成後寫入狀態
            ApplyEndStatus(context, follow, sw);
        }
        catch (OperationCanceledException)
        {
            // cancellation：用 cancelled status
            ApplyCancelStatus(follow, sw);
            throw;
        }
        catch (Exception)
        {
            // exception：用 fail status
            ApplyFailStatus(follow, sw);
            throw;
        }
    }

    private static bool ShouldSkip(HttpContext context)
    {
        // 1) 路由規則排除（你說的「前台查詢 api」：建議統一放 /Public）
        if (context.Request.Path.StartsWithSegments("/Public", StringComparison.OrdinalIgnoreCase))
            return true;

        // 2) attribute 排除（controller/action 上標 SkipOperateLog）
        var endpoint = context.GetEndpoint();
        if (endpoint?.Metadata?.GetMetadata<SkipOperateLogAttribute>() != null)
            return true;

        return false;
    }

    private static OperateLogModel BuildStartLog(HttpContext context, IOperateLog operateLog)
    {
        // 組 API 名稱（用 route + method，避免依賴 controller 才能跑）
        var apiName = BuildApiName(context);

        // 取得 userId（已通過 auth 的話會有 Claims）
        var userId = context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? context.User?.FindFirstValue("UserId")
                     ?? "Anonymous";

        // 取 ip（你現在用 HTTP_CLIENT_IP header，我這裡仍保留）
        var ip = context.Request.Headers[SysParam.HttpHeaders.ClientIp].ToString();

        // body 內容通常不建議在 middleware 讀（會影響效能/需 EnableBuffering），先留空或只記 query
        var payload = JsonConvert.SerializeObject(new
        {
            context.Request.QueryString.Value
        });

        // 建立 log model
        return operateLog.AddOperateLog(apiName, userId, payload, ip);
    }

    private static string BuildApiName(HttpContext context)
    {
        // 盡量穩定：METHOD + PATH（你也可改成 Endpoint.DisplayName）
        return $"{context.Request.Method} {context.Request.Path}";
    }

    private static void ApplyEndStatus(HttpContext context, OperateLogModel follow, Stopwatch sw)
    {
        // 取消判斷：用 RequestAborted 最準（等同 action 的 ct）
        if (context.RequestAborted.IsCancellationRequested)
        {
            ApplyCancelStatus(follow, sw);
            return;
        }

        // 依 status code 判斷成功/失敗
        if (context.Response.StatusCode >= 400) ApplyFailStatus(follow, sw);
        else ApplyOkStatus(follow, sw);
    }

    private static void ApplyOkStatus(OperateLogModel follow, Stopwatch sw)
    {
        // 設成功狀態（你目前用 ExcStatus.OK）
        follow.ExcStatus = ExcStatus.OK;
        // TODO: 若 follow 有耗時欄位，可在這裡寫 follow.ElapsedMs = sw.ElapsedMilliseconds;
    }

    private static void ApplyFailStatus(OperateLogModel follow, Stopwatch sw)
    {
        // 設失敗狀態
        follow.ExcStatus = ExcStatus.Fail;
        // TODO: elapsed
    }

    private static void ApplyCancelStatus(OperateLogModel follow, Stopwatch sw)
    {
        // 設取消狀態
        follow.ExcStatus = ExcStatus.CancelExc;
        // TODO: elapsed
    }
}