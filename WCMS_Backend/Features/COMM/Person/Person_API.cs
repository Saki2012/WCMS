using Microsoft.AspNetCore.Mvc;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;


namespace WCMS.Features.COMM.Person
{
    [LibApiController(ProgKeys.COMM.Code, ProgKeys.COMM.Person, FuncAction.MasterData)]
    public class PersonController : ApiDataController<PersonModel>{

        #region Public
        public override Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition, CancellationToken ct)
        {
            queryCondition.Condition = FiltSystemUser(queryCondition.Condition);
            return base.QueryList(queryCondition, ct);
        }
        #endregion

        #region Private
        /// <summary>
        /// 過濾系統使用者
        /// </summary>
        /// <param name="srcCdt"></param>
        private static string FiltSystemUser(string srcCdt) => LibData.Merge(" And ", false, srcCdt, $@"{nameof(PersonModel.PersonId)} Not In {"SysOperator,Admin"}");
        #endregion
    }
}
