using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
namespace WCMS.Features.COMM.Calendar;

public partial class CalendarController
{
    #region Public
    /// <summary>
    /// 取得今日圖書館開館資訊。
    /// </summary>
    [HttpGet(nameof(Spec_GetCurrentOpenTime)), AllowAnonymous, IgnoreAntiforgeryToken]
    public async Task<IActionResult> Spec_GetCurrentOpenTime(CancellationToken ct)
    {
        DateOnly today = DateOnly.FromDateTime(DateTime.Now);
        QueryListParam query = CreateCurrentOpenTimeQuery(today);
        CalendarDetail? detail = await QueryCurrentCalendarDetail(query, today, ct);
        List<SpecCurrentOpenTime_DTO> result = detail == null ? [] : [CreateCurrentOpenTimeDto(detail)];
        var response = new ApiResponse<SpecCurrentOpenTime_DTO> { Data = result, SysMessage = Message.Messages };
        return Ok(response);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立今日開館資訊查詢條件。
    /// </summary>
    private static QueryListParam CreateCurrentOpenTimeQuery(DateOnly today)
    {
        return new QueryListParam
        {
            Fields =
            [
                $"{nameof(Calendar._CalendarDetail)}.{nameof(CalendarDetail.Date)}",
                $"{nameof(Calendar._CalendarDetail)}.{nameof(CalendarDetail.DayOfWeek)}",
                $"{nameof(Calendar._CalendarDetail)}.{nameof(CalendarDetail.HolidayName)}",
                $"{nameof(Calendar._CalendarDetail)}.{nameof(CalendarDetail.Spec_OpenTime)}",
                $"{nameof(Calendar._CalendarDetail)}.{nameof(CalendarDetail.Spec_CloseTime)}"
            ],
            Condition = $"{nameof(Calendar._CalendarDetail)}.{nameof(CalendarDetail.Date)} = '{today:yyyy-MM-dd}'",
            PageNumber = 1,
            PageSize = 1
        };
    }
    /// <summary>
    /// 查詢今日行事曆明細。
    /// </summary>
    private async Task<CalendarDetail?> QueryCurrentCalendarDetail(QueryListParam query, DateOnly today, CancellationToken ct)
    {
        IList<Calendar> calendars = await Service.BizQueryListAsync(query, ct);
        Calendar? calendar = calendars.FirstOrDefault();
        return calendar?._CalendarDetail.FirstOrDefault(detail => detail.Date == today);
    }
    /// <summary>
    /// 建立首頁今日開館資訊 DTO。
    /// </summary>
    private static SpecCurrentOpenTime_DTO CreateCurrentOpenTimeDto(CalendarDetail detail)
    {
        return new SpecCurrentOpenTime_DTO
        {
            Date = detail.Date,
            DayOfWeek = detail.DayOfWeek,
            HolidayName = detail.HolidayName,
            Spec_OpenTime = detail.Spec_OpenTime,
            Spec_CloseTime = detail.Spec_CloseTime
        };
    }
    #endregion
}
