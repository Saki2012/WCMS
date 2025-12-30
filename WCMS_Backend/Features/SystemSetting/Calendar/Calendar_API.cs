using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;
using WCMS.Features.BizResx;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.SystemSetting.Calendar
{
    [LibApiController(ModuleCode.SystemSetting, PGID.Calendar, SysEnum.FuncAction.MasterData)]
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
