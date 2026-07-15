using Microsoft.Extensions.Options;
namespace WCMS.SysCore.PlatformServices.Captcha;

/// <summary>
/// 驗證碼服務
/// </summary>
public class Captcha_BIZ(IOptions<CaptchaOptions> options, IHttpClientFactory httpClientFactory)
{
    #region Property
    private const string TurnstileProvider = "Turnstile";
    private const string TurnstileVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    private readonly CaptchaOptions Options = options.Value;
    private readonly IHttpClientFactory HttpClientFactory = httpClientFactory;
    #endregion

    #region Public
    /// <summary>
    /// 取得前台可公開讀取的驗證碼設定
    /// </summary>
    public CaptchaPublicConfig_DTO GetPublicConfig()
    {
        return new CaptchaPublicConfig_DTO { Enabled = Options.Enabled, Provider = Options.Provider, SiteKey = Options.SiteKey };
    }

    /// <summary>
    /// 驗證前端送回的驗證碼 token
    /// </summary>
    public async Task<CaptchaVerifyResult_DTO> VerifyAsync(CaptchaVerifyRequest_DTO request, CancellationToken ct = default)
    {
        if (!Options.Enabled) return CaptchaVerifyResult_DTO.Ok();
        if (!IsTurnstile()) return CaptchaVerifyResult_DTO.Fail("目前尚未支援此驗證碼服務。");

        CaptchaVerifyResult_DTO checkResult = CheckToken(request.ResponseToken);
        if (!checkResult.IsSuccess) return checkResult;
        if (string.IsNullOrWhiteSpace(Options.SecretKey)) return CaptchaVerifyResult_DTO.Fail("驗證碼服務尚未設定。");

        return await VerifyTurnstileAsync(request, ct);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 呼叫 Cloudflare Turnstile Siteverify
    /// </summary>
    private async Task<CaptchaVerifyResult_DTO> VerifyTurnstileAsync(CaptchaVerifyRequest_DTO request, CancellationToken ct)
    {
        using CancellationTokenSource timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, Options.TimeoutSeconds)));

        try
        {
            HttpClient client = HttpClientFactory.CreateClient(nameof(Captcha_BIZ));
            using FormUrlEncodedContent content = new(BuildTurnstilePayload(request));
            using HttpResponseMessage response = await client.PostAsync(TurnstileVerifyUrl, content, timeoutCts.Token);

            if (!response.IsSuccessStatusCode) return CaptchaVerifyResult_DTO.Fail("驗證碼服務暫時無法驗證，請稍後再試。");

            TurnstileVerifyResponse_DTO? result = await response.Content.ReadFromJsonAsync<TurnstileVerifyResponse_DTO>(cancellationToken: timeoutCts.Token);
            return BuildVerifyResult(result);
        }
        catch (OperationCanceledException)
        {
            return CaptchaVerifyResult_DTO.Fail("驗證碼驗證逾時，請重新送出。");
        }
        catch
        {
            return CaptchaVerifyResult_DTO.Fail("驗證碼驗證失敗，請稍後再試。");
        }
    }

    /// <summary>
    /// 建立 Turnstile 驗證資料
    /// </summary>
    private Dictionary<string, string> BuildTurnstilePayload(CaptchaVerifyRequest_DTO request)
    {
        Dictionary<string, string> payload = new()
        {
            ["secret"] = Options.SecretKey.Trim(),
            ["response"] = request.ResponseToken?.Trim() ?? string.Empty,
            ["idempotency_key"] = Guid.NewGuid().ToString()
        };

        if (!string.IsNullOrWhiteSpace(request.RemoteIp)) payload["remoteip"] = request.RemoteIp.Trim();
        return payload;
    }

    /// <summary>
    /// 建立驗證結果
    /// </summary>
    private CaptchaVerifyResult_DTO BuildVerifyResult(TurnstileVerifyResponse_DTO? result)
    {
        if (result == null) return CaptchaVerifyResult_DTO.Fail("驗證碼服務回應格式錯誤。");
        if (!result.Success) return CaptchaVerifyResult_DTO.Fail("驗證碼驗證失敗，請重新勾選。", result.ErrorCodes, result.Hostname, result.Action);
        if (!IsAllowedHostname(result.Hostname)) return CaptchaVerifyResult_DTO.Fail("驗證碼來源網域不符。", result.ErrorCodes, result.Hostname, result.Action);

        return CaptchaVerifyResult_DTO.Ok(result.Hostname, result.Action);
    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查 Provider 是否為 Turnstile
    /// </summary>
    private bool IsTurnstile()
    {
        return string.Equals(Options.Provider, TurnstileProvider, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 檢查 token 基本格式
    /// </summary>
    private static CaptchaVerifyResult_DTO CheckToken(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return CaptchaVerifyResult_DTO.Fail("請完成驗證碼。");
        if (token.Length > 2048) return CaptchaVerifyResult_DTO.Fail("驗證碼格式錯誤。");
        return CaptchaVerifyResult_DTO.Ok();
    }

    /// <summary>
    /// 檢查回傳 Hostname 是否允許
    /// </summary>
    private bool IsAllowedHostname(string? hostname)
    {
        if (Options.AllowedHostnames.Count == 0) return true;
        if (string.IsNullOrWhiteSpace(hostname)) return false;

        return Options.AllowedHostnames.Any(p => string.Equals(p.Trim(), hostname.Trim(), StringComparison.OrdinalIgnoreCase));
    }
    #endregion
}
