using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournal;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.Spec.SpecJournal, SysEnum.FuncAction.MasterData)]
public class SpecJournalController : ApiDataController<SpecJournalModel>
{
    #region Public
    /// <summary>
    /// 依 ORCID iD 查詢作者資訊（公開資訊）
    /// </summary>
    [HttpGet(nameof(GetAuthorByOrcid)), LibRequireFuncAct(SysEnum.FuncAction.Use)]
    public async Task<ApiResponse<ORCIDData>> GetAuthorByOrcid([FromQuery] string orcid, CancellationToken ct)
    {
        ORCIDData dto = await ((SpecJournal_Biz)Service).GetOrcIdAuthorAsync(orcid, ct);
        var response = new ApiResponse<ORCIDData>() { Data = [dto], SysMessage = Message.Messages };
        return response;
    }
    /// <summary>
    /// 將預刊本轉為期刊本
    /// </summary>
    /// <param name="req"></param>
    /// <param name="ct"></param>
    /// <returns></returns>
    [HttpPut(nameof(PublishJournal)), LibRequireFuncAct(SysEnum.FuncAction.Use)]
    public async Task<IActionResult> PublishJournal([FromBody] PublishReq data, CancellationToken ct) 
    {
        OperateLogModel opLog = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(PublishJournal)}", OperateUser.UserId, JsonConvert.SerializeObject(data), Request.Headers[SysParam.HttpHeaders.ClientIp].ToString());
        await ((SpecJournal_Biz)Service).UpdatePublishedStatusAsync(data.InternalId,data.JournalIndexId, data.JournalIndexRowId, ct);
        await EvictForSetAsync(ct, data.InternalId);
        if (ct == CancellationToken.None) { opLog.ExcStatus = ExcStatus.CancelExc; }
        var response = new ApiResponse() { SysMessage = Message.Messages };
        if (!response.IsSuccess) opLog.ExcStatus = ExcStatus.Fail;
        else opLog.ExcStatus = ExcStatus.OK;
        return Ok(response);
    }
    /// <summary>
    /// 將期刊本退回預刊本
    /// </summary>
    /// <param name="req"></param>
    /// <param name="ct"></param>
    /// <returns></returns>
    [HttpPut(nameof(UnpublishJournal)), LibRequireFuncAct(SysEnum.FuncAction.Use)]
    public async Task<IActionResult> UnpublishJournal([FromBody] string internalId, CancellationToken ct) 
    {
        OperateLogModel opLog = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(UnpublishJournal)}", OperateUser.UserId, JsonConvert.SerializeObject(internalId), Request.Headers[SysParam.HttpHeaders.ClientIp].ToString());
        await ((SpecJournal_Biz)Service).UpdatePublishedStatusAsync(internalId,ct:ct);
        await EvictForSetAsync(ct, internalId);
        if (ct == CancellationToken.None) { opLog.ExcStatus = ExcStatus.CancelExc; }
        var response = new ApiResponse() { SysMessage = Message.Messages };
        if (!response.IsSuccess) opLog.ExcStatus = ExcStatus.Fail;
        else opLog.ExcStatus = ExcStatus.OK;
        return Ok(response);
    }
    #endregion

    #region Private

    #endregion
}
