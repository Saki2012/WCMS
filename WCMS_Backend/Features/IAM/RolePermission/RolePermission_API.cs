using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.IAM.RolePermission;

[LibApiController(ProgKeys.IAM.Code, ProgKeys.IAM.RolePermission, FuncAction.MasterData)]
public class RolePermissionController : ApiDataController<RoleDataModel>
{
    #region Property
    private const string Admin = nameof(Admin);
    #endregion

    #region Public
    public override Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition, CancellationToken ct)
    {
        queryCondition.Condition = FiltSystemRoler(queryCondition.Condition);
        return base.QueryList(queryCondition, ct);
    }
    [HttpGet(nameof(GetPermissionCatalog)), OutputCache(PolicyName = SysParam.OutputCachePolicies.PermanentCache)]
    [ProducesResponseType(typeof(ApiResponse<PermissionCatalogModuleDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPermissionCatalog(CancellationToken ct)
    {
        var data = ((RolePermissionBiz)Service).GetPermissionCatalog();
        var response = new ApiResponse<PermissionCatalogModuleDTO>() { Data = data, SysMessage = Message.Messages };
        return Ok(response);
    }
    #endregion

    #region Private

    /// <summary>
    /// 過濾系統使用者
    /// </summary>
    /// <param name="srcCdt"></param>
    private static string FiltSystemRoler(string srcCdt) => LibData.Merge(SysParam.QueryOperators.And, false, srcCdt, $@"{nameof(RoleDataModel.RoleId)} Not In {Admin}");
    #endregion

}
