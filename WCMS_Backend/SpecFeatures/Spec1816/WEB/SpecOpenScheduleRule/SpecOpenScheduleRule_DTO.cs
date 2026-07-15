using System.ComponentModel.DataAnnotations;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1816._Resx;
namespace WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;

[LibDesc(SpecModelDisplayName.SpecOpenScheduleRuleSet_DTO)]public class SpecOpenScheduleRuleSet_DTO:ITSet_DTO 
{
    public SpecOpenScheduleRuleModel_DTO SpecOpenScheduleRule { get; set; } = new();
}

public class SpecOpenScheduleRuleModel_DTO: DTOBasicDataModel
{
    /// <summary>
    /// 學年度(Id)
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecAcademicYearId),StringLength(SysLengthParam.ID)] public string? AcademicYearId { get; set; }
    /// <summary>
    /// 學年度起
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecAcademicStart)]public DateOnly? AcademicStart { get; set; }
    /// <summary>
    /// 學年度迄
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecAcademicEnd)] public DateOnly? AcademicEnd { get; set; }
    /// <summary>
    /// 平日開館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecWeekday_OpenTime)] public TimeOnly? Weekday_OpenTime { get; set; }
    /// <summary>
    /// 平日閉館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecWeekday_CloseTime)] public TimeOnly? Weekday_CloseTime { get; set; }
    /// <summary>
    /// 週六開館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSat_OpenTime)] public TimeOnly? Sat_OpenTime { get; set; }
    /// <summary>
    /// 週六閉館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSat_CloseTime)] public TimeOnly? Sat_CloseTime { get; set; }
    /// <summary>
    /// 週日開館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSun_OpenTime)] public TimeOnly? Sun_OpenTime { get; set; }
    /// <summary>
    /// 週日閉館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSun_CloseTime)] public TimeOnly? Sun_CloseTime { get; set; }
    /// <summary>
    /// 寒假開始日
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecWinterStart)] public DateOnly? WinterStart { get; set; }
    /// <summary>
    /// 寒假結束日
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecWinterEnd)] public DateOnly? WinterEnd { get; set; }
    /// <summary>
    /// 寒假平日開館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecWinter_Weekday_OpenTime)] public TimeOnly? Winter_Weekday_OpenTime { get; set; }
    /// <summary>
    /// 寒假平日閉館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecWinter_Weekday_CloseTime)] public TimeOnly? Winter_Weekday_CloseTime { get; set; }
    /// <summary>
    /// 寒假週六開館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecWinter_Sat_OpenTime)] public TimeOnly? Winter_Sat_OpenTime { get; set; }
    /// <summary>
    /// 寒假週六閉館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecWinter_Sat_CloseTime)] public TimeOnly? Winter_Sat_CloseTime { get; set; }
    /// <summary>
    /// 寒假週日開館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecWinter_Sun_OpenTime)] public TimeOnly? Winter_Sun_OpenTime { get; set; }
    /// <summary>
    /// 寒假週日閉館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecWinter_Sun_CloseTime)] public TimeOnly? Winter_Sun_CloseTime { get; set; }
    /// <summary>
    /// 暑假開始日
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSummerStart)] public DateOnly? SummerStart { get; set; }
    /// <summary>
    /// 暑假結束日
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSummerEnd)] public DateOnly? SummerEnd { get; set; }
    /// <summary>
    /// 暑假平日開館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSummer_Weekday_OpenTime)] public TimeOnly? Summer_Weekday_OpenTime { get; set; }
    /// <summary>
    /// 暑假平日閉館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSummer_Weekday_CloseTime)] public TimeOnly? Summer_Weekday_CloseTime { get; set; }
    /// <summary>
    /// 暑假週六開館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSummer_Sat_OpenTime)] public TimeOnly? Summer_Sat_OpenTime { get; set; }
    /// <summary>
    /// 暑假週六閉館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSummer_Sat_CloseTime)] public TimeOnly? Summer_Sat_CloseTime { get; set; }
    /// <summary>
    /// 暑假週日開館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSummer_Sun_OpenTime)] public TimeOnly? Summer_Sun_OpenTime { get; set; }
    /// <summary>
    /// 暑假週日閉館時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecSummer_Sun_CloseTime)] public TimeOnly? Summer_Sun_CloseTime { get; set; }
    /// <summary>
    /// 修改備註
    /// 注:大備註，每一次輸入完都會記錄成
    /// 時間:使用者:備註內容
    /// 每次紀錄就往下追加一行
    /// 不同步追加到 SpecOpenSchedule_Mode 的 ModifyMemo
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Memo), StringLength(SysLengthParam.Memo)] public string? ModifyMemo { get; set; } = string.Empty;
}
