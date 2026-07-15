using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.Features.WEB.Survey;

/// <summary>
/// 問卷
/// </summary>
public class Survey : HeaderModel
{
    /// <summary>
    /// 問卷ID
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.SurveyId)]
    public string SurveyId { get; set; } = string.Empty;
    /// <summary>
    /// 問卷名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, DisplayName.SurveyName)]
    public string SurveyName { get; set; } = string.Empty;
    /// <summary>
    /// 問卷描述
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SurveyDescription)]
    public string SurveyDescription { get; set; } = string.Empty;
    /// <summary>
    /// 問卷提交成功後的顯示內容
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SurveySuccessContent)]
    public string SurveySuccessContent { get; set; } = string.Empty;

    #region 主子表關聯
    [InverseProperty(nameof(SurveyItem._Survey))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SurveyItem> _SurveyItem { get; set; } = [];
    #endregion
}
/// <summary>
/// 問卷
/// </summary>
public class SurveyItem : DetailModel
{
    /// <summary>
    /// 問卷代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.SurveyId)]
    public string SurveyId { get; set; } = string.Empty;
    /// <summary>
    /// 行代碼
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    /// <summary>
    /// 動態欄位代號
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Field)]
    public string FieldId { get; set; } = string.Empty;
    /// <summary>
    /// 是否必填
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_IsRequired)]
    public bool IsRequired { get; set; }
    /// <summary>
    /// 輸入欄位類型
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Enum_LibInputType)]
    public LibInputType InputType { get; set; }
    /// <summary>
    /// 選項資料，每行一個選項
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Options)]
    public string Options { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(SurveyId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public Survey _Survey { get; set; } = null!;
    [InverseProperty(nameof(SurveyItemLang._SurveyItem))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SurveyItemLang> _SurveyItemLang { get; set; } = [];
    #endregion
}
/// <summary>
/// 
/// </summary>
public class SurveyItemLang : DetailModel
{
    /// <summary>
    /// 問卷代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.SurveyId)]
    public string SurveyId { get; set; } = string.Empty;
    /// <summary>
    /// 父行代碼
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
    public int ParentRowId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 動態欄位名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_FieldDisplayName)]
    public string FieldName { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey($@"{nameof(SurveyId)},{nameof(ParentRowId)}")]
    [LibField(ApiFieldMode.ReadOnly)]
    public SurveyItem _SurveyItem { get; set; }
    #endregion
}
