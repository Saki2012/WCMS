using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.Features.SystemSetting.Calendar;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.Spec1819.SiteEdit.SpecJournal
{
    [LibApiController(ModuleCode.WebManagement, PGID.SpecJournal, SysEnum.FuncAction.MasterData)]
    public class SpecJournalController : ApiDataController<SpecJournalSet, SpecJournalSet_DTO>
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
        #endregion


        #region Private
    
        #endregion
    }
}
