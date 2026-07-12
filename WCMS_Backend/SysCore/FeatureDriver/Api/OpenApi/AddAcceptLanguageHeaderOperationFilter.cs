using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace WCMS.SysCore.FeatureDriver.Api.OpenApi;

/// <summary>
/// 取得「對外實際主機」：優先 X-Forwarded-Host，否則用 Request.Host
/// </summary>
/// <param name="ctx"></param>
/// <returns></returns>
public class AddAcceptLanguageHeaderOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        operation.Parameters ??= [];
        if (operation.Parameters.Any(p => p.In == ParameterLocation.Header && p.Name == SysParam.HttpHeaders.AcceptLanguage)) return;
        operation.Parameters.Add(new OpenApiParameter
        {
            Name = SysParam.HttpHeaders.AcceptLanguage,
            In = ParameterLocation.Header,
            Required = false,
            Description = "i18n language (e.g. zh-TW / en)",
            Schema = new OpenApiSchema { Type = "string", Default = new OpenApiString("zh-TW") }
        });
    }
}