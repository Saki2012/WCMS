using Microsoft.AspNetCore.Mvc;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.PageManagement
{
    [LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.PageManagement, FuncAction.MasterData)]
    public class PageManagementController : ApiDataController<PageManagement>{

        #region
        /// <summary>
        /// 獲取可被SiteMenu設定的功能模塊列表
        /// </summary>
        /// <remarks>主要用於有清單的說明模塊</remarks>
        /// <returns></returns>
        [HttpGet(nameof(GetUsedProgList)), LibRequireFuncAct(FuncAction.Use)]
        public IActionResult GetUsedProgList()
        {
            var response = new ApiResponse<Dictionary<string, string>>() { Data = [(Service as PageManagementBiz).GetSiteMenuUsedProgList()], SysMessage = Message.Messages };
            return Ok(response);
        }
        #endregion
    }
}
