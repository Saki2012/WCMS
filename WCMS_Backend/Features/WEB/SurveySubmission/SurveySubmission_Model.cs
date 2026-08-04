using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Metadata;
using SurveyFormModel = WCMS.Features.WEB.Survey.Survey;
namespace WCMS.Features.WEB.SurveySubmission;

/// <summary>
/// 問卷回應
/// </summary>
[LibDesc(DisplayName.SurveySubmissions)]
public class SurveySubmissions : DbModel
{
    /// <summary>
    /// 問卷回覆 ID
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.InternalId, DisplayName.SurveySubmissionId)]
    public string SurveySubmissionId { get; set; } = Guid.NewGuid().ToString();
    /// <summary>
    /// 姓名
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, DisplayName.Common_Name)]
    public string UserName { get; set; } = string.Empty;
    /// <summary>
    /// 聯絡電話
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Phone, DisplayName.Common_HomePhone)]
    public string ContactPhone { get; set; } = string.Empty;
    /// <summary>
    /// Email
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Email, DisplayName.Common_Email)]
    public string Email { get; set; } = string.Empty;

    #region Virtual Fields
    /// <summary>
    /// 動態欄位資料
    /// </summary>
    [NotMapped]
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Survey_SubmitFormData)]
    public string FormDataJson { get; set; } = string.Empty;
    /// <summary>
    /// 欄位快照
    /// </summary>
    [NotMapped]
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Survey_FieldSnapshot)]
    public string FieldSnapshotJson { get; set; } = string.Empty;
    #endregion

    #region Entity Fields
    /// <summary>
    /// 動態欄位資料
    /// </summary>
    [LibField(ApiFieldMode.Ignore, DisplayName.Survey_SubmitFormData)]
    public byte[] FormDataZip { get; set; } = [];
    /// <summary>
    /// 欄位快照
    /// </summary>
    [LibField(ApiFieldMode.Ignore, DisplayName.Survey_FieldSnapshot)]
    public byte[] FieldSnapshotZip { get; set; } = [];
    #endregion

    #region 系統須知資料
    /// <summary>
    /// 表單來源
    /// </summary>
    [ForeignKey(nameof(SurveyId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SurveyFormModel? Survey { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, DisplayName.SurveyId)]
    public string? SurveyId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 送出時間 (UTC)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Survey_SubmitTime_UTC)]
    public DateTime SubmitTime { get; set; }
    /// <summary>
    /// 回覆狀態
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Survey_ReplyStatus)]
    public bool ReplyStatus { get; set; }

    #region 用戶端資訊
    /// <summary>
    /// 瀏覽器 UserAgent
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.WebClient_UserAgent)]
    public string UserAgent { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器偏好語系
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, DisplayName.WebClient_AcceptLanguage)]
    public string AcceptLanguage { get; set; } = string.Empty;
    /// <summary>
    /// 遮罩後用戶 IP
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.IP, DisplayName.WebClient_ClientIpMasked)]
    public string ClientIpMasked { get; set; } = string.Empty;
    /// <summary>
    /// 用戶 IP 雜湊值
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.FileSHA256, DisplayName.WebClient_ClientIpHash)]
    public string ClientIpHash { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, DisplayName.WebClient_BrowserName)]
    public string BrowserName { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器版本
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, DisplayName.WebClient_BrowserVersion)]
    public string BrowserVersion { get; set; } = string.Empty;
    /// <summary>
    /// 作業系統名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, DisplayName.WebClient_OsName)]
    public string OsName { get; set; } = string.Empty;
    /// <summary>
    /// 作業系統版本
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, DisplayName.WebClient_OsVersion)]
    public string OsVersion { get; set; } = string.Empty;
    /// <summary>
    /// 裝置類型
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, DisplayName.WebClient_DeviceType)]
    public string DeviceType { get; set; } = string.Empty;
    /// <summary>
    /// 使用者時區
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, DisplayName.WebClient_TimeZone)]
    public string TimeZone { get; set; } = string.Empty;
    #endregion

    #endregion
}
