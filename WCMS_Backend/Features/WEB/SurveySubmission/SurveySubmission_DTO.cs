using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using SurveyFormModel = WCMS.Features.WEB.Survey.Survey;
namespace WCMS.Features.WEB.SurveySubmission;

/// <summary>
/// 前台問卷提交資料
/// </summary>
[LibDesc]
public class SurveySubmissionRequest_DTO
{
    /// <summary>
    /// 問卷代碼
    /// </summary>
    [LibDesc(DisplayName.SurveyId), StringLength(DbStrLen.ID)] public string? SurveyId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(DisplayName.Common_Lang)] public LangCode? Lang { get; set; }
    /// <summary>
    /// 用戶名稱
    /// </summary>
    [LibDesc(DisplayName.Common_Name), StringLength(DbStrLen.Name)] public string? UserName { get; set; } = string.Empty;
    /// <summary>
    /// 聯絡電話
    /// </summary>
    [LibDesc(DisplayName.Common_HomePhone), StringLength(DbStrLen.Phone)] public string? ContactPhone { get; set; } = string.Empty;
    /// <summary>
    /// Email
    /// </summary>
    [LibDesc(DisplayName.Common_Email), StringLength(DbStrLen.Email)] public string? Email { get; set; } = string.Empty;
    /// <summary>
    /// 動態欄位資料 JSON，前台送原始 JSON 字串即可
    /// </summary>
    [LibDesc] public string? FormDataJson { get; set; } = "{}";
    /// <summary>
    /// 使用者時區
    /// </summary>
    [LibDesc, StringLength(DbStrLen.Info)] public string? TimeZone { get; set; } = string.Empty;
    /// <summary>
    /// 驗證碼 Token
    /// </summary>
    [LibDesc, StringLength(2048)] public string? CaptchaToken { get; set; } = string.Empty;
}
/// <summary>
/// 問卷提交檢查暫存
/// </summary>
internal sealed class SurveySubmitContext
{
    public SurveySubmissions Submit { get; set; } = new();
    public SurveyFormModel Survey { get; set; } = new();
    public string RawFormDataJson { get; set; } = "{}";
    public Dictionary<string, JsonElement> FormData { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
/// <summary>
/// 欄位快照
/// </summary>
internal sealed class SurveyFieldSnapshot
{
    public string FieldId { get; set; } = string.Empty;
    public string FieldName { get; set; } = string.Empty;
    public string InputType { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public string? Options { get; set; }
    public List<SurveyFieldLangSnapshot> Langs { get; set; } = [];
}
/// <summary>
/// 欄位語系快照
/// </summary>
internal sealed class SurveyFieldLangSnapshot
{
    public string Lang { get; set; } = string.Empty;
    public string FieldName { get; set; } = string.Empty;
}
