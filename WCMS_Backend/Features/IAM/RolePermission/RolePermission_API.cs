using Microsoft.AspNetCore.Mvc;
using WCMS.Features._Resx;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;

namespace WCMS.Features.IAM.RolePermission;

[LibApiController(ProgKeys.IAM.Code, ProgKeys.IAM.RolePermission, FuncAction.MasterData)]
public class RolePermissionController : ApiDataController<RoleData>
{
    #region Property
    private const string Admin = nameof(Admin);
    #endregion

    #region Public
    /// <summary>
    /// 查詢排除系統角色後的角色權限清單。
    /// </summary>
    public override Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition, CancellationToken ct)
    {
        queryCondition.Condition = FiltSystemRoler(queryCondition.Condition);
        return base.QueryList(queryCondition, ct);
    }

    /// <summary>
    /// 取得依目前語系轉換完成的角色權限功能目錄。
    /// </summary>
    [HttpGet(nameof(GetPermissionCatalog))]
    [ProducesResponseType(typeof(ApiResponse<PermissionCatalogModuleDTO>), StatusCodes.Status200OK)]
    public IActionResult GetPermissionCatalog()
    {
        IList<PermissionCatalogModuleDTO> data = ((RolePermissionBiz)Service).GetPermissionCatalog();
        ApiResponse<PermissionCatalogModuleDTO> response = new() { Data = data, SysMessage = Message.Messages };
        return Ok(response);
    }
    #endregion

    #region Private
    /// <summary>
    /// 過濾系統使用者。
    /// </summary>
    private static string FiltSystemRoler(string srcCdt)
    {
        return LibData.Merge(SysParam.QueryOperators.And, false, srcCdt, $@"{nameof(RoleData.RoleId)} Not In {Admin}");
    }
    #endregion
}
