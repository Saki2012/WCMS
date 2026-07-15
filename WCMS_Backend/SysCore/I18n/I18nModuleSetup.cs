using Microsoft.AspNetCore.Localization;
using System.Globalization;
namespace WCMS.SysCore.I18n;

/// <summary>
/// 集中套用 WCMS 支援語系與 Request Culture 規則。
/// </summary>
internal static class I18nModuleSetup
{
    #region Public
    /// <summary>
    /// 啟用繁體中文與英文的 Accept-Language 解析。
    /// </summary>
    public static void UseRequestLocalization(WebApplication app)
    {
        CultureInfo[] supported = [new("zh-TW"), new("en")];
        app.UseRequestLocalization(new RequestLocalizationOptions
        {
            DefaultRequestCulture = new RequestCulture("zh-TW"),
            SupportedCultures = supported,
            SupportedUICultures = supported,
            RequestCultureProviders = [new AcceptLanguageHeaderRequestCultureProvider()]
        });
    }
    #endregion
}
