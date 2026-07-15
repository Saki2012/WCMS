using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.Auditing.OperateLog;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
using WCMS.SysCore.FeatureDriver.Api.Metadata;

namespace WCMS.Features.COMM.Calendar;

[LibApiController(ProgKeys.COMM.Code, ProgKeys.COMM.Calendar, FuncAction.MasterData)]
public partial class CalendarController() : ApiDataController<CalendarModel>
{
    #region Public
    /// <summary>
    /// 同步導入新北市行事曆。
    /// </summary>
    [HttpPost(nameof(SyncFromNtpc)), LibRequireFuncAct(FuncAction.Use)]
    public async Task<IActionResult> SyncFromNtpc(int year, CancellationToken ct)
    {
        await ((CalendarBiz)Service).ImportCalendar(year, ct);
        var response = new ApiResponse<string> { Data = [string.Empty], SysMessage = Message.Messages };
        return Ok(response);
    }
    /// <summary>
    /// 更新單日行事曆資訊。
    /// </summary>
    [HttpPut(nameof(UpdateDayInfo)), LibRequireFuncAct(FuncAction.Update)]
    public async Task<IActionResult> UpdateDayInfo([FromBody] CalendarDetail dayInfo, CancellationToken ct)
    {
        OperateLogModel followInfo = CreateUpdateDayLog(dayInfo);
        CalendarDetail result = await ((CalendarBiz)Service).BizUpdateDayInfo(dayInfo, ct);
        var response = new ApiResponse<CalendarDetail> { Data = [result], SysMessage = Message.Messages };
        followInfo.ExcStatus = response.IsSuccess ? ExcStatus.OK : ExcStatus.Fail;
        return Ok(response);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立單日行事曆更新操作紀錄。
    /// </summary>
    private OperateLogModel CreateUpdateDayLog(CalendarDetail dayInfo)
    {
        string progId = $"{Service.ProgId}/{nameof(UpdateDayInfo)}";
        string content = JsonConvert.SerializeObject(dayInfo);
        string clientIp = Request.Headers[SysParam.HttpHeaders.ClientIp].ToString();
        return OperateLog.AddOperateLog(progId, OperateUser.UserId, content, clientIp);
    }
    #endregion
}
