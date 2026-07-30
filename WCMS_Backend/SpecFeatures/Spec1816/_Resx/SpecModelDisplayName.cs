using WCMS.Features.COMM.Calendar;
using SpecOpenScheduleRuleModel = WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule.SpecOpenScheduleRule;
namespace WCMS.SpecFeatures.Spec1816._Resx;

/// <summary>
/// 集中管理 Spec1816 模型欄位的多語資源鍵。
/// </summary>
public static class SpecModelDisplayName
{
    #region SpecOpenScheduleRule
    /// <summary>學年度開館規則。</summary>
    public const string SpecOpenScheduleRule = nameof(SpecOpenScheduleRuleModel);
    /// <summary>學年度代碼。</summary>
    public const string SpecAcademicYearId = nameof(SpecOpenScheduleRuleModel.AcademicYearId);
    /// <summary>學年度開始日。</summary>
    public const string SpecAcademicStart = nameof(SpecOpenScheduleRuleModel.AcademicStart);
    /// <summary>學年度結束日。</summary>
    public const string SpecAcademicEnd = nameof(SpecOpenScheduleRuleModel.AcademicEnd);
    /// <summary>平日開館時間。</summary>
    public const string SpecWeekday_OpenTime = nameof(SpecOpenScheduleRuleModel.Weekday_OpenTime);
    /// <summary>平日閉館時間。</summary>
    public const string SpecWeekday_CloseTime = nameof(SpecOpenScheduleRuleModel.Weekday_CloseTime);
    /// <summary>週六開館時間。</summary>
    public const string SpecSat_OpenTime = nameof(SpecOpenScheduleRuleModel.Sat_OpenTime);
    /// <summary>週六閉館時間。</summary>
    public const string SpecSat_CloseTime = nameof(SpecOpenScheduleRuleModel.Sat_CloseTime);
    /// <summary>週日開館時間。</summary>
    public const string SpecSun_OpenTime = nameof(SpecOpenScheduleRuleModel.Sun_OpenTime);
    /// <summary>週日閉館時間。</summary>
    public const string SpecSun_CloseTime = nameof(SpecOpenScheduleRuleModel.Sun_CloseTime);
    /// <summary>寒假開始日。</summary>
    public const string SpecWinterStart = nameof(SpecOpenScheduleRuleModel.WinterStart);
    /// <summary>寒假結束日。</summary>
    public const string SpecWinterEnd = nameof(SpecOpenScheduleRuleModel.WinterEnd);
    /// <summary>寒假平日開館時間。</summary>
    public const string SpecWinter_Weekday_OpenTime = nameof(SpecOpenScheduleRuleModel.Winter_Weekday_OpenTime);
    /// <summary>寒假平日閉館時間。</summary>
    public const string SpecWinter_Weekday_CloseTime = nameof(SpecOpenScheduleRuleModel.Winter_Weekday_CloseTime);
    /// <summary>寒假週六開館時間。</summary>
    public const string SpecWinter_Sat_OpenTime = nameof(SpecOpenScheduleRuleModel.Winter_Sat_OpenTime);
    /// <summary>寒假週六閉館時間。</summary>
    public const string SpecWinter_Sat_CloseTime = nameof(SpecOpenScheduleRuleModel.Winter_Sat_CloseTime);
    /// <summary>寒假週日開館時間。</summary>
    public const string SpecWinter_Sun_OpenTime = nameof(SpecOpenScheduleRuleModel.Winter_Sun_OpenTime);
    /// <summary>寒假週日閉館時間。</summary>
    public const string SpecWinter_Sun_CloseTime = nameof(SpecOpenScheduleRuleModel.Winter_Sun_CloseTime);
    /// <summary>暑假開始日。</summary>
    public const string SpecSummerStart = nameof(SpecOpenScheduleRuleModel.SummerStart);
    /// <summary>暑假結束日。</summary>
    public const string SpecSummerEnd = nameof(SpecOpenScheduleRuleModel.SummerEnd);
    /// <summary>暑假平日開館時間。</summary>
    public const string SpecSummer_Weekday_OpenTime = nameof(SpecOpenScheduleRuleModel.Summer_Weekday_OpenTime);
    /// <summary>暑假平日閉館時間。</summary>
    public const string SpecSummer_Weekday_CloseTime = nameof(SpecOpenScheduleRuleModel.Summer_Weekday_CloseTime);
    /// <summary>暑假週六開館時間。</summary>
    public const string SpecSummer_Sat_OpenTime = nameof(SpecOpenScheduleRuleModel.Summer_Sat_OpenTime);
    /// <summary>暑假週六閉館時間。</summary>
    public const string SpecSummer_Sat_CloseTime = nameof(SpecOpenScheduleRuleModel.Summer_Sat_CloseTime);
    /// <summary>暑假週日開館時間。</summary>
    public const string SpecSummer_Sun_OpenTime = nameof(SpecOpenScheduleRuleModel.Summer_Sun_OpenTime);
    /// <summary>暑假週日閉館時間。</summary>
    public const string SpecSummer_Sun_CloseTime = nameof(SpecOpenScheduleRuleModel.Summer_Sun_CloseTime);
    #endregion

    #region Calendar
    /// <summary>每日開館時間。</summary>
    public const string Spec_OpenTime = nameof(CalendarDetail.Spec_OpenTime);
    /// <summary>每日閉館時間。</summary>
    public const string Spec_CloseTime = nameof(CalendarDetail.Spec_CloseTime);
    #endregion
}
