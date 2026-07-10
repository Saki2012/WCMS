using Swashbuckle.AspNetCore.SwaggerGen;

namespace WCMS.SysCore.Filter;

/// <summary>
/// WCMS Swagger SchemaFilter 註冊擴充。
/// </summary>
public static class LibSwaggerSchemaSetup
{
    #region Public
    /// <summary>
    /// 註冊 WCMS 共用 Swagger SchemaFilter。
    /// </summary>
    public static void AddWcmsSchemaFilters(this SwaggerGenOptions options)
    {
        options.SchemaFilter<LibApiFieldSchemaFilter>();
    }
    #endregion
}
