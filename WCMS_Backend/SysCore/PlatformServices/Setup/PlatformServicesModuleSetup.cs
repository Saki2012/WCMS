using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using WCMS.SysCore.Constants;
using WCMS.SysCore.PlatformServices.Captcha;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.SysCore.PlatformServices.Setup;

/// <summary>
/// 集中註冊 WCMS 主機、回應壓縮與平台共用服務。
/// </summary>
internal static class PlatformServicesModuleSetup
{
    #region Public
    /// <summary>
    /// 註冊 IIS、HTTP Client、Captcha、檔案設定與回應壓縮。
    /// </summary>
    public static void AddServices(WebApplicationBuilder builder)
    {
        builder.WebHost.UseIIS();
        AddResponseCompression(builder.Services);
        builder.Services.AddHttpClient();
        builder.Services.AddScoped<Captcha_BIZ>();
        builder.Services.Configure<FilePathOptions>(builder.Configuration.GetSection(SysParam.Configuration.Sections.FilePaths));
        builder.Services.Configure<CaptchaOptions>(builder.Configuration.GetSection(SysParam.Configuration.Sections.Captcha));
    }
    #endregion

    #region Private
    /// <summary>
    /// 註冊 HTTPS JSON 回應的 Brotli 與 GZip 壓縮設定。
    /// </summary>
    private static void AddResponseCompression(IServiceCollection services)
    {
        services.AddResponseCompression(options =>
        {
            options.EnableForHttps = true;
            options.MimeTypes = [SysParam.MediaTypes.ApplicationJson, SysParam.MediaTypes.TextJson];
            options.Providers.Clear();
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
        });
        services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
        services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Fastest);
    }
    #endregion
}
