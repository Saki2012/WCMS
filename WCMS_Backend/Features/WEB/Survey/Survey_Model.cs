using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.Survey;

/// <summary>
/// 問卷單
/// </summary>
public class SurveySet:ITSet
{
    public Survey Survey { get; set; } = new Survey();
    public List<SurveyItem> SurveyItem { get; set; } = [];
    public List<SurveyItemLang> SurveyItemLang { get; set; } = [];
}
/// <summary>
/// 問卷
/// </summary>
public class Survey: MasterDataModel
{
    /// <summary>
    /// 問卷ID
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyId), Key, StringLength(SysLengthParam.ID)] public string SurveyId { get; set; }
    /// <summary>
    /// 問卷名稱
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyName), StringLength(SysLengthParam.Name)] public string SurveyName { get; set; } = string.Empty;
    /// <summary>
    /// 問卷描述
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyDescription)] public string SurveyDescription { get; set; } = string.Empty;
    /// <summary>
    /// 問卷提交成功後的顯示內容
    /// </summary>
    [LibDesc(ModelDisplayName.SurveySuccessContent)] public string SurveySuccessContent { get; set; } = string.Empty;
    #region 主子表關聯
    [InverseProperty(nameof(SurveyItem._Survey))] public List<SurveyItem> _SurveyItem { get; set; }
    #endregion
}
/// <summary>
/// 問卷
/// </summary>
public class SurveyItem : DetailRowModel
{
    /// <summary>
    /// 問卷代碼
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyId), Key, StringLength(SysLengthParam.ID)] public string SurveyId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 動態欄位代號
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Field)] public string FieldId { get; set; }
    /// <summary>
    /// 是否必填
    /// </summary>
    [LibDesc(ModelDisplayName.Common_IsRequired)] public bool IsRequired { get; set; }
    /// <summary>
    /// 輸入欄位類型
    /// </summary>
    [LibDesc(ModelDisplayName.Enum_LibInputType)]public LibInputType InputType { get; set; }
    /// <summary>
    /// 選項資料(JSON格式)
    /// </summary>
    [LibDesc(ModelDisplayName.Common_OptionJson)] public string? OptionJson { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(SurveyId))] public Survey _Survey { get; set; } = null!;
    [InverseProperty(nameof(SurveyItemLang._SurveyItem))] public List<SurveyItemLang> _SurveyItemLang { get; set; }
    #endregion
}
/// <summary>
/// 
/// </summary>
public class SurveyItemLang : DetailRowModel
{
    /// <summary>
    /// 問卷代碼
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyId), Key, StringLength(SysLengthParam.ID)] public string SurveyId { get; set; }
    /// <summary>
    /// 父行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_ParentRowId), Key] public int ParentRowId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode Lang { get; set; }
    /// <summary>
    /// 動態欄位名稱
    /// </summary>
    [LibDesc(ModelDisplayName.Common_FieldDisplayName), StringLength(SysLengthParam.Title)] public string FieldName { get; set; }

    #region 主子表關聯
    [ForeignKey($@"{nameof(SurveyId)},{nameof(ParentRowId)}")] public SurveyItem _SurveyItem { get; set; }
    #endregion
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
    [LibDesc()] public byte[] FormDataZip { get; set; } = [];
    /// <summary>
    /// 欄位快照
    /// </summary>
    [LibDesc()] public byte[] FieldSnapshotZip { get; set; } = [];


    #region 系統須知資料
    /// <summary>
    /// 表單來源
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyId),Key, StringLength(SysLengthParam.InternalId)] public string SurveyId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode Lang { get; set; }
    /// <summary>
    /// 送出時間 (UTC)
    /// </summary>
    [LibDesc()] public DateTime SubmitTime { get; set; }
    /// <summary>
    /// 回覆狀態
    /// </summary>
    [LibDesc()] public bool ReplyStatus { get; set; }
    #region 用戶端資訊
    /// <summary>
    /// 瀏覽器 UserAgent
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.Memo)] public string UserAgent { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器偏好語系
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.Info)] public string AcceptLanguage { get; set; } = string.Empty;
    /// <summary>
    /// 遮罩後用戶 IP
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.IP)] public string ClientIpMasked { get; set; } = string.Empty;
    /// <summary>
    /// 用戶 IP 雜湊值
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.FileSHA256)] public string ClientIpHash { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器名稱
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.Info)] public string BrowserName { get; set; } = string.Empty;
    /// <summary>
    /// 瀏覽器版本
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.Info)] public string BrowserVersion { get; set; } = string.Empty;
    /// <summary>
    /// 作業系統名稱
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.Info)] public string OsName { get; set; } = string.Empty;
    /// <summary>
    /// 作業系統版本
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.Info)] public string OsVersion { get; set; } = string.Empty;
    /// <summary>
    /// 裝置類型
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.Info)] public string DeviceType { get; set; } = string.Empty;
    /// <summary>
    /// 使用者時區
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.Info)] public string TimeZone { get; set; } = string.Empty;
    #endregion
    #endregion
}