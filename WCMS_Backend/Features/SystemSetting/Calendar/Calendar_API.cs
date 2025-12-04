using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;

namespace WCMS.Features.SystemSetting.Calendar
{

    [ApiController, Route(SysParam.ServiceRoute)]
    public partial class CalendarController() : ApiDataController<CalendarSet, CalendarSet_DTO>
    {
        #region Public
        [HttpPost(nameof(SyncFromNtpc))]
        public async Task<IActionResult> SyncFromNtpc(int year,CancellationToken ct)
        {
            await ((CalendarBiz)Service).ImportCalendar(year, ct);
            var response = new ApiResponse<string>() { Data = [""], SysMessage = Message.Messages };
            return Ok(response);
        }
        #endregion
    }
}
