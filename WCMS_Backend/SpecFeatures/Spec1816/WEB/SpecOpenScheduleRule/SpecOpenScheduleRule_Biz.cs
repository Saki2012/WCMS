using System.Linq.Expressions;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Calendar;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;

/// <summary>
/// 管理學年度開館規則，並同步更新共用行事曆每日開館時間。
/// </summary>
[LibBiz(ProgKeys.Spec.Code, ProgKeys.Spec.SpecOpenScheduleRule)]
public class SpecOpenScheduleRuleBiz(BizDeps bizDeps, BizService<Calendar> calendarBiz) : BizService<SpecOpenScheduleRule>(bizDeps)
{
    #region Property
    protected override bool IsAutoGenerateId { get; set; } = false;
    #endregion

    #region Protected Virtual
    /// <summary>
    /// 儲存前驗證日期區間與各時段開閉館時間。
    /// </summary>
    protected override async Task BeforeUpdate(SpecOpenScheduleRule set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        if (!IsWriteAction(act)) return;
        ValidateScheduleRule(set);
    }
    /// <summary>
    /// 規則寫入後同步更新對應年度行事曆。
    /// </summary>
    protected override async Task AfterUpdate(SpecOpenScheduleRule? oldSet, SpecOpenScheduleRule? newSet, FuncAction act, TransStatus status, CancellationToken ct = default)
    {
        await base.AfterUpdate(oldSet, newSet, act, status, ct);
        if (newSet == null || !IsWriteAction(act)) return;
        await UpdateCalendarOpenScheduleAsync(newSet, ct);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 檢查開館與閉館時間是否成對且順序正確。
    /// </summary>
    internal static void ValidTimeFor<TModel>(
        TModel model,
        Expression<Func<TModel, object>> startExpr,
        Expression<Func<TModel, object>> endExpr,
        IErrorHelper message,
        I18nCache i18n)
    {
        TimeOnly? start = startExpr.Compile().Invoke(model) as TimeOnly?;
        TimeOnly? end = endExpr.Compile().Invoke(model) as TimeOnly?;
        if (start == null && end == null) return;
        string startName = i18n.GetLabel(startExpr);
        string endName = i18n.GetLabel(endExpr);
        if (start == null) message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, startName);
        else if (end == null) message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, endName);
        else if (start > end) message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, endName, startName);
    }
    #endregion

    #region Private
    /// <summary>
    /// 判斷是否為需要執行驗證與同步的寫入動作。
    /// </summary>
    private static bool IsWriteAction(FuncAction act)
    {
        return act is FuncAction.Create or FuncAction.Update;
    }
    /// <summary>
    /// 驗證整份學年度開館規則。
    /// </summary>
    private void ValidateScheduleRule(SpecOpenScheduleRule set)
    {
        ValidateRegularSchedule(set);
        ValidateWinterSchedule(set);
        ValidateSummerSchedule(set);
        ValidateDateRanges(set);
    }
    /// <summary>
    /// 驗證一般學期間的開閉館時間。
    /// </summary>
    private void ValidateRegularSchedule(SpecOpenScheduleRule set)
    {
        ValidTimeFor(set, item => item.Weekday_OpenTime, item => item.Weekday_CloseTime, Message, I18n);
        ValidTimeFor(set, item => item.Sat_OpenTime, item => item.Sat_CloseTime, Message, I18n);
        ValidTimeFor(set, item => item.Sun_OpenTime, item => item.Sun_CloseTime, Message, I18n);
    }
    /// <summary>
    /// 驗證寒假期間的開閉館時間。
    /// </summary>
    private void ValidateWinterSchedule(SpecOpenScheduleRule set)
    {
        ValidTimeFor(set, item => item.Winter_Weekday_OpenTime, item => item.Winter_Weekday_CloseTime, Message, I18n);
        ValidTimeFor(set, item => item.Winter_Sat_OpenTime, item => item.Winter_Sat_CloseTime, Message, I18n);
        ValidTimeFor(set, item => item.Winter_Sun_OpenTime, item => item.Winter_Sun_CloseTime, Message, I18n);
    }
    /// <summary>
    /// 驗證暑假期間的開閉館時間。
    /// </summary>
    private void ValidateSummerSchedule(SpecOpenScheduleRule set)
    {
        ValidTimeFor(set, item => item.Summer_Weekday_OpenTime, item => item.Summer_Weekday_CloseTime, Message, I18n);
        ValidTimeFor(set, item => item.Summer_Sat_OpenTime, item => item.Summer_Sat_CloseTime, Message, I18n);
        ValidTimeFor(set, item => item.Summer_Sun_OpenTime, item => item.Summer_Sun_CloseTime, Message, I18n);
    }
    /// <summary>
    /// 驗證學年度、寒假與暑假的日期區間。
    /// </summary>
    private void ValidateDateRanges(SpecOpenScheduleRule set)
    {
        ValidDateRangeFor(set, item => item.AcademicStart, item => item.AcademicEnd);
        ValidSubRangeFor(set, item => item.AcademicStart, item => item.AcademicEnd, item => item.WinterStart, item => item.WinterEnd);
        ValidSubRangeFor(set, item => item.AcademicStart, item => item.AcademicEnd, item => item.SummerStart, item => item.SummerEnd);
    }
    /// <summary>
    /// 檢查單一日期區間的起日不得晚於迄日。
    /// </summary>
    private void ValidDateRangeFor<TModel>(TModel model, Expression<Func<TModel, object>> startExpr, Expression<Func<TModel, object>> endExpr)
    {
        DateOnly? start = startExpr.Compile().Invoke(model) as DateOnly?;
        DateOnly? end = endExpr.Compile().Invoke(model) as DateOnly?;
        if (start <= end) return;
        string startName = I18n.GetLabel(startExpr);
        string endName = I18n.GetLabel(endExpr);
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, endName, startName);
    }
    /// <summary>
    /// 檢查寒暑假子區間是否完整落在學年度內。
    /// </summary>
    private void ValidSubRangeFor<TModel>(
        TModel model,
        Expression<Func<TModel, object>> outerStartExpr,
        Expression<Func<TModel, object>> outerEndExpr,
        Expression<Func<TModel, object>> innerStartExpr,
        Expression<Func<TModel, object>> innerEndExpr)
    {
        ValidDateRangeFor(model, innerStartExpr, innerEndExpr);
        DateOnly? outerStart = outerStartExpr.Compile().Invoke(model) as DateOnly?;
        DateOnly? outerEnd = outerEndExpr.Compile().Invoke(model) as DateOnly?;
        DateOnly? innerStart = innerStartExpr.Compile().Invoke(model) as DateOnly?;
        DateOnly? innerEnd = innerEndExpr.Compile().Invoke(model) as DateOnly?;
        if (outerStart > outerEnd || innerStart > innerEnd) return;
        AddSubRangeBoundaryErrors(outerStart, outerEnd, innerStart, innerEnd, outerStartExpr, outerEndExpr, innerStartExpr, innerEndExpr);
    }
    /// <summary>
    /// 加入子區間超出學年度前後邊界的錯誤訊息。
    /// </summary>
    private void AddSubRangeBoundaryErrors<TModel>(
        DateOnly? outerStart,
        DateOnly? outerEnd,
        DateOnly? innerStart,
        DateOnly? innerEnd,
        Expression<Func<TModel, object>> outerStartExpr,
        Expression<Func<TModel, object>> outerEndExpr,
        Expression<Func<TModel, object>> innerStartExpr,
        Expression<Func<TModel, object>> innerEndExpr)
    {
        if (innerStart < outerStart)
            AddRangeError(innerStartExpr, outerStartExpr);
        if (innerEnd > outerEnd)
            AddRangeError(innerEndExpr, outerEndExpr);
    }
    /// <summary>
    /// 加入日期欄位超出邊界的錯誤訊息。
    /// </summary>
    private void AddRangeError<TModel>(Expression<Func<TModel, object>> valueExpr, Expression<Func<TModel, object>> boundaryExpr)
    {
        string valueName = I18n.GetLabel(valueExpr);
        string boundaryName = I18n.GetLabel(boundaryExpr);
        Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, valueName, boundaryName);
    }
    /// <summary>
    /// 依學年度規則更新涵蓋年度的行事曆。
    /// </summary>
    private async Task UpdateCalendarOpenScheduleAsync(SpecOpenScheduleRule rule, CancellationToken ct)
    {
        List<Calendar> calendars = await GetUpdateCalendarsAsync(rule, ct);
        foreach (Calendar calendar in calendars)
        {
            ApplyScheduleRule(calendar, rule);
            await calendarBiz.BizUpdateDataAsync(calendar.InternalId, calendar, ct);
        }
    }
    /// <summary>
    /// 查詢學年度涵蓋的完整行事曆聚合模型。
    /// </summary>
    private async Task<List<Calendar>> GetUpdateCalendarsAsync(SpecOpenScheduleRule rule, CancellationToken ct)
    {
        var query = new QueryListParam
        {
            Condition = $"{nameof(Calendar.Year)} >= {rule.AcademicStart.Year} And {nameof(Calendar.Year)} <= {rule.AcademicEnd.Year}"
        };
        IList<Calendar> result = await calendarBiz.BizQueryListAsync(query, ct);
        return [.. result];
    }
    /// <summary>
    /// 將規則套用至單一年度行事曆的非人工編輯日期。
    /// </summary>
    private static void ApplyScheduleRule(Calendar calendar, SpecOpenScheduleRule rule)
    {
        calendar._CalendarDetail.Sort((left, right) => left.Date.CompareTo(right.Date));
        for (int index = 0; index < calendar._CalendarDetail.Count; index++)
        {
            CalendarDetail detail = calendar._CalendarDetail[index];
            if (detail.IsEdit) continue;
            detail.Spec_AcademicYearId = rule.AcademicYearId;
            ApplyBaseScheduleByWeekday(detail, ResolveScheduleByDate(rule, detail.Date));
            ApplyHolidayAndLongWeekendRule(calendar, index);
        }
    }
    /// <summary>
    /// 依日期取得一般學期、寒假或暑假的時間設定。
    /// </summary>
    private static OpenSchedule ResolveScheduleByDate(SpecOpenScheduleRule rule, DateOnly date)
    {
        if (date >= rule.WinterStart && date <= rule.WinterEnd)
            return new OpenSchedule(rule.Winter_Weekday_OpenTime, rule.Winter_Weekday_CloseTime, rule.Winter_Sat_OpenTime, rule.Winter_Sat_CloseTime, rule.Winter_Sun_OpenTime, rule.Winter_Sun_CloseTime);
        if (date >= rule.SummerStart && date <= rule.SummerEnd)
            return new OpenSchedule(rule.Summer_Weekday_OpenTime, rule.Summer_Weekday_CloseTime, rule.Summer_Sat_OpenTime, rule.Summer_Sat_CloseTime, rule.Summer_Sun_OpenTime, rule.Summer_Sun_CloseTime);
        return new OpenSchedule(rule.Weekday_OpenTime, rule.Weekday_CloseTime, rule.Sat_OpenTime, rule.Sat_CloseTime, rule.Sun_OpenTime, rule.Sun_CloseTime);
    }
    /// <summary>
    /// 依星期套用理論開閉館時間。
    /// </summary>
    private static void ApplyBaseScheduleByWeekday(CalendarDetail detail, OpenSchedule schedule)
    {
        (detail.Spec_OpenTime, detail.Spec_CloseTime) = detail.DayOfWeek switch
        {
            DayOfWeek.Saturday => (schedule.SaturdayOpen, schedule.SaturdayClose),
            DayOfWeek.Sunday => (schedule.SundayOpen, schedule.SundayClose),
            _ => (schedule.WeekdayOpen, schedule.WeekdayClose)
        };
    }
    /// <summary>
    /// 套用平日假日與連假週末閉館規則。
    /// </summary>
    private static void ApplyHolidayAndLongWeekendRule(Calendar calendar, int index)
    {
        CalendarDetail detail = calendar._CalendarDetail[index];
        bool isWeekdayHoliday = detail.IsHoliday && IsWeekday(detail.DayOfWeek);
        if (!isWeekdayHoliday && !IsConsecutiveHolidayWeekend(calendar, index)) return;
        detail.Spec_OpenTime = null;
        detail.Spec_CloseTime = null;
    }
    /// <summary>
    /// 判斷指定日期是否為至少三天且包含平日的連假週末。
    /// </summary>
    private static bool IsConsecutiveHolidayWeekend(Calendar calendar, int index)
    {
        CalendarDetail current = calendar._CalendarDetail[index];
        if (!IsWeekend(current.DayOfWeek) || !current.IsHoliday) return false;
        HolidayRangeState state = CountHolidayRange(calendar._CalendarDetail, index);
        return state.Length >= 3 && state.HasWeekday;
    }
    /// <summary>
    /// 向前後計算連續假日長度與是否包含平日。
    /// </summary>
    private static HolidayRangeState CountHolidayRange(IReadOnlyList<CalendarDetail> details, int index)
    {
        HolidayRangeState state = new(1, false);
        state = ScanHolidayRange(details, index - 1, -1, details[index].Date.AddDays(-1), state);
        return ScanHolidayRange(details, index + 1, 1, details[index].Date.AddDays(1), state);
    }
    /// <summary>
    /// 依指定方向累計日期連續的假日資料。
    /// </summary>
    private static HolidayRangeState ScanHolidayRange(IReadOnlyList<CalendarDetail> details, int index, int step, DateOnly expectedDate, HolidayRangeState state)
    {
        for (int currentIndex = index; currentIndex >= 0 && currentIndex < details.Count; currentIndex += step)
        {
            CalendarDetail detail = details[currentIndex];
            if (!detail.IsHoliday || detail.Date != expectedDate) break;
            state = new HolidayRangeState(state.Length + 1, state.HasWeekday || IsWeekday(detail.DayOfWeek));
            expectedDate = expectedDate.AddDays(step);
        }
        return state;
    }
    /// <summary>
    /// 判斷星期是否為平日。
    /// </summary>
    private static bool IsWeekday(DayOfWeek dayOfWeek)
    {
        return dayOfWeek is >= DayOfWeek.Monday and <= DayOfWeek.Friday;
    }
    /// <summary>
    /// 判斷星期是否為週末。
    /// </summary>
    private static bool IsWeekend(DayOfWeek dayOfWeek)
    {
        return dayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
    }
    /// <summary>
    /// 一組平日、週六與週日的開閉館時間。
    /// </summary>
    private readonly record struct OpenSchedule(
        TimeOnly? WeekdayOpen,
        TimeOnly? WeekdayClose,
        TimeOnly? SaturdayOpen,
        TimeOnly? SaturdayClose,
        TimeOnly? SundayOpen,
        TimeOnly? SundayClose);
    /// <summary>
    /// 連續假日掃描結果。
    /// </summary>
    private readonly record struct HolidayRangeState(int Length, bool HasWeekday);
    #endregion
}
