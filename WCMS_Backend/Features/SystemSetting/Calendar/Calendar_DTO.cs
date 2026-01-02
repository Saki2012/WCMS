using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.Features.Member.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;

namespace WCMS.Features.SystemSetting.Calendar
{

    public partial class CalendarSet_DTO : ITSet_DTO
    {
        public Calendar_DTO Calendar { get; set; } = new();
        public List<CalendarDetail_DTO> CalendarDetail { get; set; } = [];
    }

    public partial class Calendar_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 
        /// </summary>
        public int? Year { get; set; }
        /// <summary>
        /// 匯入來源
        /// </summary>
        public string? ImportSrc { get; set; }
        /// <summary>
        /// // 最後匯入時間
        /// </summary>
        public DateTime? LastImportTime { get; set; }
        #region 主子表關聯
        [InverseProperty(nameof(CalendarDetail_DTO._Calendar))] public List<CalendarDetail_DTO>? _CalendarDetail{ get; set; }
        #endregion
    }

    public partial class CalendarDetail_DTO
    {
        public int? Year { get; set; }
        public DateOnly? Date { get; set; }
        public DayOfWeek? DayOfWeek { get; set; }
        public bool? IsHoliday { get; set; }
        public string? HolidayName { get; set; }
        public string? Description { get; set; }
        public bool? IsEdit { get; set; }
        /// <summary>
        /// 修改時間
        /// </summary>
        public DateTime? ModifyTime { get; set; }
        /// <summary>
        /// 修改人ID
        /// </summary>
        [ForeignKey(nameof(ModifyUserId))] public AccountModel? ModifyUser { get; set; }
        [LibDesc, StringLength(SysLengthParam.ID)] public string? ModifyUserId { get; set; }
        #region 主子表關聯
        [ForeignKey(nameof(Year))] public Calendar_DTO? _Calendar { get; set; }
        #endregion
    }

    /// <summary>
    /// 對應新北市政府行政機關辦公日曆表 JSON 欄位
    /// </summary>
    public sealed class NtpcCalendar
    {
        public const string Code = "NTPC";
        /// <summary>
        /// 官方資料集 URL（新北市 政府行政機關辦公日曆表）- 依年份查詢
        /// </summary>
        public const string NtpcCalendarUrl_ByYear = @"https://data.ntpc.gov.tw/api/datasets/308dcd75-6434-45bc-a95f-584da4fed251/json?$filter=year%20eq%{0}";
        /// <summary>
        /// 官方資料集 URL（新北市 政府行政機關辦公日曆表）- 全部資料
        /// </summary>
        public const string NtpcCalendarUrl_All = @"https://data.ntpc.gov.tw/api/datasets/308dcd75-6434-45bc-a95f-584da4fed251/json?size=5000";
        /// <summary>日期（字串），例如：2024-01-01</summary>
        [JsonPropertyName("date")]
        public string Date { get; set; } = default!;
        /// <summary>西元年</summary>
        [JsonPropertyName("year")]
        public int Year { get; set; }
        /// <summary>節日名稱</summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = default!;
        /// <summary>是否放假（官方多半用 「是 / 否」 字串）</summary>
        [JsonPropertyName("isholiday")]
        public string? IsHoliday { get; set; }
        /// <summary>周末假期等分類</summary>
        [JsonPropertyName("holidaycategory")]
        public string? HolidayCategory { get; set; }
        /// <summary>備註</summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }
}
