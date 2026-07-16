using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Text.Json.Nodes;
using WCMS.SysCore.Constants;
namespace WCMS.SysCore.FeatureDriver.Api.OpenApi;

/// <summary>
/// 將 WCMS 多國語系 Header 加入 Swagger Operation。
/// </summary>
public sealed class AddAcceptLanguageHeaderOperationFilter : IOperationFilter
{
    #region Public
    /// <summary>
    /// 補上 Accept-Language Header 與預設語系範例。
    /// </summary>
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        operation.Parameters ??= [];
        bool exists = operation.Parameters.Any(parameter =>
            parameter.In == ParameterLocation.Header
            && parameter.Name == SysParam.HttpHeaders.AcceptLanguage);
        if (exists) return;
        operation.Parameters.Add(BuildAcceptLanguageParameter());
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立 Swagger 使用的 Accept-Language Header 定義。
    /// </summary>
    private static OpenApiParameter BuildAcceptLanguageParameter()
    {
        return new OpenApiParameter
        {
            Name = SysParam.HttpHeaders.AcceptLanguage,
            In = ParameterLocation.Header,
            Required = false,
            Description = "i18n language (e.g. zh-TW / en)",
            Schema = new OpenApiSchema
            {
                Type = JsonSchemaType.String,
                Default = JsonValue.Create("zh-TW")
            }
        };
    }
    #endregion
}
