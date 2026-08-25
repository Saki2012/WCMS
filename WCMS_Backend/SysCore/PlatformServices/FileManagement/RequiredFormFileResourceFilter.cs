using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Reflection;
using WCMS.Features._Resx;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.FeatureDriver.Api.Contracts;

namespace WCMS.SysCore.PlatformServices.FileManagement;

/// <summary>
/// 在 Controller Model Binding 前檢查必要的 IFormFile，避免缺檔或空檔進入後續 Biz 流程。
/// </summary>
public sealed class RequiredFormFileResourceFilter : IAsyncResourceFilter
{
    #region Public
    /// <summary>
    /// 必要檔案缺少或為空檔時直接回傳統一 400 ApiResponse。
    /// </summary>
    public async Task OnResourceExecutionAsync(ResourceExecutingContext context, ResourceExecutionDelegate next)
    {
        string[] parameterNames = GetRequiredFileParameterNames(context);
        if (parameterNames.Length == 0)
        {
            await next();
            return;
        }

        bool hasRequiredFiles = await HasRequiredFilesAsync(context.HttpContext.Request, parameterNames);
        if (!hasRequiredFiles)
        {
            context.Result = BuildMissingFileResult();
            return;
        }
        await next();
    }
    #endregion

    #region Private
    /// <summary>
    /// 取得 Action 內所有非 Nullable 的單一 IFormFile 參數名稱。
    /// </summary>
    private static string[] GetRequiredFileParameterNames(ResourceExecutingContext context)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor descriptor) return [];
        return [.. descriptor.MethodInfo.GetParameters()
            .Where(IsRequiredFileParameter)
            .Select(parameter => parameter.Name)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Cast<string>()];
    }

    /// <summary>
    /// 判斷參數是否為必要的單一 IFormFile。
    /// </summary>
    private static bool IsRequiredFileParameter(ParameterInfo parameter)
    {
        if (!typeof(IFormFile).IsAssignableFrom(parameter.ParameterType)) return false;
        if (parameter.HasDefaultValue && parameter.DefaultValue == null) return false;
        NullabilityInfo nullability = new NullabilityInfoContext().Create(parameter);
        return nullability.ReadState != NullabilityState.Nullable;
    }

    /// <summary>
    /// 讀取 Multipart Form 並確認所有必要檔案都有實際內容。
    /// </summary>
    private static async Task<bool> HasRequiredFilesAsync(HttpRequest request, IEnumerable<string> parameterNames)
    {
        if (!request.HasFormContentType) return false;
        try
        {
            IFormCollection form = await request.ReadFormAsync(request.HttpContext.RequestAborted);
            return parameterNames.All(name => form.Files.GetFile(name) is { Length: > 0 });
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }

    /// <summary>
    /// 建立缺少上傳檔案時的統一 400 ApiResponse。
    /// </summary>
    private static IActionResult BuildMissingFileResult()
    {
        ErrorHelper message = new();
        message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00033);
        ApiResponse<object> response = new() { SysMessage = message.Messages, Data = [] };
        return new BadRequestObjectResult(response);
    }
    #endregion
}
