using System.ComponentModel.DataAnnotations;
using WCMS.SpecFeatures.Spec1816._Resx;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;

/// <summary>
/// 圖書館學年度開館時間規則。
/// </summary>
[LibDesc(SpecModelDisplayName.SpecOpenScheduleRule)]
public class SpecOpenScheduleRule : HeaderModel
{
    #region Property
    /// <summary>
    /// 學年度代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, SpecModelDisplayName.SpecAcademicYearId)]
    public string AcademicYearId { get; set; } = string.Empty;
    /// <summary>
    /// 學年度開始日。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecAcademicStart)]
    public DateOnly AcademicStart { get; set; }
    /// <summary>
    /// 學年度結束日。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecAcademicEnd)]
    public DateOnly AcademicEnd { get; set; }
    /// <summary>
    /// 平日開館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecWeekday_OpenTime)]
    public TimeOnly? Weekday_OpenTime { get; set; }
    /// <summary>
    /// 平日閉館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecWeekday_CloseTime)]
    public TimeOnly? Weekday_CloseTime { get; set; }
    /// <summary>
    /// 週六開館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSat_OpenTime)]
    public TimeOnly? Sat_OpenTime { get; set; }
    /// <summary>
    /// 週六閉館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSat_CloseTime)]
    public TimeOnly? Sat_CloseTime { get; set; }
    /// <summary>
    /// 週日開館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSun_OpenTime)]
    public TimeOnly? Sun_OpenTime { get; set; }
    /// <summary>
    /// 週日閉館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSun_CloseTime)]
    public TimeOnly? Sun_CloseTime { get; set; }
    /// <summary>
    /// 寒假開始日。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecWinterStart)]
    public DateOnly WinterStart { get; set; }
    /// <summary>
    /// 寒假結束日。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecWinterEnd)]
    public DateOnly WinterEnd { get; set; }
    /// <summary>
    /// 寒假平日開館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecWinter_Weekday_OpenTime)]
    public TimeOnly? Winter_Weekday_OpenTime { get; set; }
    /// <summary>
    /// 寒假平日閉館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecWinter_Weekday_CloseTime)]
    public TimeOnly? Winter_Weekday_CloseTime { get; set; }
    /// <summary>
    /// 寒假週六開館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecWinter_Sat_OpenTime)]
    public TimeOnly? Winter_Sat_OpenTime { get; set; }
    /// <summary>
    /// 寒假週六閉館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecWinter_Sat_CloseTime)]
    public TimeOnly? Winter_Sat_CloseTime { get; set; }
    /// <summary>
    /// 寒假週日開館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecWinter_Sun_OpenTime)]
    public TimeOnly? Winter_Sun_OpenTime { get; set; }
    /// <summary>
    /// 寒假週日閉館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecWinter_Sun_CloseTime)]
    public TimeOnly? Winter_Sun_CloseTime { get; set; }
    /// <summary>
    /// 暑假開始日。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSummerStart)]
    public DateOnly SummerStart { get; set; }
    /// <summary>
    /// 暑假結束日。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSummerEnd)]
    public DateOnly SummerEnd { get; set; }
    /// <summary>
    /// 暑假平日開館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSummer_Weekday_OpenTime)]
    public TimeOnly? Summer_Weekday_OpenTime { get; set; }
    /// <summary>
    /// 暑假平日閉館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSummer_Weekday_CloseTime)]
    public TimeOnly? Summer_Weekday_CloseTime { get; set; }
    /// <summary>
    /// 暑假週六開館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSummer_Sat_OpenTime)]
    public TimeOnly? Summer_Sat_OpenTime { get; set; }
    /// <summary>
    /// 暑假週六閉館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSummer_Sat_CloseTime)]
    public TimeOnly? Summer_Sat_CloseTime { get; set; }
    /// <summary>
    /// 暑假週日開館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSummer_Sun_OpenTime)]
    public TimeOnly? Summer_Sun_OpenTime { get; set; }
    /// <summary>
    /// 暑假週日閉館時間；空值代表閉館。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecSummer_Sun_CloseTime)]
    public TimeOnly? Summer_Sun_CloseTime { get; set; }
    /// <summary>
    /// 修改備註。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.Common_Memo)]
    public string ModifyMemo { get; set; } = string.Empty;
    #endregion
}
