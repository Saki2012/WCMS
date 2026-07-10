using WCMS.Features.IAM.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.Security;

namespace WCMS.Features.IAM.Auth
{
    /// <summary>
    /// 登入驗證服務契約。
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// 依帳號取得登入使用者資訊。
        /// </summary>
        Task<User_DTO?> FindByAccountAsync(string account);
        /// <summary>
        /// 驗證帳號與密碼是否可登入。
        /// </summary>
        Task<(bool ok, User_DTO userInfo)> CheckLoginValid(string account, string password);
    }

    /// <summary>
    /// 處理帳號查詢與密碼驗證。
    /// </summary>
    public class AuthBiz(IBizService<AccountModel> accountBiz) : IAuthService
    {
        #region Property
        private readonly IBizService<AccountModel> AccountBiz = accountBiz;
        #endregion

        #region Public
        /// <summary>
        /// 依帳號取得登入使用者資訊。
        /// </summary>
        public async Task<User_DTO?> FindByAccountAsync(string account)
        {
            string[] fields = GetLoginFields();
            IList<AccountModel> users = await AccountBiz.BizQueryListAsync(fields, $"{nameof(AccountModel.AccountId)} = {account}", default, default, 0, 0);
            AccountModel? user = users.FirstOrDefault();
            return user == null ? null : BuildUserInfo(user);
        }
        /// <summary>
        /// 檢查輸入資料並驗證登入資訊。
        /// </summary>
        public async Task<(bool ok, User_DTO userInfo)> CheckLoginValid(string account, string password)
        {
            await Task.Delay(300);
            if (IsLoginEmpty(account, password) || account.Length > 20 || IsAllNumber(account)) return (false, default!);
            (bool ok, User_DTO userInfo) = await SignInAsync(account, password);
            return (ok, ok ? userInfo : default!);
        }
        #endregion

        #region Private
        /// <summary>
        /// 判斷帳號是否全部由數字組成。
        /// </summary>
        private static bool IsAllNumber(string value) => System.Text.RegularExpressions.Regex.IsMatch(value, "^[0-9]+$");
        /// <summary>
        /// 判斷帳號或密碼是否未輸入。
        /// </summary>
        private static bool IsLoginEmpty(string account, string password) => string.IsNullOrWhiteSpace(account) || string.IsNullOrWhiteSpace(password);
        /// <summary>
        /// 查詢帳號並驗證密碼雜湊與帳號狀態。
        /// </summary>
        private async Task<(bool ok, User_DTO userInfo)> SignInAsync(string account, string password)
        {
            string[] fields = GetLoginFields();
            IList<AccountModel> users = await AccountBiz.BizQueryListAsync(fields, $"{nameof(AccountModel.AccountId)} = {account}", default, default, 0, 0);
            AccountModel? user = users.FirstOrDefault();
            if (user == null || !PasswordHasher.Verify(password, user.PasswordHash, user.PasswordSalt, user.PasswordAlgoVer)) return (false, default!);
            if (user.AccountStatus != SysEnum.AccountStatus.Enable) return (false, default!);
            return (true, BuildUserInfo(user));
        }
        /// <summary>
        /// 取得登入驗證需要查詢的欄位。
        /// </summary>
        private static string[] GetLoginFields()
        {
            return [nameof(AccountModel.InternalId), nameof(AccountModel.AccountId), nameof(AccountModel.AccountName), nameof(AccountModel.PasswordHash), nameof(AccountModel.PasswordSalt), nameof(AccountModel.PasswordAlgoVer), nameof(AccountModel.AccountStatus)];
        }
        /// <summary>
        /// 將帳號模型轉為登入使用者資訊。
        /// </summary>
        private static User_DTO BuildUserInfo(AccountModel user)
        {
            return new User_DTO { UserId = user.AccountId, UserName = user.AccountName, AccountStatus = user.AccountStatus, InternalId = user.InternalId };
        }
        #endregion
    }
}
