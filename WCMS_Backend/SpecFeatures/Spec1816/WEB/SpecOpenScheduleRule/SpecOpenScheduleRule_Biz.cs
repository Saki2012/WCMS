using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using WCMS.Features._Resx;
using WCMS.Features.SystemSetting.Calendar;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;

[LibBiz(ProgKeys.Spec.Code, ProgKeys.Spec.SpecOpenScheduleRule)]
public class SpecOpenScheduleRuleBiz(BizDeps bizDeps, IBizService<CalendarSet> calenderBiz) : BizService<SpecOpenScheduleRuleSet>(bizDeps), IBizService<SpecOpenScheduleRuleSet>
{
    #region Property                                                               
    protected override bool IsAutoGenerateId { get; set; } = false;
    #endregion

    #region Protected Virtual
    protected override async Task BeforeUpdate(SpecOpenScheduleRuleSet set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                CheckData(set);
                break;
        }
    }
    protected override async Task AfterUpdate(SpecOpenScheduleRuleSet? oldSet, SpecOpenScheduleRuleSet? newSet, FuncAction act, TransStatus status, CancellationToken ct = default)
    {
        await base.AfterUpdate(oldSet, newSet, act, status, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                await UpdateCalandarSetOpenScheduleRule(newSet.SpecOpenScheduleRule);
                break;
        }
    }
    #endregion

    #region Protected
    protected void CheckData(SpecOpenScheduleRuleSet set)
    {
        ValidTimeFor(set.SpecOpenScheduleRule, x => x.Weekday_OpenTime, x => x.Weekday_CloseTime,Message);
        ValidTimeFor(set.SpecOpenScheduleRule, x => x.Sat_OpenTime, x => x.Sat_CloseTime, Message);
        ValidTimeFor(set.SpecOpenScheduleRule, x => x.Sun_OpenTime, x => x.Sun_CloseTime, Message);
        ValidTimeFor(set.SpecOpenScheduleRule, x => x.Winter_Weekday_OpenTime, x => x.Winter_Weekday_CloseTime, Message);
        ValidTimeFor(set.SpecOpenScheduleRule, x => x.Winter_Sat_OpenTime, x => x.Winter_Sat_CloseTime, Message);
        ValidTimeFor(set.SpecOpenScheduleRule, x => x.Winter_Sun_OpenTime, x => x.Winter_Sun_CloseTime, Message);
        ValidTimeFor(set.SpecOpenScheduleRule, x => x.Summer_Weekday_OpenTime, x => x.Summer_Weekday_CloseTime, Message);
        ValidTimeFor(set.SpecOpenScheduleRule, x => x.Summer_Sat_OpenTime, x => x.Summer_Sat_CloseTime, Message);
        ValidTimeFor(set.SpecOpenScheduleRule, x => x.Summer_Sun_OpenTime, x => x.Summer_Sun_CloseTime, Message);
        ValidDateRangeFor(set.SpecOpenScheduleRule, x => x.AcademicStart, x => x.AcademicEnd);
        ValidSubRangeFor(set.SpecOpenScheduleRule, x => x.AcademicStart, x => x.AcademicEnd, x => x.WinterStart, x => x.WinterEnd);
        ValidSubRangeFor(set.SpecOpenScheduleRule, x => x.AcademicStart, x => x.AcademicEnd, x => x.SummerStart, x => x.SummerEnd);
    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查開館/閉館有效時間
    /// </summary>
    /// <param name="start"></param>
    /// <param name="end"></param>
    /// <returns></returns>
    public static void ValidTimeFor<TModel>(TModel model, Expression<Func<TModel, object>> startExpr, Expression<Func<TModel, object>> endExpr, IErrorHelper message)
    {
        var start = startExpr.Compile().Invoke(model) as TimeOnly?;
        var end = endExpr.Compile().Invoke(model) as TimeOnly?;
        var startColName = I18nCache.GetLabel(startExpr);
        var endColName = I18nCache.GetLabel(endExpr);
        if (start == null && end == null) return;
        if (start == null && end != null)
        {
            message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, startColName);
            return;
        }
        if (start != null && end == null)
        {
            message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, endColName);
            return;
        }
        if (start > end)
        {
            message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, endColName, startColName);
            return;
        }
    }
    /// <summary>
    /// 檢查日期區間，是否超出學年度日期或是卡在寒暑假區間內
    /// </summary>
    /// <param name="rangeStart"></param>
    /// <param name="rangeEnd"></param>
    /// <returns></returns>
    /// <summary>
    /// 檢查某一組 DateOnly 起訖欄位是否有效（起日不得大於迄日）
    /// 會自動帶入欄位名稱做錯誤訊息
    /// </summary>
    private void ValidDateRangeFor<TModel>(TModel model, Expression<Func<TModel, object>> startExpr, Expression<Func<TModel, object>> endExpr)
    {
        var start = startExpr.Compile().Invoke(model) as DateOnly?;
        var end = endExpr.Compile().Invoke(model) as DateOnly?;
        var startColName = I18nCache.GetLabel(startExpr);
        var endColName = I18nCache.GetLabel(endExpr);
        if (start > end) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, endColName, startColName);
    }
    /// <summary>
    /// 檢查子區間（例如寒假/暑假）是否完全落在學年度區間內
    /// 會同時檢查：
    /// 1. 學年度起訖是否合法
    /// 2. 子區間起訖是否合法
    /// 3. 子區間是否完全被學年度包住
    /// </summary>
    private void ValidSubRangeFor<TModel>(TModel model,
        Expression<Func<TModel, object>> outerStartExpr, Expression<Func<TModel, object>> outerEndExpr,
        Expression<Func<TModel, object>> innerStartExpr, Expression<Func<TModel, object>> innerEndExpr)
    {
        // 先用共用的區間檢查，把「起 > 迄」的狀況先擋掉
        ValidDateRangeFor(model, outerStartExpr, outerEndExpr);
        ValidDateRangeFor(model, innerStartExpr, innerEndExpr);

        // 取值
        var outerStart = outerStartExpr.Compile().Invoke(model) as DateOnly?;
        var outerEnd = outerEndExpr.Compile().Invoke(model) as DateOnly?;
        var innerStart = innerStartExpr.Compile().Invoke(model) as DateOnly?;
        var innerEnd = innerEndExpr.Compile().Invoke(model) as DateOnly?;

        // 取欄位顯示名稱
        var outerStartCol = I18nCache.GetLabel(outerStartExpr);
        var outerEndCol = I18nCache.GetLabel(outerEndExpr);
        var innerStartCol = I18nCache.GetLabel(innerStartExpr);
        var innerEndCol = I18nCache.GetLabel(innerEndExpr);

        // 學年度本身已經是錯的（起 > 迄），就不要再做包含檢查了
        if (outerStart > outerEnd) return;
        if (innerStart > innerEnd) return;

        // 子區間起點 < 學年度起 → 錯誤（超出前面）
        if (innerStart < outerStart) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, innerStartCol, outerStartCol);

        // 子區間終點 > 學年度終點 → 錯誤（超出後面）
        if (innerEnd > outerEnd) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, innerEndCol, outerEndCol);
    }
    /// <summary>
    /// 更新圖書館開/閉館時間
    /// </summary>
    /// <param name="header"></param>
    private async Task UpdateCalandarSetOpenScheduleRule(SpecOpenScheduleRuleModel header)
    {
        List<CalendarSet> sets = await GetUpdateCalendarSet(header.AcademicStart.Year, header.AcademicEnd.Year);
        foreach (var set in sets)
        {
            for (int idx = 0; idx < set.CalendarDetail.Count; idx++)
            {
                var dt = set.CalendarDetail[idx];
                if (dt.IsEdit) continue;
                dt.Spec_AcademicYearId = header.AcademicYearId;
                var schedule = ResolveScheduleByDate(header, dt.Date);
                ApplyBaseScheduleByWeekday(dt, schedule);
                ApplyHolidayAndLongWeekendRule(set, idx);
            }
            await calenderBiz.BizUpdateSetAsync(set.Calendar.InternalId, set);
        }
    }
    /// <summary>
    /// 獲取要更新的行事曆
    /// </summary>
    /// <param name="startYear"></param>
    /// <param name="endYear"></param>
    /// <returns></returns>
    private async Task<List<CalendarSet>> GetUpdateCalendarSet(int startYear, int endYear)
    {
        var calHeader = await (await DoQueryListAsync<CalendarModel>([], $@"{nameof(CalendarModel.Year)} >= {startYear} And {nameof(CalendarModel.Year)} <= {endYear}", null, 0, 0)).ToDynamicListAsync<CalendarModel>();
        var calDetail = await (await DoQueryListAsync<CalendarDetail>([], $@"{nameof(CalendarModel.Year)} >= {startYear} And {nameof(CalendarModel.Year)} <= {endYear}", null, 0, 0)).ToDynamicListAsync<CalendarDetail>();
        var record = RecordComparison.CompareByKey(calHeader, calDetail, left => left.Year, right => right.Year);
        List<CalendarSet> result = [];
        foreach (var item in record)
        {
            switch (item.Type)
            {
                case RecordCompareType.BothExist:
                    var header = item.LeftItems.FirstOrDefault();
                    var detail = item.RightItems;
                    CalendarSet set = new() { Calendar = header, CalendarDetail = [.. detail], };
                    result.Add(set);
                    break;
            }
        }
        return result;
    }
    /// <summary>
    /// 依日期判斷：一般學期間 / 寒假 / 暑假，回傳一組時間設定
    /// </summary>
    private static (TimeOnly? dayOpen, TimeOnly? dayClose, TimeOnly? satOpen, TimeOnly? satClose,TimeOnly? sunOpen, TimeOnly? sunClose) 
        ResolveScheduleByDate(SpecOpenScheduleRuleModel header, DateOnly date)
    {
        TimeOnly? dayOpen;
        TimeOnly? dayClose;
        TimeOnly? satOpen;
        TimeOnly? satClose;
        TimeOnly? sunOpen;
        TimeOnly? sunClose;
        if (date >= header.WinterStart && date <= header.WinterEnd)
        {
            // 寒假
            dayOpen = header.Winter_Weekday_OpenTime;
            dayClose = header.Winter_Weekday_CloseTime;
            satOpen = header.Winter_Sat_OpenTime;
            satClose = header.Winter_Sat_CloseTime;
            sunOpen = header.Winter_Sun_OpenTime;
            sunClose = header.Winter_Sun_CloseTime;
        }
        else if (date >= header.SummerStart && date <= header.SummerEnd)
        {
            // 暑假
            dayOpen = header.Summer_Weekday_OpenTime;
            dayClose = header.Summer_Weekday_CloseTime;
            satOpen = header.Summer_Sat_OpenTime;
            satClose = header.Summer_Sat_CloseTime;
            sunOpen = header.Summer_Sun_OpenTime;
            sunClose = header.Summer_Sun_CloseTime;
        }
        else
        {
            // 一般學期間
            dayOpen = header.Weekday_OpenTime;
            dayClose = header.Weekday_CloseTime;
            satOpen = header.Sat_OpenTime;
            satClose = header.Sat_CloseTime;
            sunOpen = header.Sun_OpenTime;
            sunClose = header.Sun_CloseTime;
        }
        return (dayOpen, dayClose, satOpen, satClose, sunOpen, sunClose);
    }
    /// <summary>
    /// 依星期幾套用剛剛算出的「理論」開館時間
    /// </summary>
    private static void ApplyBaseScheduleByWeekday(CalendarDetail dt,(TimeOnly? dayOpen, TimeOnly? dayClose,TimeOnly? satOpen, TimeOnly? satClose,TimeOnly? sunOpen, TimeOnly? sunClose) schedule)
    {
        switch (dt.DayOfWeek)
        {
            case DayOfWeek.Saturday:
                dt.Spec_OpenTime = schedule.satOpen;
                dt.Spec_CloseTime = schedule.satClose;
                break;

            case DayOfWeek.Sunday:
                dt.Spec_OpenTime = schedule.sunOpen;
                dt.Spec_CloseTime = schedule.sunClose;
                break;

            default: // 週一～週五
                dt.Spec_OpenTime = schedule.dayOpen;
                dt.Spec_CloseTime = schedule.dayClose;
                break;
        }
    }
    /// <summary>
    /// 套用「平日國定/校訂假日一律不開館」以及「連假週末不開館」的規則
    /// </summary>
    private void ApplyHolidayAndLongWeekendRule(CalendarSet set, int index)
    {
        var dt = set.CalendarDetail[index];
        bool isWeekday = dt.DayOfWeek >= DayOfWeek.Monday && dt.DayOfWeek <= DayOfWeek.Friday;
        // 1) 國定 / 校訂假日（平日）一律不開館
        if (dt.IsHoliday && isWeekday)
        {
            dt.Spec_OpenTime = null;
            dt.Spec_CloseTime = null;
            return;
        }
        // 2) 週末遇連續假期（連假區間≥3天，且含平日） → 不開館
        if (IsConsecutiveHolidayWeekend(set, index))
        {
            dt.Spec_OpenTime = null;
            dt.Spec_CloseTime = null;
        }
    }
    /// <summary>
    /// 判斷「該筆日期是否為連假週末」
    /// 條件：
    /// 1. 當天是週六或週日
    /// 2. 當天為 IsHoliday
    /// 3. 往前往後連續的 IsHoliday >= 3 天，且中間至少有一個平日（Mon~Fri）
    /// </summary>
    private static bool IsConsecutiveHolidayWeekend(CalendarSet set, int index)
    {
        var cur = set.CalendarDetail[index];
        // 只處理週六 / 週日
        if (cur.DayOfWeek != DayOfWeek.Saturday && cur.DayOfWeek != DayOfWeek.Sunday) return false;
        // 本身要是 isHoliday
        if (!cur.IsHoliday) return false;
        int length = 1;              // 這段連假長度
        bool hasWeekday = false;     // 這段連假裡是否有平日（Mon~Fri）
        // 往前找連續的 isHoliday（日期要連著）
        DateOnly prevDate = cur.Date.AddDays(-1);
        for (int i = index - 1; i >= 0; i--)
        {
            var d = set.CalendarDetail[i];
            if (!d.IsHoliday || d.Date != prevDate) break;
            length++;
            if (d.DayOfWeek >= DayOfWeek.Monday && d.DayOfWeek <= DayOfWeek.Friday) hasWeekday = true;
            prevDate = prevDate.AddDays(-1);
        }
        // 往後找連續的 isHoliday（日期要連著）
        DateOnly nextDate = cur.Date.AddDays(1);
        for (int i = index + 1; i < set.CalendarDetail.Count; i++)
        {
            var d = set.CalendarDetail[i];
            if (!d.IsHoliday || d.Date != nextDate) break;
            length++;
            if (d.DayOfWeek >= DayOfWeek.Monday && d.DayOfWeek <= DayOfWeek.Friday) hasWeekday = true;
            nextDate = nextDate.AddDays(1);
        }
        // 至少 3 天連假，且有平日存在 → 視為連假週末
        return length >= 3 && hasWeekday;
    }
    #endregion
}
