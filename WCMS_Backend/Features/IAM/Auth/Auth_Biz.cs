using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.Security.IdentityAccess;
using WCMS.SysCore.Security.IdentityAccess.Authentication;
using WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;
using AccountData = WCMS.Features.IAM.Account.Account;
namespace WCMS.Features.IAM.Auth;

/// <summary>
/// 處理帳號查詢與密碼驗證。
/// </summary>
public class AuthBiz(BizService<AccountData> accountBiz)
{
    #region Property
    private readonly BizService<AccountData> AccountBiz = accountBiz;
    #endregion

    #region Public
    /// <summary>
    /// 依帳號取得登入使用者資訊。
    /// </summary>
    public async Task<User_DTO?> FindByAccountAsync(string account)
    {
        string[] fields = GetLoginFields();
        IList<AccountData> users = await AccountBiz.BizQueryListAsync(fields, $"{nameof(AccountData.AccountId)} = {account}", default, default, 0, 0);
        AccountData? user = users.FirstOrDefault();
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
        IList<AccountData> users = await AccountBiz.BizQueryListAsync(fields, $"{nameof(AccountData.AccountId)} = {account}", default, default, 0, 0);
        AccountData? user = users.FirstOrDefault();
        if (user == null || !PasswordHasher.Verify(password, user.PasswordHash, user.PasswordSalt, user.PasswordAlgoVer)) return (false, default!);
        if (user.AccountStatus != AccountStatus.Enable) return (false, default!);
        return (true, BuildUserInfo(user));
    }
    /// <summary>
    /// 取得登入驗證需要查詢的欄位。
    /// </summary>
    private static string[] GetLoginFields()
    {
        return [nameof(AccountData.InternalId), nameof(AccountData.AccountId), nameof(AccountData.AccountName), nameof(AccountData.PasswordHash), nameof(AccountData.PasswordSalt), nameof(AccountData.PasswordAlgoVer), nameof(AccountData.AccountStatus)];
    }
    /// <summary>
    /// 將帳號模型轉為登入使用者資訊。
    /// </summary>
    private static User_DTO BuildUserInfo(AccountData user)
    {
        return new User_DTO { UserId = user.AccountId, UserName = user.AccountName, AccountStatus = user.AccountStatus, InternalId = user.InternalId };
    }
    #endregion
}
