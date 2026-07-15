using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WCMS.SysCore.Security.IdentityAccess.Authentication;
using WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
using WCMS.SysCore.Constants;

namespace WCMS.SysCore.Security.IdentityAccess;

/// <summary>
/// 集中註冊 JWT 身分認證與應用程式登入 Cookie 設定。
/// </summary>
internal static class IdentityAccessSetup
{
    #region Public
    /// <summary>
    /// 註冊 Identity Access 所需的身分認證服務。
    /// </summary>
    public static void AddServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserAccessor, HttpContextCurrentUserAccessor>();
        services.AddScoped<PermissionCache>();
        services.AddScoped<ILibPermissionChecker, LibPermissionChecker>();
        services.AddSingleton<TokenStateCache>();
        services.AddSingleton<LoginAttemptCache>();
        services.AddSingleton<TokenService>();
        services.AddAuthorization();
        AddJwtAuthentication(services, configuration);
        AddAppCookie(services);
    }
    #endregion

    #region Private
    /// <summary>
    /// 註冊 JWT Bearer 驗證、Cookie Token 來源與撤銷清單檢查。
    /// </summary>
    private static void AddJwtAuthentication(IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = true;
            options.SaveToken = false;
            options.TokenValidationParameters = BuildTokenValidationParameters(configuration);
            options.Events = BuildJwtBearerEvents();
        });
    }

    /// <summary>
    /// 建立 JWT 簽章、Issuer、Audience 與有效期限驗證規則。
    /// </summary>
    private static TokenValidationParameters BuildTokenValidationParameters(IConfiguration configuration)
    {
        var key = configuration[SysParam.Configuration.Jwt.KeyPath] ?? throw new InvalidOperationException("Missing Jwt:Key in appsettings");
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = configuration[SysParam.Configuration.Jwt.IssuerPath],
            ValidAudience = configuration[SysParam.Configuration.Jwt.AudiencePath],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    }

    /// <summary>
    /// 建立 Access Cookie 讀取與 Token 黑名單驗證事件。
    /// </summary>
    private static JwtBearerEvents BuildJwtBearerEvents()
    {
        return new JwtBearerEvents
        {
            OnMessageReceived = ResolveAccessTokenAsync,
            OnTokenValidated = ValidateAccessTokenAsync
        };
    }

    /// <summary>
    /// Bearer Header 沒有 Token 時改由 access Cookie 讀取。
    /// </summary>
    private static Task ResolveAccessTokenAsync(MessageReceivedContext context)
    {
        if (string.IsNullOrEmpty(context.Token) && context.Request.Cookies.TryGetValue(SysParam.CookieNames.AccessToken, out var cookieToken))
        {
            context.Token = cookieToken;
        }
        return Task.CompletedTask;
    }

    /// <summary>
    /// 驗證 Access Token 的 JTI 是否已被撤銷。
    /// </summary>
    private static async Task ValidateAccessTokenAsync(TokenValidatedContext context)
    {
        var jti = context.Principal?.FindFirstValue(JwtRegisteredClaimNames.Jti);
        if (string.IsNullOrEmpty(jti)) return;
        var tokenService = context.HttpContext.RequestServices.GetRequiredService<TokenService>();
        if (await tokenService.IsAccessBlacklistedAsync(jti, context.HttpContext.RequestAborted)) context.Fail("Token has been revoked");
    }

    /// <summary>
    /// 設定應用程式登入 Cookie 的安全屬性。
    /// </summary>
    private static void AddAppCookie(IServiceCollection services)
    {
        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        });
    }
    #endregion
}
