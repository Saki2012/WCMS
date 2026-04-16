using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1816.Resx;
using WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.Features.SystemSetting.Calendar;

public partial class CalendarDetail_DTO
{
    /// <summary>
    /// 學年度(關聯SpecOpenScheduleRule)
    /// </summary>
    [ForeignKey(nameof(Spec_AcademicYearId))] public SpecOpenScheduleRuleModel? Spec_AcademicYear { get; set; }
    [StringLength(SysLengthParam.ID)] public string? Spec_AcademicYearId { get; set; }
    /// <summary>
    /// 開館時間
    /// (為null時代表閉館)
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_OpenTime)]public TimeOnly? Spec_OpenTime { get; set; }
    /// <summary>
    /// 閉館時間
    /// (為null時代表閉館)
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_CloseTime)] public TimeOnly? Spec_CloseTime { get; set; }
    /// <summary>
    /// 修改備註
    /// 注:大備註，每一次輸入完都會記錄成
    /// 時間:使用者:備註內容
    /// 每次紀錄就往下追加一行
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Memo), StringLength(SysLengthParam.Memo)] public string? Spec_ModifyMemo { get; set; } = string.Empty;
}
/// <summary>
/// 顯示首頁開館時間資訊
/// </summary>
public sealed class SpecCurrentOpenTime_DTO
{
    /// <summary>
    /// 日期
    /// </summary>
    public DateOnly Date { get; set; }
    /// <summary>
    /// 星期
    /// </summary>
    public DayOfWeek DayOfWeek { get; set; }
    /// <summary>
    /// 節日名
    /// </summary>
    public string HolidayName { get; set; }
    /// <summary>
    /// 開館時間
    /// </summary>
    public TimeOnly? Spec_OpenTime { get; set; }
    /// <summary>
    /// 閉館時間
    /// </summary>
    public TimeOnly? Spec_CloseTime { get; set; }

}
