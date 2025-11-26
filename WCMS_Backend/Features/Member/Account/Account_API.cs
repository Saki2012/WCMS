using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.Security;

namespace WCMS.Features.Member.Account
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class AccountController: ApiDataController<AccountSet, AccountSet_DTO> {

        #region Public
        public override Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition, CancellationToken ct)
        {
            queryCondition.Condition = FiltSystemUser(queryCondition.Condition);
            return base.QueryList(queryCondition, ct);
        }
        #endregion

        #region Protected
        protected override void SpecDoMapToSet(AccountSet set, AccountSet_DTO dto)
        {
            base.SpecDoMapToSet(set, dto);
            ConvertPassword(set, dto);
        }
        #endregion

        #region Private
        /// <summary>
        /// 過濾系統使用者
        /// </summary>
        /// <param name="srcCdt"></param>
        private static string FiltSystemUser(string srcCdt)=> LibData.Merge(" And ", false, srcCdt, $@"{nameof(Account_DTO.AccountId)} Not In {"SysOperator,Admin"}");
        /// <summary>
        /// 轉換密碼
        /// </summary>
        /// <param name="set"></param>
        /// <param name="dto"></param>
        private void ConvertPassword(AccountSet set, AccountSet_DTO dto)
        {
            (byte[] hash, byte[] salt, int ver) = PasswordHasher.Hash(dto.Account.Password??"");
            dto.Account.Password = string.Empty;// 清除敏感字串（避免在錯誤日誌裡被序列化）
            set.Account.PasswordHash = hash;
            set.Account.PasswordSalt = salt;
            set.Account.PasswordAlgoVer = ver;
        }
        #endregion
    }
}
