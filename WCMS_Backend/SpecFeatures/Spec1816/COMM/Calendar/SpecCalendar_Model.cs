using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SpecFeatures.Spec1816._Resx;
using WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SpecFeatures.Spec1817._Resx;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.Features.SystemSetting.Calendar;

public partial class CalendarDetail 
{
    /// <summary>
    /// 學年度(關聯SpecOpenScheduleRule)
    /// </summary>
[ForeignKey(nameof(Spec_AcademicYearId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecOpenScheduleRuleModel? Spec_AcademicYear { get; set; }
[StringLength(SysLengthParam.ID)]
[LibField(ApiFieldMode.ReadWrite)]
public string? Spec_AcademicYearId { get; set; }
    /// <summary>
    /// 開館時間
    /// (為null時代表閉館)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_OpenTime)]
public TimeOnly Spec_OpenTime { get; set; }
    /// <summary>
    /// 閉館時間
    /// (為null時代表閉館)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_CloseTime)]
public TimeOnly Spec_CloseTime { get; set; }
    /// <summary>
    /// 修改備註
    /// 注:大備註，每一次輸入完都會記錄成
    /// 時間:使用者:備註內容
    /// 每次紀錄就往下追加一行
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, DisplayName.Common_Memo)]
public string Spec_ModifyMemo { get; set; }= string.Empty;

}
