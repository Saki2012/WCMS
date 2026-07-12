using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Net;
namespace WCMS.SysCore.Security.Hardening.AccessControl;

[AttributeUsage(AttributeTargets.Method)]
public sealed class LocalhostOnlyAttribute : Attribute, IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        var remoteIp = context.HttpContext.Connection.RemoteIpAddress;
        if (!IPAddress.IsLoopback(remoteIp))
        {
            context.Result = new ForbidResult(); // 403 禁止存取
        }
    }
    public void OnActionExecuted(ActionExecutedContext context)
    {
        // 不需要做事
    }
}

