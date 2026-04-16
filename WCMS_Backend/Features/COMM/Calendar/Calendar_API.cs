using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using WCMS.Features.COMM.Calendar;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SystemSetting.Calendar
{
    [LibApiController(ProgKeys.COMM.Code, ProgKeys.COMM.Calendar, FuncAction.MasterData)]
    public partial class CalendarController() : ApiDataController<CalendarSet, CalendarSet_DTO>
    {
        #region Public
        /// <summary>
        /// 同步導入新北市行事曆
        /// </summary>
        /// <param name="year"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPost(nameof(SyncFromNtpc)), LibRequireFuncAct(FuncAction.Use)]
        public async Task<IActionResult> SyncFromNtpc(int year,CancellationToken ct)
        {
            await ((CalendarBiz)Service).ImportCalendar(year, ct);
            var response = new ApiResponse<string>() { Data = [""], SysMessage = Message.Messages };
            return Ok(response);
        }
        /// <summary>
        /// 更新單日資訊
        /// </summary>
        /// <param name="year"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPut(nameof(UpdateDayInfo)), LibRequireFuncAct(FuncAction.Update)]
        public async Task<IActionResult> UpdateDayInfo([FromBody] CalendarDetail_DTO dayInfo, CancellationToken ct)
        {
            OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(UpdateDayInfo)}", OperateUser.UserId, JsonConvert.SerializeObject(dayInfo), Request.Headers["HTTP_CLIENT_IP"].ToString());
            CalendarDetail detail = DTOHelper.CopyObject<CalendarDetail>(dayInfo,true);
            await ((CalendarBiz)Service).BizUpdateDayInfo(detail, ct);
            var response = new ApiResponse<CalendarDetail_DTO>() { Data = [], SysMessage = Message.Messages };
            if (!response.IsSuccess) followInfo.ExcStatus = ExcStatus.Fail;
            else followInfo.ExcStatus = ExcStatus.OK;
            return Ok(response);
        }

        #endregion
    }
}
