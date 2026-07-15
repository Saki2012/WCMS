using System.Text.Json.Serialization;
namespace WCMS.Features.COMM.Calendar;

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
