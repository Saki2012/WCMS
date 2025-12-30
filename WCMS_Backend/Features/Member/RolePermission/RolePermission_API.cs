using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.Features.BizResx;
using WCMS.Features.Member.Account;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;


namespace WCMS.Features.Member.RolePermission
{
    [LibApiController(ModuleCode.AccountManage,PGID.RolePermission,FuncAction.MasterData)]
    public class RolePermissionController : ApiDataController<RolePermissionSet, RolePermissionSet_DTO>
    {
        #region Public
        public override Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition, CancellationToken ct)
        {
            queryCondition.Condition = FiltSystemRoler(queryCondition.Condition);
            return base.QueryList(queryCondition, ct);
        }
        [HttpGet(nameof(GetPermissionCatalog)), OutputCache(PolicyName = SysParam.PermanentCache)]
        [ProducesResponseType(typeof(ApiResponse<PermissionCatalogModuleDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPermissionCatalog(CancellationToken ct)
        {
            var data = ((RolePermissionBiz)Service).GetPermissionCatalog();
            var response = new ApiResponse<PermissionCatalogModuleDTO>(){Data = data,SysMessage = Message.Messages};
            return Ok(response);
        }
        #endregion

        #region Private

        /// <summary>
        /// 過濾系統使用者
        /// </summary>
        /// <param name="srcCdt"></param>
        private static string FiltSystemRoler(string srcCdt) => LibData.Merge(" And ", false, srcCdt, $@"{nameof(RoleDataModel.RoleId)} Not In {"Admin"}");
        #endregion

    }
}
