using System.Collections;
using System.Globalization;
using System.Linq.Dynamic.Core;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.COMM.Calendar;

[LibBiz(ProgKeys.COMM.Code, ProgKeys.COMM.Calendar)]
public class CalendarBiz(BizDeps bizDeps, IHttpClientFactory httpClientFactory) : BizService<CalendarModel>(bizDeps), IBizService<CalendarModel>
{
    #region Property
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    protected override bool IsAutoGenerateId { get; set; } = false;
    #endregion

    #region Public
    /// <summary>
    /// 匯入指定年度行事曆。
    /// </summary>
    public async Task ImportCalendar(int year, CancellationToken ct = default)
    {
        List<NtpcCalendar> items = await CallNtpcAPIAsync(year, ct);
        List<CalendarDetail> details = ConvertNtpcToModel(items);
        List<CalendarModel> result = FillMissingDate(details, NtpcCalendar.Code);
        foreach (CalendarModel item in result) await BizCreateDataAsync(item, ct);
    }
    /// <summary>
    /// 初始化匯入全部年度行事曆。
    /// </summary>
    public async Task InitCalendar(CancellationToken ct = default)
    {
        if (await BizQueryTotalCounts(string.Empty) != 0) return;
        List<NtpcCalendar> items = await CallNtpcAPIAsync(null, ct);
        List<CalendarDetail> details = ConvertNtpcToModel(items);
        List<CalendarModel> result = FillMissingDate(details, NtpcCalendar.Code);
        await BizInitCreateDatasAsync([.. result]);
    }
    /// <summary>
    /// 更新單日行事曆資訊。
    /// </summary>
    public async Task<CalendarDetail> BizUpdateDayInfo(CalendarDetail dayInfo, CancellationToken ct = default)
    {
        CalendarModel result = await ExecTransactionAsync(
            async token =>
            {
                CalendarModel oldData = await GetUpdateDayInfoData(dayInfo, token);
                CalendarModel oldCache = oldData.Snapshot();
                CalendarModel newData = oldData.Snapshot();
                SetUpdateAuditInfo(newData);
                ApplyDayInfoPatch(GetSingleDetail(newData), dayInfo);
                await BeforeUpdate(newData, FuncAction.Update, token);
                if (Message.HasError) return oldData;
                await DoUpdateCalendarInfo(oldData, newData);
                await AfterUpdate(oldCache, newData, FuncAction.Update, TransStatus.Difference, token);
                return newData;
            },
            async (_, token) =>
            {
                await AfterSaveChanges(FuncAction.Update, token);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00006);
            },
            ct);
        return GetSingleDetail(result);
    }
    #endregion

    #region Protected Virtual
    /// <summary>
    /// 套用客製單日欄位更新。
    /// </summary>
    protected virtual void SpecApplyDayInfoPatch(CalendarDetail target, CalendarDetail src) { }
    #endregion

    #region Private
    /// <summary>
    /// 呼叫新北市政府行事曆 API。
    /// </summary>
    private async Task<List<NtpcCalendar>> CallNtpcAPIAsync(int? year, CancellationToken ct = default)
    {
        using HttpClient http = _httpClientFactory.CreateClient();
        string url = year == null
            ? NtpcCalendar.NtpcCalendarUrl_All
            : string.Format(NtpcCalendar.NtpcCalendarUrl_ByYear, year);
        return await http.GetFromJsonAsync<List<NtpcCalendar>>(url, cancellationToken: ct) ?? [];
    }
    /// <summary>
    /// 將外部行事曆清單轉成每日資料。
    /// </summary>
    private List<CalendarDetail> ConvertNtpcToModel(List<NtpcCalendar> items)
    {
        List<CalendarDetail> result = [];
        foreach (NtpcCalendar item in items) result.Add(ConvertNtpcToModel(item));
        return result;
    }
    /// <summary>
    /// 將單筆外部行事曆轉成每日資料。
    /// </summary>
    private CalendarDetail ConvertNtpcToModel(NtpcCalendar item)
    {
        ArgumentNullException.ThrowIfNull(item);
        DateOnly date = ParseCalendarDate(item.Date);
        bool isHoliday = ResolveHolidayStatus(item.IsHoliday);
        return new CalendarDetail
        {
            Year = date.Year,
            Date = date,
            DayOfWeek = date.DayOfWeek,
            IsHoliday = isHoliday,
            HolidayName = item.Name ?? string.Empty,
            Description = item.Description ?? string.Empty,
            IsEdit = false
        };
    }
    /// <summary>
    /// 解析外部行事曆日期。
    /// </summary>
    private static DateOnly ParseCalendarDate(string? value)
    {
        string raw = (value ?? string.Empty).Trim();
        string[] formats = ["yyyyMMdd", "yyyy-MM-dd", "yyyy/MM/dd"];
        bool success = DateOnly.TryParseExact(raw, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateOnly date);
        if (!success) throw new ArgumentException($"Invalid date: {value}", nameof(value));
        return date;
    }
    /// <summary>
    /// 解析外部假日狀態。
    /// </summary>
    private static bool ResolveHolidayStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        return value.Contains("是", StringComparison.Ordinal)
            || value.Equals("Y", StringComparison.OrdinalIgnoreCase)
            || value.Equals("true", StringComparison.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 依年度補齊每日資料並建立表單模型。
    /// </summary>
    private static List<CalendarModel> FillMissingDate(List<CalendarDetail> data, string importSrc)
    {
        if (data.Count == 0) return [];
        List<CalendarDetail> normalized = NormalizeCalendarDetails(data);
        Dictionary<DateOnly, CalendarDetail> byDate = normalized.GroupBy(p => p.Date).ToDictionary(p => p.Key, p => p.Last());
        int minYear = normalized.Min(p => p.Year);
        int maxYear = normalized.Max(p => p.Year);
        List<CalendarModel> result = [];
        for (int year = minYear; year <= maxYear; year++) result.Add(BuildCalendarModel(year, importSrc, byDate));
        return result;
    }
    /// <summary>
    /// 正規化每日資料的日期與年度。
    /// </summary>
    private static List<CalendarDetail> NormalizeCalendarDetails(IEnumerable<CalendarDetail> data)
    {
        List<CalendarDetail> result = [];
        foreach (CalendarDetail item in data)
        {
            item.Year = item.Date.Year;
            item.DayOfWeek = item.Date.DayOfWeek;
            result.Add(item);
        }
        return result;
    }
    /// <summary>
    /// 建立單一年度表單模型。
    /// </summary>
    private static CalendarModel BuildCalendarModel(int year, string importSrc, IReadOnlyDictionary<DateOnly, CalendarDetail> byDate)
    {
        var model = new CalendarModel
        {
            Year = year,
            ImportSrc = importSrc,
            LastImportTime = DateTime.Now,
            _CalendarDetail = BuildYearDetails(year, byDate)
        };
        return model;
    }
    /// <summary>
    /// 建立完整年度的每日資料。
    /// </summary>
    private static List<CalendarDetail> BuildYearDetails(int year, IReadOnlyDictionary<DateOnly, CalendarDetail> byDate)
    {
        List<CalendarDetail> result = [];
        DateOnly date = new(year, 1, 1);
        DateOnly end = new(year, 12, 31);
        while (date <= end)
        {
            result.Add(byDate.TryGetValue(date, out CalendarDetail? detail) ? detail : CreateDefaultDetail(year, date));
            date = date.AddDays(1);
        }
        return result;
    }
    /// <summary>
    /// 建立一般工作日資料。
    /// </summary>
    private static CalendarDetail CreateDefaultDetail(int year, DateOnly date)
    {
        return new CalendarDetail
        {
            Year = year,
            Date = date,
            DayOfWeek = date.DayOfWeek,
            HolidayName = string.Empty,
            Description = string.Empty
        };
    }
    /// <summary>
    /// 取得單日更新所需的表單模型。
    /// </summary>
    private async Task<CalendarModel> GetUpdateDayInfoData(CalendarDetail dayInfo, CancellationToken ct = default)
    {
        string headerCondition = $"{nameof(CalendarModel.Year)} = {dayInfo.Year}";
        string detailCondition = $"{nameof(CalendarDetail.Year)} = {dayInfo.Year} And {nameof(CalendarDetail.Date)} = '{dayInfo.Date:yyyy-MM-dd}'";
        IList headerData = await DoQueryListAsync<CalendarModel>([], headerCondition, null, 0, 0);
        IList detailData = await DoQueryListAsync<CalendarDetail>([], detailCondition, null, 0, 0);
        CalendarModel header = headerData.Cast<CalendarModel>().FirstOrDefault() ?? throw new InvalidOperationException("Calendar header not found.");
        CalendarDetail detail = detailData.Cast<CalendarDetail>().FirstOrDefault() ?? throw new InvalidOperationException("Calendar detail not found.");
        header._CalendarDetail = [detail];
        return header;
    }
    /// <summary>
    /// 設定表單與每日資料的修改資訊。
    /// </summary>
    private void SetUpdateAuditInfo(CalendarModel data)
    {
        DateTime now = DateTime.Now;
        SetModifyInfo(data);
        foreach (CalendarDetail detail in data._CalendarDetail)
        {
            detail.ModifyUserId = OperateUser.UserId;
            detail.ModifyTime = now;
        }
    }
    /// <summary>
    /// 更新年度表頭與指定日期資料。
    /// </summary>
    private async Task DoUpdateCalendarInfo(CalendarModel oldData, CalendarModel newData)
    {
        CalendarDetail oldDetail = GetSingleDetail(oldData);
        CalendarDetail newDetail = GetSingleDetail(newData);
        await GraphRepo.GetRepo<CalendarModel>().UpdateAsync(oldData, newData);
        await GraphRepo.GetRepo<CalendarDetail>().UpdateAsync(oldDetail, newDetail);
    }
    /// <summary>
    /// 套用單日可修改欄位。
    /// </summary>
    private void ApplyDayInfoPatch(CalendarDetail target, CalendarDetail src)
    {
        target.IsHoliday = src.IsHoliday;
        target.HolidayName = src.HolidayName ?? string.Empty;
        target.Description = src.Description ?? string.Empty;
        target.IsEdit = true;
        SpecApplyDayInfoPatch(target, src);
    }
    /// <summary>
    /// 取得單日表單中的唯一明細。
    /// </summary>
    private static CalendarDetail GetSingleDetail(CalendarModel data)
    {
        return data._CalendarDetail.SingleOrDefault()
            ?? throw new InvalidOperationException("Calendar detail is required.");
    }
    #endregion
}
