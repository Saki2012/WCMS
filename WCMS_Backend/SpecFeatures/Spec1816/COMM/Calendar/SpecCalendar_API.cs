using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WCMS.Features.COMM.Calendar;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
namespace WCMS.Features.SystemSetting.Calendar;

public partial class CalendarController 
{
    #region Public
    [HttpGet(nameof(Spec_GetCurrentOpenTime)), AllowAnonymous, IgnoreAntiforgeryToken]
    public async Task<ApiResponse<SpecCurrentOpenTime_DTO>> Spec_GetCurrentOpenTime(CancellationToken ct)
    {
        DateOnly today = DateOnly.FromDateTime(DateTime.Now);
       var queryCondition = new QueryListParam()
        {
            Fields = [
            $"{nameof(CalendarModel._CalendarDetail)}.{nameof(CalendarDetail.Date)}",
            $"{nameof(CalendarModel._CalendarDetail)}.{nameof(CalendarDetail.DayOfWeek)}",
            $"{nameof(CalendarModel._CalendarDetail)}.{nameof(CalendarDetail.HolidayName)}",
            $"{nameof(CalendarModel._CalendarDetail)}.{nameof(CalendarDetail.Spec_OpenTime)}",
            $"{nameof(CalendarModel._CalendarDetail)}.{nameof(CalendarDetail.Spec_CloseTime)}"
            ],
            Condition = $"{nameof(CalendarModel._CalendarDetail)}.{nameof(CalendarDetail.Date)} = '{today}'", OrderBy = null, PageNumber = 1,PageSize = 1
        };
        CalendarDetail data = (await Service.BizQueryListAsync(queryCondition)).FirstOrDefault().CalendarDetail.FirstOrDefault(p=>p.Date==today);
        List<SpecCurrentOpenTime_DTO> result = [new SpecCurrentOpenTime_DTO() {Date=data.Date,DayOfWeek=data.DayOfWeek,HolidayName=data.HolidayName,Spec_OpenTime=data.Spec_OpenTime,Spec_CloseTime=data.Spec_CloseTime }];
        var response = new ApiResponse<SpecCurrentOpenTime_DTO>() { Data = result, SysMessage = Message.Messages };
        return response;
    }
    #endregion
}
