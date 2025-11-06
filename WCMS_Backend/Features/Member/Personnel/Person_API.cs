using Microsoft.AspNetCore.Mvc;
using WCMS.Features.Member.Account;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;


namespace WCMS.Features.Member.Personnel
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class PersonController : ApiDataController<PersonSet,PersonSet_DTO>{

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
        private static string FiltSystemUser(string srcCdt) => LibData.Merge(" And ", false, srcCdt, $@"{nameof(PersonModel_DTO.PersonId)} Not In {"SysOperator,Admin"}");
        #endregion
    }
}
