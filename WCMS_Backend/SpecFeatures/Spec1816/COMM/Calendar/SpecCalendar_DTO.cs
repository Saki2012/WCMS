namespace WCMS.Features.COMM.Calendar;

/// <summary>
/// 首頁當日開館時間資訊。
/// </summary>
public sealed class SpecCurrentOpenTime_DTO
{
    #region Property
    /// <summary>
    /// 日期。
    /// </summary>
    public DateOnly Date { get; set; }
    /// <summary>
    /// 星期。
    /// </summary>
    public DayOfWeek DayOfWeek { get; set; }
    /// <summary>
    /// 假日名稱。
    /// </summary>
    public string HolidayName { get; set; } = string.Empty;
    /// <summary>
    /// 開館時間；空值代表閉館。
    /// </summary>
    public TimeOnly? Spec_OpenTime { get; set; }
    /// <summary>
    /// 閉館時間；空值代表閉館。
    /// </summary>
    public TimeOnly? Spec_CloseTime { get; set; }
    #endregion
}
