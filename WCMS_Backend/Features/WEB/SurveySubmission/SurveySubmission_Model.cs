using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using WCMS.Features._Resx;
using WCMS.Features.WEB.Survey;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
namespace WCMS.Features.WEB.SurveySubmission;

/// <summary>
/// 問卷回覆單
/// </summary>
public class SurveySubmissionsSet : ITSet
{
    public SurveySubmissions SurveySubmissions { get; set; } = new SurveySubmissions();
}

/// <summary>
/// 問卷回應
/// </summary>
public class SurveySubmissions : DetailRowModel
{
    /// <summary>
    /// 問卷回覆 ID
    /// </summary>
    [LibDesc(ModelDisplayName.SurveySubmissionId), Key, StringLength(SysLengthParam.InternalId)] public string SurveySubmissionId { get; set; } = Guid.NewGuid().ToString();
    /// <summary>
    /// 姓名
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Name), StringLength(SysLengthParam.Name)] public string UserName { get; set; }
    /// <summary>
    /// 聯絡電話
    /// </summary>
    [LibDesc(ModelDisplayName.Common_HomePhone), StringLength(SysLengthParam.Phone)] public string ContactPhone { get; set; }
    /// <summary>
    /// Email
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Email), StringLength(SysLengthParam.Email)] public string Email { get; set; }
    /// <summary>
    /// 動態欄位資料
    /// </summary>
    [LibDesc(ModelDisplayName.Survey_SubmitFormData)] public byte[] FormDataZip { get; set; } = [];
    /// <summary>
    /// 欄位快照
    /// </summary>
    [LibDesc(ModelDisplayName.Survey_FieldSnapshot)] public byte[] FieldSnapshotZip { get; set; } = [];

    #region 系統須知資料
    /// <summary>
    /// 表單來源
    /// </summary>
    [ForeignKey(nameof(SurveyId))] public Survey.Survey Survey { get; set; }
    [LibDesc(ModelDisplayName.SurveyId), StringLength(SysLengthParam.ID)] public string SurveyId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode Lang { get; set; }
    /// <summary>
    /// 送出時間 (UTC)
    /// </summary>
    [LibDesc(ModelDisplayName.Survey_SubmitTime_UTC)] public DateTime SubmitTime { get; set; }
    /// <summary>
    /// 回覆狀態
    /// </summary>
    [LibDesc(ModelDisplayName.Survey_ReplyStatus)] public bool ReplyStatus { get; set; }

    #region 用戶端資訊
    /// <summary>
    /// 瀏覽器 UserAgent
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_UserAgent), StringLength(SysLengthParam.Memo)] public string UserAgent { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器偏好語系
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_AcceptLanguage), StringLength(SysLengthParam.Info)] public string AcceptLanguage { get; set; } = string.Empty;
    /// <summary>
    /// 遮罩後用戶 IP
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_ClientIpMasked), StringLength(SysLengthParam.IP)] public string ClientIpMasked { get; set; } = string.Empty;
    /// <summary>
    /// 用戶 IP 雜湊值
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_ClientIpHash), StringLength(SysLengthParam.FileSHA256)] public string ClientIpHash { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器名稱
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_BrowserName), StringLength(SysLengthParam.Info)] public string BrowserName { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器版本
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_BrowserVersion), StringLength(SysLengthParam.Info)] public string BrowserVersion { get; set; } = string.Empty;
    /// <summary>
    /// 作業系統名稱
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_OsName), StringLength(SysLengthParam.Info)] public string OsName { get; set; } = string.Empty;
    /// <summary>
    /// 作業系統版本
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_OsVersion), StringLength(SysLengthParam.Info)] public string OsVersion { get; set; } = string.Empty;
    /// <summary>
    /// 裝置類型
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_DeviceType), StringLength(SysLengthParam.Info)] public string DeviceType { get; set; } = string.Empty;
    /// <summary>
    /// 使用者時區
    /// </summary>
    [LibDesc(ModelDisplayName.WebClient_TimeZone), StringLength(SysLengthParam.Info)] public string TimeZone { get; set; } = string.Empty;
    #endregion

    #endregion
}

/// <summary>
/// 問卷提交檢查暫存
/// </summary>
internal sealed class SurveySubmitContext
{
    public SurveySubmissions Submit { get; set; } = new();
    public SurveySet SurveySet { get; set; } = new();
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
    public string Options { get; set; }
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
