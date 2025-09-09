using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.Features.SystemSetting.SiteInfo.SystemInfo
{
    [ApiController, Route(SysParam.ServiceRptRoute)]
    public class SystemInfoController : ControllerBase
    {
        #region Public
        /// <summary>
        /// 後台分析(一次取得所有資料回傳)
        /// </summary>
        [HttpGet]public async Task<IActionResult> BackendAnalyze()
        {
            return Ok();
        }
        /// <summary>
        /// 網站流量分析
        /// </summary>
        [HttpGet]public async Task<IActionResult> WebFlowAnalyze()
        {
            return Ok();
        }
        /// <summary>
        /// 系統使用狀況資訊
        /// </summary>
        [HttpGet]public async Task<IActionResult> SystemUsedAnalyze()
        {
            return Ok();
        }
        /// <summary>
        /// 主機資訊
        /// </summary>
        public async Task<IActionResult> MachineInfo()
        {
            return Ok();
        }
        /// <summary>
        /// 瀏覽器 / 作業系統 資訊
        /// </summary>
        public async Task<IActionResult> BrowserInfo()
        {
            return Ok();
        }
        #endregion
    }
}
