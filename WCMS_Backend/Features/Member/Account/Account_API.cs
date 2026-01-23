using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.Member.Account
{
    [LibApiController(ModuleCode.AccountManage, PGID.Account, FuncAction.MasterData)]
    public class AccountController: ApiDataController<AccountSet, AccountSet_DTO> {

        #region Public
        public override Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition, CancellationToken ct)
        {
            queryCondition.Condition = FiltSystemUser(queryCondition.Condition);
            return base.QueryList(queryCondition, ct);
        }
        /// <summary>
        /// 修改密碼
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPut(nameof(ChangePassword)), LibRequireFuncAct(FuncAction.Use)]
        public async Task<IActionResult> ChangePassword(ChangePassword pw, CancellationToken ct)
        {
            OperateLogModel log = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(ChangePassword)}", OperateUser.UserId,string.Empty, Request.Headers["HTTP_CLIENT_IP"].ToString());
            var response = new ApiResponse<string>() { Data = [], SysMessage = Message.Messages };
            if (pw.OldPassword == pw.NewPassword)
            {
                Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00028);
                return Ok(response);
            }
            AccountBiz.CheckPasswordLegal(pw.NewPassword,out List<SysMessageModel> message);
            Message.AddMessage(message);
            if (Message.HasError) return Ok(response);
            await ((AccountBiz)Service).ChangePassword(OperateUser.InternalId, pw.OldPassword,pw.NewPassword,ct);
            return Ok(response);
        }
        /// <summary>
        /// (系統管理員)重置密碼
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPut(nameof(ResetPassword)), LibRequireFuncAct(FuncAction.Use)]
        public async Task<IActionResult> ResetPassword(ResetPassword pw, CancellationToken ct)
        {
            OperateLogModel log = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(ResetPassword)}", OperateUser.UserId, string.Empty, Request.Headers["HTTP_CLIENT_IP"].ToString());
            var response = new ApiResponse<string>() { Data = [], SysMessage = Message.Messages };
            AccountBiz.CheckPasswordLegal(pw.NewPassword, out List<SysMessageModel> message);
            Message.AddMessage(message);
            if (Message.HasError) return Ok(response);
            await ((AccountBiz)Service).ResetPassword(pw.UserInternalId, pw.NewPassword, ct);
            return Ok(response);
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
            AccountBiz.ConvertPassword(set, dto.Account.Password);
            dto.Account.Password = string.Empty;// 清除敏感字串（避免在錯誤日誌裡被序列化）
        }
        #endregion
    }
}
