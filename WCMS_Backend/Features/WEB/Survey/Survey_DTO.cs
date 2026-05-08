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
[LibDesc] public class SurveySet_DTO : ITSet_DTO
{
    [LibDesc] public Survey_DTO? Survey { get; set; } = new();
    [LibDesc] public List<SurveyItem_DTO>? SurveyItem { get; set; } = [];
    [LibDesc] public List<SurveyItemLang_DTO>? SurveyItemLang { get; set; } = [];
}
/// <summary>
/// 問卷
/// </summary>
[LibDesc] public class Survey_DTO : DTOBasicDataModel
{
    /// <summary>
    /// 問卷ID
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyId), StringLength(SysLengthParam.ID)] public string? SurveyId { get; set; }
    /// <summary>
    /// 問卷名稱
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyName), StringLength(SysLengthParam.Name)] public string? SurveyName { get; set; } = string.Empty;
    /// <summary>
    /// 問卷描述
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyDescription)] public string? SurveyDescription { get; set; } = string.Empty;
    /// <summary>
    /// 問卷提交成功後的顯示內容
    /// </summary>
    [LibDesc(ModelDisplayName.SurveySuccessContent)] public string? SurveySuccessContent { get; set; } = string.Empty;

    #region 主子表關聯
    public List<SurveyItem_DTO>? _SurveyItem { get; set; }
    #endregion
}
/// <summary>
/// 問卷欄位
/// </summary>
[LibDesc] public class SurveyItem_DTO
{
    /// <summary>
    /// 問卷代碼
    /// </summary>
    [LibDesc(ModelDisplayName.SurveyId), StringLength(SysLengthParam.ID)] public string? SurveyId { get; set; }

    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }

    /// <summary>
    /// 動態欄位代號
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Field), StringLength(SysLengthParam.ID)] public string? FieldId { get; set; } = string.Empty;

    /// <summary>
    /// 是否必填
    /// </summary>
    [LibDesc(ModelDisplayName.Common_IsRequired)] public bool? IsRequired { get; set; }

    /// <summary>
    /// 欄位類型
    /// </summary>
    [LibDesc(ModelDisplayName.Enum_LibInputType)] public LibInputType? InputType { get; set; }

    /// <summary>
    /// 選項資料，每行一個選項
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Options)] public string? Options { get; set; } = string.Empty;

    #region 主子表關聯

    [ForeignKey(nameof(SurveyId))] public Survey_DTO? _Survey { get; set; }

    [InverseProperty(nameof(SurveyItemLang_DTO._SurveyItem))] public List<SurveyItemLang_DTO>? _SurveyItemLang { get; set; }

    #endregion
}
/// <summary>
/// 問卷欄位語系
/// </summary>
[LibDesc] public class SurveyItemLang_DTO
{
    /// <summary>
    /// 問卷代碼
    /// </summary>
    [LibDesc(), StringLength(SysLengthParam.ID)] public string? SurveyId { get; set; }

    /// <summary>
    /// 父行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_ParentRowId)] public int? ParentRowId { get; set; }

    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }

    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }

    /// <summary>
    /// 動態欄位名稱
    /// </summary>
    [LibDesc(ModelDisplayName.Common_FieldDisplayName), StringLength(SysLengthParam.Title)] public string? FieldName { get; set; } = string.Empty;

    #region 主子表關聯

    [ForeignKey($@"{nameof(SurveyId)},{nameof(ParentRowId)}")] public SurveyItem_DTO? _SurveyItem { get; set; }

    #endregion
}
