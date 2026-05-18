using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.Features.WEB.Survey;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.WEB.SurveySubmission;

/// <summary>
/// 問卷提交單
/// </summary>
[LibDesc]
public class SurveySubmissionsSet_DTO : ITSet_DTO
{
    [LibDesc] public SurveySubmissions_DTO? SurveySubmissions { get; set; } = new();
}

/// <summary>
/// 問卷回應
/// </summary>
[LibDesc] public class SurveySubmissions_DTO
{
    /// <summary>
    /// 問卷回應ID
    /// </summary>
    [LibDesc(ModelDisplayName.SurveySubmissionId), StringLength(SysLengthParam.InternalId)] public string? SurveySubmissionId { get; set; } = new Guid().ToString();
    /// <summary>
    /// 用戶名稱
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Name), StringLength(SysLengthParam.Name)] public string? UserName { get; set; } = string.Empty;
    /// <summary>
    /// 聯絡電話
    /// </summary>
    [LibDesc(ModelDisplayName.Common_HomePhone), StringLength(SysLengthParam.Phone)] public string? ContactPhone { get; set; } = string.Empty;
    /// <summary>
    /// Email
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Email), StringLength(SysLengthParam.Email)] public string? Email { get; set; } = string.Empty;
    /// <summary>
    /// 動態欄位資料
    /// </summary>
    [LibDesc(ModelDisplayName.Survey_SubmitFormData)] public string FormDataJson { get; set; } = string.Empty;
    /// <summary>
    /// 欄位快照
    /// </summary>
    [LibDesc(ModelDisplayName.Survey_FieldSnapshot)] public string FieldSnapshotJson { get; set; } = string.Empty;

    #region 系統須知資料
    /// <summary>
    /// 表單來源
    /// </summary>
    [ForeignKey(nameof(SurveyId))] public Survey_DTO? Survey { get; set; }
    [LibDesc(ModelDisplayName.SurveyId), StringLength(SysLengthParam.ID)] public string? SurveyId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
    /// <summary>
    /// 送出時間 (UTC)
    /// </summary>
    [LibDesc(ModelDisplayName.Survey_SubmitTime_UTC)] public DateTime? SubmitTime { get; set; }
    /// <summary>
    /// 回覆狀態
    /// </summary>
    [LibDesc(ModelDisplayName.Survey_ReplyStatus)] public bool? ReplyStatus { get; set; }
    
    #region 用戶端資訊
    /// <summary>
    /// 瀏覽器 UserAgent
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_UserAgent), StringLength(SysLengthParam.Memo)] public string? UserAgent { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器偏好語系
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_AcceptLanguage), StringLength(SysLengthParam.Info)] public string? AcceptLanguage { get; set; } = string.Empty;
    /// <summary>
    /// 遮罩後用戶 IP
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_ClientIpMasked), StringLength(SysLengthParam.IP)] public string? ClientIpMasked { get; set; } = string.Empty;
    /// <summary>
    /// 用戶 IP 雜湊值
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_ClientIpHash), StringLength(SysLengthParam.FileSHA256)] public string? ClientIpHash { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器名稱
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_BrowserName), StringLength(SysLengthParam.Info)] public string? BrowserName { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器版本
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_BrowserVersion), StringLength(SysLengthParam.Info)] public string? BrowserVersion { get; set; } = string.Empty;
    /// <summary>
    /// 作業系統名稱
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_OsName), StringLength(SysLengthParam.Info)] public string? OsName { get; set; } = string.Empty;
    /// <summary>
    /// 作業系統版本
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_OsVersion), StringLength(SysLengthParam.Info)] public string? OsVersion { get; set; } = string.Empty;
    /// <summary>
    /// 裝置類型
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_DeviceType), StringLength(SysLengthParam.Info)] public string? DeviceType { get; set; } = string.Empty;
    /// <summary>
    /// 使用者時區
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_TimeZone), StringLength(SysLengthParam.Info)] public string? TimeZone { get; set; } = string.Empty;
    #endregion

    #endregion
}


/// <summary>
/// 前台問卷提交資料
/// </summary>
[LibDesc]
public class SurveySubmissionRequest_DTO
{
    /// <summary>
    /// 問卷代碼
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyId), StringLength(SysLengthParam.ID)] public string? SurveyId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
    /// <summary>
    /// 用戶名稱
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Name), StringLength(SysLengthParam.Name)] public string? UserName { get; set; } = string.Empty;
    /// <summary>
    /// 聯絡電話
    /// </summary>
    [LibDesc(ModelDisplayName.Common_HomePhone), StringLength(SysLengthParam.Phone)] public string? ContactPhone { get; set; } = string.Empty;
    /// <summary>
    /// Email
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Email), StringLength(SysLengthParam.Email)] public string? Email { get; set; } = string.Empty;
    /// <summary>
    /// 動態欄位資料 JSON，前台送原始 JSON 字串即可
    /// </summary>
    [LibDesc] public string? FormDataJson { get; set; } = "{}";
    /// <summary>
    /// 使用者時區
    /// </summary>
    [LibDesc, StringLength(SysLengthParam.Info)] public string? TimeZone { get; set; } = string.Empty;
    /// <summary>
    /// 驗證碼 Token
    /// </summary>
    [LibDesc, StringLength(2048)] public string? CaptchaToken { get; set; } = string.Empty;
}
