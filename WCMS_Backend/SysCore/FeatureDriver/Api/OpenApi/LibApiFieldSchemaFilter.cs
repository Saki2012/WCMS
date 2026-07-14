using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Interfaces;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Library;
namespace WCMS.SysCore.FeatureDriver.Api.OpenApi;

/// <summary>
/// 依 LibField / LibStr 的 ApiFieldMode 修正 Swagger Schema。
/// 只控管外部 API Schema 可見性，不介入 Biz / Repo 內部資料寫入。
/// </summary>
/// <remarks>
/// 建立 Swagger 欄位政策 Filter。
/// </remarks>
public sealed class LibApiFieldSchemaFilter(IOptions<JsonOptions>? jsonOptions = null) : ISchemaFilter
{
    #region Property
    private const string ApiModeExtensionName = "x-wcms-api-mode";
    private const string CanReadExtensionName = "x-wcms-can-read";
    private const string CanWriteExtensionName = "x-wcms-can-write";
    private const string CanQueryExtensionName = "x-wcms-can-query";
    private const string CanSelectExtensionName = "x-wcms-can-select";
    private const string CanSortExtensionName = "x-wcms-can-sort";
    private const string RequiredExtensionName = "x-wcms-required";
    private readonly JsonSerializerOptions _jsonOptions = jsonOptions?.Value.JsonSerializerOptions ?? new JsonSerializerOptions(JsonSerializerDefaults.Web);
    #endregion

    #region Public
    /// <summary>
    /// 套用 ApiFieldMode 到目前 Schema。
    /// </summary>
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema.Properties == null || schema.Properties.Count == 0) return;
        foreach (var property in context.Type.GetProperties(BindingFlags.Public | BindingFlags.Instance)) ApplyPropertyPolicy(schema, property);
    }
    #endregion

    #region Private
    /// <summary>
    /// 依欄位政策移除或補上 Schema Metadata。
    /// </summary>
    private void ApplyPropertyPolicy(OpenApiSchema schema, PropertyInfo property)
    {
        var schemaName = ResolveSchemaPropertyName(schema, property);
        if (string.IsNullOrWhiteSpace(schemaName)) return;
        if (LibApiFieldPolicyHelper.ShouldHideFromSchema(property))
        {
            schema.Properties.Remove(schemaName);
            return;
        }
        var apiMode = LibApiFieldPolicyHelper.GetApiMode(property);
        OpenApiSchema propertySchema = schema.Properties[schemaName];
        ApplyOpenApiMode(propertySchema, apiMode);
        ApplyInputPolicy(schema, propertySchema, schemaName, property, apiMode);
    }
    /// <summary>
    /// 讓 API 可寫欄位接受省略或 null，必填規則改由 WCMS Metadata 表達。
    /// </summary>
    private static void ApplyInputPolicy(OpenApiSchema schema, OpenApiSchema propertySchema, string schemaName, PropertyInfo property, ApiFieldMode apiMode)
    {
        if (!LibApiFieldPolicyHelper.CanWrite(apiMode)) return;
        schema.Required?.Remove(schemaName);
        propertySchema.Nullable = true;
        propertySchema.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        propertySchema.Extensions[RequiredExtensionName] = new OpenApiBoolean(LibApiFieldPolicyHelper.IsRequired(property));
    }

    /// <summary>
    /// 依 System.Text.Json 規則解析 Swagger 欄位名稱。
    /// </summary>
    private string? ResolveSchemaPropertyName(OpenApiSchema schema, PropertyInfo property)
    {
        foreach (var name in GetJsonPropertyNameCandidates(property)) if (schema.Properties.ContainsKey(name)) return name;
        var result = schema.Properties.Keys.FirstOrDefault(p => string.Equals(p, property.Name, StringComparison.OrdinalIgnoreCase));
        return result;
    }
    /// <summary>
    /// 取得可能的 JSON 欄位名稱候選。
    /// </summary>
    private IEnumerable<string> GetJsonPropertyNameCandidates(PropertyInfo property)
    {
        var jsonName = property.GetCustomAttribute<JsonPropertyNameAttribute>(inherit: true)?.Name;
        if (!string.IsNullOrWhiteSpace(jsonName)) yield return jsonName;

        var policyName = _jsonOptions.PropertyNamingPolicy?.ConvertName(property.Name);
        if (!string.IsNullOrWhiteSpace(policyName)) yield return policyName;

        yield return JsonNamingPolicy.CamelCase.ConvertName(property.Name);
        yield return property.Name;
    }
    /// <summary>
    /// 套用 OpenAPI 原生 readOnly / writeOnly 與 WCMS extension。
    /// </summary>
    private static void ApplyOpenApiMode(OpenApiSchema propertySchema, ApiFieldMode apiMode)
    {
        propertySchema.ReadOnly = apiMode == ApiFieldMode.ReadOnly;
        propertySchema.WriteOnly = apiMode == ApiFieldMode.WriteOnly;
        propertySchema.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        propertySchema.Extensions[ApiModeExtensionName] = new OpenApiString(apiMode.ToString());
        propertySchema.Extensions[CanReadExtensionName] = new OpenApiBoolean(LibApiFieldPolicyHelper.CanRead(apiMode));
        propertySchema.Extensions[CanWriteExtensionName] = new OpenApiBoolean(LibApiFieldPolicyHelper.CanWrite(apiMode));
        propertySchema.Extensions[CanQueryExtensionName] = new OpenApiBoolean(LibApiFieldPolicyHelper.CanQuery(apiMode));
        propertySchema.Extensions[CanSelectExtensionName] = new OpenApiBoolean(LibApiFieldPolicyHelper.CanSelect(apiMode));
        propertySchema.Extensions[CanSortExtensionName] = new OpenApiBoolean(LibApiFieldPolicyHelper.CanSort(apiMode));
    }
    #endregion
}
