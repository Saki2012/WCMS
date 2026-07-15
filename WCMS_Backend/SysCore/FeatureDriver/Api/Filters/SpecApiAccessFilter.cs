using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using WCMS.SysCore.Configuration;

namespace WCMS.SysCore.FeatureDriver.Api.Filters;

/// <summary>
/// 限制非目前 SpecCode 的 API 不允許被執行。
/// </summary>
public sealed class SpecApiAccessFilter : IActionFilter
{
    /// <summary>
    /// Action 執行前檢查 Controller 所屬 Spec。
    /// </summary>
    public void OnActionExecuting(ActionExecutingContext context)
    {
        var ns = context.Controller.GetType().Namespace ?? string.Empty;
        if (!SpecSettings.IsSpecFeaturesNamespace(ns)) return;
        if (SpecSettings.IsCurrentSpecNamespace(ns)) return;
        context.Result = new NotFoundResult();
    }

    /// <summary>
    /// Action 執行後不處理。
    /// </summary>
    public void OnActionExecuted(ActionExecutedContext context) { }
}