using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using WCMS.SysCore.Constants;

namespace WCMS.SysCore.FeatureDriver.Api.OpenApi;

/// <summary>
/// 提供 WCMS OpenAPI Bearer Token 驗證描述與註冊設定。
/// </summary>
public static class LibOpenApiSecuritySetup
{
    #region Property
    /// <summary>
    /// OpenAPI Bearer 驗證方案識別名稱。
    /// </summary>
    private const string BearerSchemeId = "Bearer";
    /// <summary>
    /// Bearer Token 使用的 JWT 格式名稱。
    /// </summary>
    private const string JwtBearerFormat = "JWT";
    /// <summary>
    /// Swagger Authorize 輸入提示。
    /// </summary>
    private const string BearerDescription = "請輸入: Bearer {你的AccessToken}";
    #endregion

    #region Public
    /// <summary>
    /// 註冊 WCMS OpenAPI Bearer Token 驗證方案與套用需求。
    /// </summary>
    public static void AddWcmsBearerSecurity(this SwaggerGenOptions options)
    {
        var securityScheme = BuildBearerSecurityScheme();
        var securityRequirement = BuildBearerSecurityRequirement();
        options.AddSecurityDefinition(BearerSchemeId, securityScheme);
        options.AddSecurityRequirement(securityRequirement);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立 Swagger Authorize 使用的 Bearer Token 驗證描述。
    /// </summary>
    private static OpenApiSecurityScheme BuildBearerSecurityScheme()
    {
        return new OpenApiSecurityScheme
        {
            Name = SysParam.HttpHeaders.Authorization,
            Type = SecuritySchemeType.ApiKey,
            Scheme = BearerSchemeId,
            BearerFormat = JwtBearerFormat,
            In = ParameterLocation.Header,
            Description = BearerDescription
        };
    }

    /// <summary>
    /// 建立套用 Bearer Token 驗證方案的 OpenAPI 安全需求。
    /// </summary>
    private static OpenApiSecurityRequirement BuildBearerSecurityRequirement()
    {
        var securityScheme = new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id = BearerSchemeId
            }
        };
        return new OpenApiSecurityRequirement
        {
            { securityScheme, Array.Empty<string>() }
        };
    }
    #endregion
}