using WCMS.Features.IAM.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.Security;

namespace WCMS.Features.IAM.Auth
{
    public interface IAuthService
    {
        Task<User_DTO> FindByAccountAsync(string account);
        //Task<List<RoleModel>> GetRolesByUserIdAsync(string account);
        public Task<(bool ok, User_DTO userInfo)> CheckLoginValid(string account, string password);
    }
    public class AuthBiz(IBizService<AccountSet> accountBiz/*, IBizService<RoleSet> roles*/) : IAuthService
    {
        #region Property
        private readonly IBizService<AccountSet> AccountBiz = accountBiz;
        //private readonly IBizService<RoleSet> _roles = roles;
        #endregion

        #region Public
        public async Task<User_DTO> FindByAccountAsync(string account)
        {
            string[] selectFields = [nameof(AccountModel.AccountId)];
            var userResult = await AccountBiz.BizQueryListAsync(selectFields, $"{nameof(AccountModel.PersonId)} = {account}", default,default, 0, 0);
            var user = userResult.FirstOrDefault().Account;
            return new User_DTO(){UserId = user.PersonId,AccountStatus = user.AccountStatus};
        }
        /// <summary>
        /// 檢查輸入資料是否有效
        /// </summary>
        /// <returns></returns>
        public async Task<(bool ok, User_DTO userInfo)> CheckLoginValid(string account, string password)
        {
            await Task.Delay(300);
            if (IsLoginEmpty(account, password) ||account.Length > 20 ||IsAllNumber(account)) return (false, default);
            var (ok, userInfo) = await SignInAsync(account, password);
            return (ok, ok?userInfo:default);
        }
        #endregion

        #region Private
        private bool IsAllNumber(string str) => System.Text.RegularExpressions.Regex.IsMatch(str, "^[0-9]+$");
        private bool IsLoginEmpty(string account, string password) => string.IsNullOrWhiteSpace(account) || string.IsNullOrWhiteSpace(password);
        private async Task<(bool ok, User_DTO userInfo)> SignInAsync(string account, string password)
        {
            string[] selectFields = [nameof(AccountModel.InternalId), nameof(AccountModel.AccountId), nameof(AccountModel.AccountName), nameof(AccountModel.PasswordHash), nameof(AccountModel.PasswordSalt), nameof(AccountModel.PasswordAlgoVer),nameof(AccountModel.AccountStatus)];
            IList<AccountSet> userResult = await AccountBiz.BizQueryListAsync(selectFields, $"{nameof(AccountModel.AccountId)} = {account}", default,default, 0, 0);
            var set = userResult.FirstOrDefault();
            if (set is null) return (false,default);
            var ok = PasswordHasher.Verify(password, set.Account.PasswordHash, set.Account.PasswordSalt, set.Account.PasswordAlgoVer);
            if (!ok) return (false,default);
            if (set.Account.AccountStatus != SysEnum.AccountStatus.Enable) return (false, default);
            return (true, new User_DTO
            {
                UserId = set.Account.AccountId,
                UserName = set.Account.AccountName,
                AccountStatus = set.Account.AccountStatus,
                InternalId = set.Account.InternalId,
            });
        }
        #endregion
    }
}
