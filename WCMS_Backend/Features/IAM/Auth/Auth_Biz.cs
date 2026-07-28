using WCMS.Features.IAM.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.Security;

namespace WCMS.Features.IAM.Auth
{
    public interface IAuthService
    {
        Task<User_DTO?> FindByAccountAsync(string account);
        Task<(bool ok, User_DTO? userInfo)> CheckLoginValid(string account, string password);
    }

    public class AuthBiz(IBizService<AccountSet> accountBiz) : IAuthService
    {
        #region Property
        private readonly IBizService<AccountSet> AccountBiz = accountBiz;
        #endregion

        #region Public
        /// <summary>
        /// 依帳號取得目前有效使用者資料。
        /// </summary>
        public async Task<User_DTO?> FindByAccountAsync(string account)
        {
            var set = await QueryAccountAsync(account);
            if (set?.Account.AccountStatus != SysEnum.AccountStatus.Enable) return null;
            return BuildUser(set.Account);
        }

        /// <summary>
        /// 驗證登入帳號與密碼。
        /// </summary>
        public async Task<(bool ok, User_DTO? userInfo)> CheckLoginValid(string account, string password)
        {
            await Task.Delay(300);
            if (!IsLoginInputValid(account, password)) return (false, null);
            return await SignInAsync(account, password);
        }
        #endregion

        #region Private
        /// <summary>
        /// 驗證登入欄位基本格式。
        /// </summary>
        private static bool IsLoginInputValid(string account, string password)
        {
            if (string.IsNullOrWhiteSpace(account) || string.IsNullOrWhiteSpace(password)) return false;
            if (account.Length > 20) return false;
            return !System.Text.RegularExpressions.Regex.IsMatch(account, "^[0-9]+$");
        }

        /// <summary>
        /// 驗證密碼並建立登入使用者資料。
        /// </summary>
        private async Task<(bool ok, User_DTO? userInfo)> SignInAsync(string account, string password)
        {
            var set = await QueryAccountAsync(account, includePassword: true);
            if (set == null) return (false, null);

            var user = set.Account;
            var ok = PasswordHasher.Verify(password, user.PasswordHash, user.PasswordSalt, user.PasswordAlgoVer);
            if (!ok || user.AccountStatus != SysEnum.AccountStatus.Enable) return (false, null);
            return (true, BuildUser(user));
        }

        /// <summary>
        /// 查詢登入帳號資料。
        /// </summary>
        private async Task<AccountSet?> QueryAccountAsync(string account, bool includePassword = false)
        {
            var fields = BuildAccountFields(includePassword);
            var result = await AccountBiz.BizQueryListAsync(
                fields,
                $"{nameof(AccountModel.AccountId)} = {account}",
                default,
                default,
                0,
                1);

            return result.FirstOrDefault();
        }

        /// <summary>
        /// 建立帳號查詢欄位。
        /// </summary>
        private static string[] BuildAccountFields(bool includePassword)
        {
            var fields = new List<string>
            {
                nameof(AccountModel.InternalId),
                nameof(AccountModel.AccountId),
                nameof(AccountModel.AccountName),
                nameof(AccountModel.AccountStatus),
            };

            if (!includePassword) return [.. fields];
            fields.AddRange([
                nameof(AccountModel.PasswordHash),
                nameof(AccountModel.PasswordSalt),
                nameof(AccountModel.PasswordAlgoVer),
            ]);
            return [.. fields];
        }

        /// <summary>
        /// 將帳號資料轉成登入使用者 DTO。
        /// </summary>
        private static User_DTO BuildUser(AccountModel account)
        {
            return new User_DTO
            {
                UserId = account.AccountId,
                UserName = account.AccountName,
                AccountStatus = account.AccountStatus,
                InternalId = account.InternalId,
            };
        }
        #endregion
    }
}
