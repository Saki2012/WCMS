using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.OpenApi.Models;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using WCMS.Features._Resx;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Api.Filters;
using WCMS.SysCore.FeatureDriver.Api.OpenApi;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;

namespace WCMS.SysCore.FeatureDriver.Api.Setup;

/// <summary>
/// 集中註冊 WCMS Controller、API 驗證回應與 Swagger 服務。
/// </summary>
internal static class FeatureDriverApiSetup
{
    #region Public
    /// <summary>
    /// 註冊 Controller、JSON、驗證回應與 Swagger。
    /// </summary>
    public static void AddServices(IServiceCollection services)
    {
        AddControllers(services);
        AddApiBehavior(services);
        AddSwagger(services);
    }
    #endregion

    #region Private
    /// <summary>
    /// 註冊 Controller、Spec Filter 與 System.Text.Json 規則。
    /// </summary>
    private static void AddControllers(IServiceCollection services)
    {
        services.AddControllers(options =>
        {
            options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
            options.Filters.Add<SpecApiAccessFilter>();
        }).AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = null;
            options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.JsonSerializerOptions.WriteIndented = false;
            options.JsonSerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
        });
    }
    /// <summary>
    /// 註冊統一的 ModelState 400 回應格式。
    /// </summary>
    private static void AddApiBehavior(IServiceCollection services)
    {
        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                I18nCache i18n = context.HttpContext.RequestServices.GetRequiredService<I18nCache>();
                return new BadRequestObjectResult(BuildInvalidModelResponse(context, i18n));
            };
        });
    }
    /// <summary>
    /// 註冊 Swagger 文件、語系 Header 與 Bearer 驗證描述。
    /// </summary>
    private static void AddSwagger(IServiceCollection services)
    {
        AppContext.SetSwitch(Constants.SysParam.RuntimeSwitches.JsonReflectionEnabled, true);
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.OperationFilter<AddAcceptLanguageHeaderOperationFilter>();
            options.SwaggerDoc("v1", new OpenApiInfo { Title = "WCMS API", Version = ResolveBackendVersion() });
            options.AddWcmsSchemaFilters();
            options.AddWcmsBearerSecurity();
        });
    }
    /// <summary>
    /// 取得目前 SysCore 與 Spec 組合後的後端版本號。
    /// </summary>
    private static string ResolveBackendVersion()
    {
        Type serviceType = typeof(SystemVersion);
        Type implementationType = ResolveSpecSystemVersionType(serviceType) ?? serviceType;
        var versionService = Activator.CreateInstance(implementationType) as SystemVersion
            ?? throw new InvalidOperationException($"無法建立系統版本服務：{implementationType.FullName}");
        return versionService.GetBackendVersion();
    }
    /// <summary>
    /// 取得目前 Spec 提供的系統版本服務型別。
    /// </summary>
    private static Type? ResolveSpecSystemVersionType(Type serviceType)
    {
        return typeof(Program).Assembly.GetTypes().FirstOrDefault(type =>
            !type.IsAbstract
            && !type.IsInterface
            && type != serviceType
            && serviceType.IsAssignableFrom(type)
            && SpecSettings.IsCurrentSpecNamespace(type.Namespace ?? string.Empty));
    }
    /// <summary>
    /// 建立自訂的 400 驗證回應。
    /// </summary>
    private static ApiResponse<string> BuildInvalidModelResponse(ActionContext context, I18nCache i18n)
    {
        ErrorHelper message = new();
        foreach (var item in context.ModelState.Where(item => item.Value?.Errors.Count > 0))
            AddInvalidModelMessage(context, message, item.Key, i18n);
        if (!message.Messages.Any()) message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00035, "資料");
        return new ApiResponse<string> { Data = [], SysMessage = message.Messages };
    }
    /// <summary>
    /// 依欄位驗證結果加入統一錯誤訊息。
    /// </summary>
    private static void AddInvalidModelMessage(ActionContext context, ErrorHelper message, string key, I18nCache i18n)
    {
        PropertyInfo? property = FindModelProperty(context, key);
        string displayName = property == null ? GetFieldName(key) : i18n.GetLabel(property);
        string errorText = context.ModelState[key]?.Errors.FirstOrDefault()?.ErrorMessage ?? string.Empty;
        int? maxLength = GetMaxLength(property);
        if (maxLength.HasValue && !IsRequiredError(errorText))
            message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00034, displayName, maxLength.Value);
        else message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00035, displayName);
    }
    /// <summary>
    /// 從 Action Parameter 與 Model Key 反查實際欄位。
    /// </summary>
    private static PropertyInfo? FindModelProperty(ActionContext context, string key)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor descriptor) return null;
        string cleanKey = Regex.Replace(key ?? string.Empty, @"\[\d+\]", string.Empty);
        foreach (ParameterInfo parameter in descriptor.MethodInfo.GetParameters())
        {
            PropertyInfo? property = TryResolveProperty(parameter.ParameterType, cleanKey, parameter.Name);
            if (property != null) return property;
        }
        return null;
    }
    /// <summary>
    /// 依照欄位路徑往下解析 PropertyInfo。
    /// </summary>
    private static PropertyInfo? TryResolveProperty(Type rootType, string key, string? parameterName)
    {
        string path = RemoveParameterPrefix(key, parameterName);
        string[] segments = path.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0) return null;
        Type currentType = rootType;
        PropertyInfo? currentProperty = null;
        foreach (string segment in segments)
        {
            currentProperty = currentType.GetProperties().FirstOrDefault(property => property.Name.Equals(segment, StringComparison.OrdinalIgnoreCase));
            if (currentProperty == null) return null;
            currentType = GetPropertyType(currentProperty.PropertyType);
        }
        return currentProperty;
    }
    /// <summary>
    /// 移除 Model Key 可能包含的 Action Parameter 前綴。
    /// </summary>
    private static string RemoveParameterPrefix(string key, string? parameterName)
    {
        if (string.IsNullOrWhiteSpace(parameterName)) return key;
        string prefix = $"{parameterName}.";
        return key.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) ? key[prefix.Length..] : key;
    }
    /// <summary>
    /// 取得 Nullable 或集合欄位的實際資料型別。
    /// </summary>
    private static Type GetPropertyType(Type type)
    {
        Type realType = Nullable.GetUnderlyingType(type) ?? type;
        if (realType == typeof(string) || !realType.IsGenericType) return realType;
        return typeof(System.Collections.IEnumerable).IsAssignableFrom(realType)
            ? realType.GetGenericArguments()[0]
            : realType;
    }
    /// <summary>
    /// 取得欄位的最大字串長度限制。
    /// </summary>
    private static int? GetMaxLength(PropertyInfo? property)
    {
        if (property == null) return null;
        StringLengthAttribute? stringLength = property.GetCustomAttribute<StringLengthAttribute>();
        MaxLengthAttribute? maxLength = property.GetCustomAttribute<MaxLengthAttribute>();
        return stringLength?.MaximumLength ?? maxLength?.Length;
    }
    /// <summary>
    /// 取得 Model Key 最後一段作為欄位名稱。
    /// </summary>
    private static string GetFieldName(string key)
    {
        string cleanKey = Regex.Replace(key ?? string.Empty, @"\[\d+\]", string.Empty);
        return cleanKey.Split('.', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? "欄位";
    }
    /// <summary>
    /// 判斷驗證訊息是否屬於必填錯誤。
    /// </summary>
    private static bool IsRequiredError(string errorText)
    {
        return errorText.Contains("required", StringComparison.OrdinalIgnoreCase)
            || errorText.Contains("請輸入", StringComparison.OrdinalIgnoreCase)
            || errorText.Contains("必填", StringComparison.OrdinalIgnoreCase);
    }
    #endregion
}
