using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.Captcha;

namespace WCMS.Features.WEB.SurveySubmission;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.SurveySubmission, SysEnum.FuncAction.Function)]
public class SurveySubmissionController(ICaptchaBiz CaptchaBiz) : ApiDataQueryController<SurveySubmissions>
{

    #region Public
    /// <summary>
    /// 前台匿名提交問卷
    /// </summary>
    [HttpPost(nameof(Public_Submit)), AllowAnonymous, IgnoreAntiforgeryToken]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Public_Submit([FromBody] SurveySubmissionRequest_DTO data, CancellationToken ct)
    {
        CaptchaVerifyResult_DTO captchaResult = await VerifyCaptchaAsync(data.CaptchaToken, ct);
        if (!captchaResult.IsSuccess) return BuildCaptchaErrorResponse(captchaResult);

        SurveySubmissions submit = BuildPublicSubmitData(data);
        await ((SurveySubmissionBiz)Service).SubmitSurvey(submit, data.FormDataJson, ct);
        return BuildSubmitResponse(submit);
    }
    /// <summary>
    /// 
    /// </summary>
    /// <param name="queryCondition"></param>
    /// <param name="ct"></param>
    /// <returns></returns>
    [ProducesResponseType(typeof(ApiResponse<SurveySubmissions>), StatusCodes.Status200OK)]
    public override Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition, CancellationToken ct)
    {
        return base.QueryList(queryCondition, ct);
    }
    #endregion

    #region Protected Virtual
    protected override void SpecSetQueryParam(QueryListParam queryCondition, Dictionary<string, string> newFieldNameDic)
    {
        base.SpecSetQueryParam(queryCondition, new()
        {
            [nameof(SurveySubmissions.FormDataJson)] = nameof(SurveySubmissions.FormDataZip),
            [nameof(SurveySubmissions.FieldSnapshotJson)] = nameof(SurveySubmissions.FieldSnapshotZip)
        });
    }
    protected override void SpecAfterRead(SurveySubmissions data)
    {
        base.SpecAfterRead(data);
        data.FormDataJson = ((SurveySubmissionBiz)Service).DecompressJsonFromStorage(data.FormDataZip);
        data.FieldSnapshotJson = ((SurveySubmissionBiz)Service).DecompressJsonFromStorage(data.FieldSnapshotZip);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立前台提交資料
    /// </summary>
    private SurveySubmissions BuildPublicSubmitData(SurveySubmissionRequest_DTO data)
    {
        SurveySubmissions submit = new()
        {
            SurveyId = data.SurveyId ?? string.Empty,
            UserName = data.UserName ?? string.Empty,
            Email = data.Email ?? string.Empty,
            ContactPhone = data.ContactPhone ?? string.Empty,
            TimeZone = data.TimeZone ?? string.Empty,
        };
        if (data.Lang.HasValue) submit.Lang = data.Lang.Value;
        AutoSetClientInfo(submit);
        return submit;
    }
    /// <summary>
    /// 建立提交回應
    /// </summary>
    private IActionResult BuildSubmitResponse(SurveySubmissions submit)
    {
        ApiResponse<string> response = new() { Data = [submit.SurveySubmissionId ?? string.Empty], SysMessage = Message.Messages };
        return Message.HasError ? BadRequest(response) : Ok(response);
    }
    /// <summary>
    /// 自動補使用者端資訊
    /// </summary>
    private void AutoSetClientInfo(SurveySubmissions submit)
    {
        string clientIp = GetClientIp();
        submit.UserAgent = CutText(GetHeaderValue("User-Agent"), SysLengthParam.Memo);
        submit.AcceptLanguage = CutText(GetHeaderValue("Accept-Language"), SysLengthParam.Info);
        submit.ClientIpMasked = CutText(MaskClientIp(clientIp), SysLengthParam.IP);
        submit.ClientIpHash = CutText(HashClientIp(clientIp), SysLengthParam.FileSHA256);
        submit.TimeZone = CutText(submit.TimeZone, SysLengthParam.Info);
    }
    /// <summary>
    /// 取得 Header 值
    /// </summary>
    private string GetHeaderValue(string key)
    {
        return Request.Headers[key].ToString().Trim();
    }
    /// <summary>
    /// 取得使用者 IP
    /// </summary>
    private string GetClientIp()
    {
        string forwarded = GetForwardedIp();
        if (!string.IsNullOrWhiteSpace(forwarded)) return forwarded;

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
    }
    /// <summary>
    /// 取得代理轉發 IP
    /// </summary>
    private string GetForwardedIp()
    {
        string value = FirstText(GetHeaderValue("X-Forwarded-For"), GetHeaderValue("X-Real-IP"), GetHeaderValue("HTTP_CLIENT_IP"));
        return value.Split(',', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim() ?? string.Empty;
    }
    /// <summary>
    /// 遮罩使用者 IP
    /// </summary>
    private string MaskClientIp(string ip)
    {
        if (string.IsNullOrWhiteSpace(ip)) return string.Empty;
        if (!IPAddress.TryParse(ip, out IPAddress? address)) return string.Empty;

        return address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork ? MaskIPv4(address) : MaskIPv6(address);
    }
    /// <summary>
    /// 遮罩 IPv4
    /// </summary>
    private string MaskIPv4(IPAddress address)
    {
        byte[] bytes = address.GetAddressBytes();
        return $"{bytes[0]}.{bytes[1]}.{bytes[2]}.0";
    }
    /// <summary>
    /// 遮罩 IPv6
    /// </summary>
    private string MaskIPv6(IPAddress address)
    {
        byte[] bytes = address.GetAddressBytes();
        Array.Clear(bytes, 8, 8);
        return new IPAddress(bytes).ToString();
    }
    /// <summary>
    /// 雜湊使用者 IP
    /// </summary>
    private string HashClientIp(string ip)
    {
        if (string.IsNullOrWhiteSpace(ip)) return string.Empty;

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(ip.Trim()));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
    /// <summary>
    /// 截斷文字避免超過資料欄位長度
    /// </summary>
    private string CutText(string? value, int maxLength)
    {
        string text = value?.Trim() ?? string.Empty;
        return text.Length <= maxLength ? text : text[..maxLength];
    }
    /// <summary>
    /// 取得第一個有效文字
    /// </summary>
    private string FirstText(params string?[] values)
    {
        return values.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p))?.Trim() ?? string.Empty;
    }

    /// <summary>
    /// 驗證匿名提交的驗證碼
    /// </summary>
    private async Task<CaptchaVerifyResult_DTO> VerifyCaptchaAsync(string? token, CancellationToken ct)
    {
        CaptchaVerifyRequest_DTO request = new() { ResponseToken = token, RemoteIp = GetClientIp() };
        return await CaptchaBiz.VerifyAsync(request, ct);
    }

    /// <summary>
    /// 建立驗證碼錯誤回應
    /// </summary>
    private IActionResult BuildCaptchaErrorResponse(CaptchaVerifyResult_DTO result)
    {
        ApiResponse<string> response = new()
        {
            Data = [],
            SysMessage =
            [
                new SysMessageModel
            {
                Status = SysEnum.MessageStatus.Error,
                MessageCode = "CaptchaVerifyFailed",
                Message = result.Message
            }
            ]
        };
        return BadRequest(response);
    }
    #endregion
}
