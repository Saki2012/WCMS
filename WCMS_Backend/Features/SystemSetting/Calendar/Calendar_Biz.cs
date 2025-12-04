using System.Globalization;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.Interface;

namespace WCMS.Features.SystemSetting.Calendar
{
    [ProgId("Calendar")]
    public class CalendarBiz(BizDeps bizDeps, IHttpClientFactory httpClientFactory) : BizService<CalendarSet>(bizDeps), IBizService<CalendarSet>
    {
        #region Property
        private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
        protected override bool IsAutoGenerateId { get; set; } = false;
        #endregion

        #region Public
        public async Task ImportCalendar(int year, CancellationToken ct)
        {
            List<NtpcCalendar> items = await CallNtpcAPIAsync(year,ct);
            List<CalendarDetail> lst = ConvertNtpcToModel(items);
            List<CalendarSet> result = FillMissingDate(lst, NtpcCalendar.Code);
            foreach(var item in result)
            {
                await BizCreateSetAsync(item);
            }
        }

        /// <summary>
        /// 初始化匯入新北市政府行政機關辦公日曆表（全部年度）
        /// 只給Program啟動時呼叫一次
        /// </summary>
        /// <param name="ct"></param>
        /// <returns></returns>
        public async Task InitCalendar(CancellationToken ct)
        {
            if (await BizQueryTotalCounts([nameof(CalendarModel.Year)], string.Empty) != 0) return;// 已有資料就不再初始化
            List<NtpcCalendar> items = await CallNtpcAPIAsync(null,ct);
            List<CalendarDetail> lst = ConvertNtpcToModel(items);
            List<CalendarSet> result = FillMissingDate(lst, NtpcCalendar.Code);
            await BizInitCreateSetsAsync([.. result]);
        }
        #endregion

        #region Protected
        #endregion

        #region Private
        /// <summary>
        /// 
        /// </summary>
        /// <param name="year"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        private async Task<List<NtpcCalendar>> CallNtpcAPIAsync(int? year, CancellationToken ct)
        {
            using var http = _httpClientFactory.CreateClient();
            string url = year == null ? NtpcCalendar.NtpcCalendarUrl_All : string.Format(NtpcCalendar.NtpcCalendarUrl_ByYear, year);
            return await http.GetFromJsonAsync<List<NtpcCalendar>>(url, cancellationToken: ct) ?? [];
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="ntpc"></param>
        /// <returns></returns>
        private List<CalendarDetail> ConvertNtpcToModel(List<NtpcCalendar> ntpc)
        {
            List<CalendarDetail> models = [];
            foreach(var item in ntpc) models.Add(ConvertNtpcToModel(item));
            return models;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="ntpc"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        private CalendarDetail ConvertNtpcToModel(NtpcCalendar ntpc)
        {
            ArgumentNullException.ThrowIfNull(ntpc);
            var raw = (ntpc.Date ?? string.Empty).Trim();
            string[] formats = ["yyyyMMdd", "yyyy-MM-dd", "yyyy/MM/dd"];
            if (!DateOnly.TryParseExact(raw,formats,CultureInfo.InvariantCulture,DateTimeStyles.None,out var date)) throw new ArgumentException($"Invalid date: {ntpc.Date}", nameof(ntpc));
            var isHoliday = !string.IsNullOrEmpty(ntpc.IsHoliday) && (ntpc.IsHoliday.Contains("是") || ntpc.IsHoliday.Equals("Y", StringComparison.OrdinalIgnoreCase) || ntpc.IsHoliday.Equals("true", StringComparison.OrdinalIgnoreCase));
            return new CalendarDetail{ Year = date.Year, Date = date, DayOfWeek = date.DayOfWeek, IsHoliday = isHoliday, HolidayName = ntpc.Name ?? "", Description = ntpc.Description ?? "", IsEdit = false,};
        }
        /// <summary>
        /// 將政府資料轉成完整年度的萬年曆，並依年份切成 CalendarSet（Header + Details）
        /// </summary>
        private List<CalendarSet> FillMissingDate(List<CalendarDetail> data,string importSrc)
        {
            if (data == null || data.Count == 0) return [];
            var normalized = data.Where(x => x != null).Select(x =>{var date = x.Date;x.Date = date;x.DayOfWeek = date.DayOfWeek;x.Year = date.Year;return x;}).ToList();
            var byDate = normalized.GroupBy(x => x.Date).ToDictionary(g => g.Key, g => g.Last());
            var minYear = normalized.Min(x => x.Year);
            var maxYear = normalized.Max(x => x.Year);
            var now = DateTime.Now;
            var result = new List<CalendarSet>();
            for (var year = minYear; year <= maxYear; year++)
            {
                var details = new List<CalendarDetail>();
                var d = new DateOnly(year, 1, 1);
                var end = new DateOnly(year, 12, 31);
                while (d <= end)
                {
                    if (byDate.TryGetValue(d, out var special)) details.Add(special);
                    else details.Add(new CalendarDetail{Year = year,Date = d,DayOfWeek = d.DayOfWeek,IsHoliday = false,HolidayName = string.Empty,Description = string.Empty,IsEdit = false});
                    d = d.AddDays(1);
                }
                result.Add(new CalendarSet{Calendar = new CalendarModel{Year = year,ImportSrc = importSrc,  LastImportTime = now},CalendarDetail = details});
            }
            return result;
        }
        #endregion
    }
}
