using System.Globalization;
using System.Linq.Dynamic.Core;
using System.Reflection.PortableExecutable;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

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
        /// <summary>
        /// 匯入日曆
        /// </summary>
        /// <param name="year"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        public async Task ImportCalendar(int year, CancellationToken ct = default)
        {
            List<NtpcCalendar> items = await CallNtpcAPIAsync(year,ct);
            List<CalendarDetail> lst = ConvertNtpcToModel(items);
            List<CalendarSet> result = FillMissingDate(lst, NtpcCalendar.Code);
            foreach(var item in result)
            {
                await BizCreateSetAsync(item, ct);
            }
        }
        /// <summary>
        /// 初始化匯入新北市政府行政機關辦公日曆表（全部年度）
        /// 只給Program啟動時呼叫一次
        /// </summary>
        /// <param name="ct"></param>
        /// <returns></returns>
        public async Task InitCalendar(CancellationToken ct = default)
        {
            if (await BizQueryTotalCounts(string.Empty) != 0) return;// 已有資料就不再初始化
            List<NtpcCalendar> items = await CallNtpcAPIAsync(null,ct);
            List<CalendarDetail> lst = ConvertNtpcToModel(items);
            List<CalendarSet> result = FillMissingDate(lst, NtpcCalendar.Code);
            await BizInitCreateSetsAsync([.. result]);
        }
        /// <summary>
        /// 更新單日資訊
        /// </summary>
        /// <param name="dayInfo"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        public async Task BizUpdateDayInfo(CalendarDetail dayInfo, CancellationToken ct = default)
        {
            CalendarSet dbSet = default!;
            CalendarSet oldCache = default!;
            await ExecTransactionAsync(
                async token =>
                {
                    dbSet = await GetUpdateDayInfoSet(dayInfo, token);
                    oldCache = dbSet.Snapshot();
                    oldCache.Calendar.DataVersion = dbSet.Calendar.DataVersion;
                    CalendarSet newSet = new()
                    {
                        Calendar = dbSet.Calendar,
                        CalendarDetail = [dbSet.CalendarDetail.FirstOrDefault()]
                    };
                    SetModifyTime(newSet);
                    ApplyDayInfoPatch(newSet.CalendarDetail.FirstOrDefault(), dayInfo);
                    await BeforeUpdate(newSet, FuncAction.Update, token);
                    if (Message.HasError) return dbSet;
                    await DoUpdateCalendarInfo(oldCache, newSet, token);
                    await AfterUpdate(oldCache, dbSet, FuncAction.Update, TransStatus.Difference, token);
                    return dbSet;
                },
                async (result, token) =>
                {
                    await AfterSaveChanges(FuncAction.Update, token);
                    Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00006);
                },
                ct);
        }
        #endregion

        #region Protected


        protected virtual void SpecApplyDayInfoPatch(CalendarDetail target, CalendarDetail src)
        {
    
        }
        #endregion

        #region Private
        /// <summary>
        /// 
        /// </summary>
        /// <param name="year"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        private async Task<List<NtpcCalendar>> CallNtpcAPIAsync(int? year, CancellationToken ct = default)
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
        /// <summary>
        /// 獲取更新單日資訊的 CalendarSet
        /// </summary>
        /// <param name="dayInfo"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        private async Task<CalendarSet> GetUpdateDayInfoSet(CalendarDetail dayInfo, CancellationToken ct = default)
        {
            var headerData = await DoQueryListAsync<CalendarModel>(null, $"{nameof(CalendarModel.Year)} = {dayInfo.Year}", null, 0, 0);
            var header =  headerData.ToDynamicList().FirstOrDefault();
            var infoData = await DoQueryListAsync<CalendarDetail>(null, $"{nameof(CalendarDetail.Year)} = {dayInfo.Year} And {nameof(CalendarDetail.Date)} = {dayInfo.Date}", null, 0, 0);
            var info = infoData.ToDynamicList().FirstOrDefault();
            return new() { Calendar = header, CalendarDetail = [info] };
        }
        /// <summary>
        /// 設修改時間
        /// </summary>
        /// <param name="set"></param>
        private void SetModifyTime(CalendarSet set)
        {
            DateTime now = DateTime.Now;
            set.Calendar.ModifyUserId = OperateUser.UserId;
            set.Calendar.ModifyTime = now;
            set.CalendarDetail.ForEach(p => { p.ModifyUserId = OperateUser.UserId; p.ModifyTime = now; });
        }

        private async Task DoUpdateCalendarInfo(CalendarSet oldSet, CalendarSet newSet, CancellationToken ct = default)
        {
            // 取得 repo
            var headerRepo = (BasicRepository<CalendarModel>)RepoDict[nameof(CalendarModel)];
            var detailRepo = (BasicRepository<CalendarDetail>)RepoDict[nameof(CalendarDetail)];
            // 寫入 Header（含 DataVersion 的 oldHeader 做併發條件）
            await headerRepo.UpdateAsync(oldSet.Calendar, newSet.Calendar);
            // 寫入 Detail（不含 DataVersion 也 OK）
            await detailRepo.UpdateAsync(oldSet.CalendarDetail.FirstOrDefault(), newSet.CalendarDetail.FirstOrDefault());
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="target"></param>
        /// <param name="src"></param>
        private void ApplyDayInfoPatch(CalendarDetail target, CalendarDetail src)
        {
            target.IsHoliday = src.IsHoliday;
            target.HolidayName = src.HolidayName ?? string.Empty;
            target.Description = src.Description ?? string.Empty;
            target.IsEdit = true;
            SpecApplyDayInfoPatch(target, src);
        }
        #endregion
    }
}
