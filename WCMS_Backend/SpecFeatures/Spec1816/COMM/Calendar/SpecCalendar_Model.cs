using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SpecFeatures.Spec1816._Resx;
using WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
namespace WCMS.Features.COMM.Calendar;

/// <summary>
/// 擴充行事曆每日資料的圖書館開館資訊。
/// </summary>
public partial class CalendarDetail
{
    #region Property
    /// <summary>
    /// 對應的學年度開館規則。
    /// </summary>
    [ForeignKey(nameof(Spec_AcademicYearId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecOpenScheduleRule? Spec_AcademicYear { get; set; }
    /// <summary>
    /// 對應的學年度代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, SpecModelDisplayName.SpecAcademicYearId)]
    public string? Spec_AcademicYearId { get; set; }
    /// <summary>
    /// 當日開館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_OpenTime)]
    public TimeOnly? Spec_OpenTime { get; set; }
    /// <summary>
    /// 當日閉館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_CloseTime)]
    public TimeOnly? Spec_CloseTime { get; set; }
    /// <summary>
    /// 當日人工修改備註。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.Common_Memo)]
    public string Spec_ModifyMemo { get; set; } = string.Empty;
    #endregion
}
