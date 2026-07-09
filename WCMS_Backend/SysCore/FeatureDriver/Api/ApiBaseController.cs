using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.DependencyInjection;
using WCMS.Features.IAM.Auth;
using WCMS.Features._Resx;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Library.LibData;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.FeatureDriver.Api;

/// <summary>
/// API 最底層基底，僅提供共用服務與共用權限檢查。
/// </summary>
[Authorize]
public abstract class ApiBaseController : ControllerBase, IAsyncActionFilter
{
    #region Property
    private IErrorHelper? _message;
    private IOutputCacheStore? _cacheStore;
    private IOperateLog? _operateLog;
    private ICurrentUserAccessor? _current;
    /// <summary>
    /// 系統訊息容器。
    /// </summary>
    protected IErrorHelper Message => _message ??= HttpContext.RequestServices.GetRequiredService<IErrorHelper>();
    /// <summary>
    /// 輸出快取儲存服務。
    /// </summary>
    protected IOutputCacheStore CacheStore => _cacheStore ??= HttpContext.RequestServices.GetRequiredService<IOutputCacheStore>();
    /// <summary>
    /// 操作紀錄服務。
    /// </summary>
    protected IOperateLog OperateLog => _operateLog ??= HttpContext.RequestServices.GetRequiredService<IOperateLog>();
    /// <summary>
    /// 目前使用者存取器。
    /// </summary>
    protected ICurrentUserAccessor Current => _current ??= HttpContext.RequestServices.GetRequiredService<ICurrentUserAccessor>();
    /// <summary>
    /// 目前操作使用者。
    /// </summary>
    public User_DTO OperateUser => Current.User;
    #endregion

    #region Protected
    /// <summary>
    /// 建立未註冊的 Biz 物件。
    /// </summary>
    protected TBiz CreateBiz<TBiz>() where TBiz : class
    {
        return ActivatorUtilities.CreateInstance<TBiz>(HttpContext.RequestServices);
    }
    /// <summary>
    /// 建立單筆資料回應。
    /// </summary>
    protected ApiResponse<T> OkResponse<T>(T data)
    {
        return OkResponse<T>([data]);
    }
    /// <summary>
    /// 建立多筆資料回應。
    /// </summary>
    protected ApiResponse<T> OkResponse<T>(IList<T> data)
    {
        return new ApiResponse<T>() { Data = data, SysMessage = Message.Messages };
    }
    #endregion

    #region Explicit interface
    /// <summary>
    /// 執行 API 權限檢查。
    /// </summary>
    Task IAsyncActionFilter.OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        return OnActionExecutionCoreAsync(context, next);
    }
    #endregion

    #region Private
    /// <summary>
    /// 執行 API Action 前置檢查流程。
    /// </summary>
    private async Task OnActionExecutionCoreAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        bool ok = await EnsurePermissionAsync(context);
        if (!ok) return;
        await next();
    }
    /// <summary>
    /// 確認目前使用者是否擁有 Action 權限。
    /// </summary>
    private async Task<bool> EnsurePermissionAsync(ActionExecutingContext context)
    {
        if (context.Filters.Any(f => f is Microsoft.AspNetCore.Mvc.Authorization.IAllowAnonymousFilter)) return true;
        if (!Current.IsAuthenticated) return true;
        FuncAction requiredAct = GetRequiredAct(context);
        if (requiredAct == FuncAction.None) return true;
        LibApiControllerAttribute? meta = GetPermissionMeta(context);
        if (meta == null) return true;
        if (!IsSupportAction(context, meta, requiredAct)) return false;
        return await CheckUserPermissionAsync(context, meta, requiredAct);
    }
    /// <summary>
    /// 確認 Controller 是否支援目前 Action 權限。
    /// </summary>
    private bool IsSupportAction(ActionExecutingContext context, LibApiControllerAttribute meta, FuncAction requiredAct)
    {
        if ((meta.SupportFuncActMask & requiredAct) == requiredAct) return true;
        context.Result = Forbid();
        return false;
    }
    /// <summary>
    /// 檢查目前使用者是否有指定功能權限。
    /// </summary>
    private async Task<bool> CheckUserPermissionAsync(ActionExecutingContext context, LibApiControllerAttribute meta, FuncAction requiredAct)
    {
        ILibPermissionChecker checker = HttpContext.RequestServices.GetRequiredService<ILibPermissionChecker>();
        bool ok = await checker.HasPermissionAsync(Current.User.UserId, meta.ProgId, requiredAct, context.HttpContext.RequestAborted);
        if (ok) return true;
        string actionName = EnumHelper.GetEnumDisplayName(requiredAct);
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00029, actionName);
        context.Result = new JsonResult(Message.Messages.LastOrDefault()?.Message) { StatusCode = StatusCodes.Status403Forbidden };
        return false;
    }
    /// <summary>
    /// 取得 Action 指定的必要權限。
    /// </summary>
    private static FuncAction GetRequiredAct(ActionExecutingContext context)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor cad) return FuncAction.None;
        return cad.MethodInfo.GetCustomAttributes(typeof(LibRequireFuncActAttribute), true).OfType<LibRequireFuncActAttribute>().FirstOrDefault()?.RequiredAct ?? FuncAction.None;
    }
    /// <summary>
    /// 取得 Controller 或 Action 上的權限 Metadata。
    /// </summary>
    private static LibApiControllerAttribute? GetPermissionMeta(ActionExecutingContext context)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor cad) return null;
        return cad.MethodInfo.GetCustomAttributes(typeof(LibApiControllerAttribute), true).OfType<LibApiControllerAttribute>().FirstOrDefault()
            ?? cad.ControllerTypeInfo.GetCustomAttributes(typeof(LibApiControllerAttribute), true).OfType<LibApiControllerAttribute>().FirstOrDefault();
    }
    #endregion
}
