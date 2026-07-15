using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace WCMS.SysCore.PlatformServices.Captcha;

/// <summary>
/// 驗證碼設定
/// </summary>
public class CaptchaOptions
{
    public bool Enabled { get; set; } = false;
    public string Provider { get; set; } = "Turnstile";
    public string SiteKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; } = 10;
    public List<string> AllowedHostnames { get; set; } = [];
}

/// <summary>
/// 前台可讀取的驗證碼設定
/// </summary>
public class CaptchaPublicConfig_DTO
{
    public bool Enabled { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string SiteKey { get; set; } = string.Empty;
}

/// <summary>
/// 驗證碼驗證請求
/// </summary>
public class CaptchaVerifyRequest_DTO
{
    [StringLength(2048)] public string? ResponseToken { get; set; } = string.Empty;
    [StringLength(128)] public string? RemoteIp { get; set; } = string.Empty;
}

/// <summary>
/// 驗證碼驗證結果
/// </summary>
public class CaptchaVerifyResult_DTO
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Hostname { get; set; } = string.Empty;
    public string? Action { get; set; } = string.Empty;
    public string[] ErrorCodes { get; set; } = [];

    public static CaptchaVerifyResult_DTO Ok(string? hostname = null, string? action = null)
    {
        return new CaptchaVerifyResult_DTO { IsSuccess = true, Hostname = hostname, Action = action };
    }

    public static CaptchaVerifyResult_DTO Fail(string message, string[]? errorCodes = null, string? hostname = null, string? action = null)
    {
        return new CaptchaVerifyResult_DTO { IsSuccess = false, Message = message, ErrorCodes = errorCodes ?? [], Hostname = hostname, Action = action };
    }
}

/// <summary>
/// Cloudflare Turnstile Siteverify 回應
/// </summary>
internal class TurnstileVerifyResponse_DTO
{
    [JsonPropertyName("success")] public bool Success { get; set; }
    [JsonPropertyName("challenge_ts")] public string? ChallengeTs { get; set; }
    [JsonPropertyName("hostname")] public string? Hostname { get; set; }
    [JsonPropertyName("action")] public string? Action { get; set; }
    [JsonPropertyName("cdata")] public string? CData { get; set; }
    [JsonPropertyName("error-codes")] public string[] ErrorCodes { get; set; } = [];
}
