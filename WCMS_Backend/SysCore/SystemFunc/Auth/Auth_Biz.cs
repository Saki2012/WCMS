using Azure.Core;
using Microsoft.AspNetCore.Identity;
using NetTopologySuite.Geometries;
using Newtonsoft.Json;
using System.Threading.Tasks;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.Security;
using WCMS.SysCore.SystemFunc.UserRolePermission.Role;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;
using static WCMS.SysCore.SystemFunc.Auth.AuthController;

namespace WCMS.SysCore.SystemFunc.Auth
{
    public interface IAuthService
    {
        Task<User_DTO> FindByAccountAsync(string account);
        //Task<List<RoleModel>> GetRolesByUserIdAsync(string account);
        public Task<(bool ok, User_DTO userInfo)> CheckLoginValid(string account, string password);
    }
    public class AuthBiz(IBizService<UserSet> users, IBizService<RoleSet> roles) : IAuthService
    {
        #region Property
        private readonly UserBiz UserService = (UserBiz)users;
        private readonly RoleBiz _roles = (RoleBiz)roles;
        #endregion

        #region Public
        
        public async Task<User_DTO> FindByAccountAsync(string account)
        {
            string[] selectFields = [nameof(UserModel.UserId), $"{nameof(UserModel.UserInfo)}.{nameof(UserInfo.UserName)}"];
            var userResult = await UserService.BizQueryListAsync(selectFields, $"{nameof(UserModel.UserId)} = {account}", default, 0, 0);
            var user = userResult.FirstOrDefault().User;
            return new User_DTO(){UserId = user.UserId,UserName = user.UserName,AccountStatus = user.AccountStatus};
        }
        /// <summary>
        /// 檢查輸入資料是否有效
        /// </summary>
        /// <returns></returns>
        public async Task<(bool ok, User_DTO userInfo)> CheckLoginValid(string account, string password)
        {
            await Task.Delay(300);
            if (IsLoginEmpty(account, password) ||
                account.Length > 20 ||
                IsAllNumber(account)
                ) return (false, default);


            var signIn = await SignInAsync(account, password);
            if (!signIn.ok) { return (false, default); }
            return (true, signIn.userInfo);
        }
        #endregion

        #region Private
        private bool IsAllNumber(string str) => System.Text.RegularExpressions.Regex.IsMatch(str, "^[0-9]+$");
        private bool IsLoginEmpty(string account, string password) => string.IsNullOrWhiteSpace(account) || string.IsNullOrWhiteSpace(password);
        private async Task<(bool ok, User_DTO userInfo)> SignInAsync(string account, string password)
        {
            string[] selectFields = [nameof(UserModel.UserId), $"{nameof(UserModel.UserInfo)}.{nameof(UserInfo.UserName)}", nameof(UserModel.PasswordHash), nameof(UserModel.PasswordSalt), nameof(UserModel.PasswordAlgoVer)];
            IList<UserSet> userResult = await UserService.BizQueryListAsync(selectFields, $"{nameof(UserModel.UserId)} = {account} And {nameof(UserModel.UserInfo)}.{nameof(UserInfo.Lang)} = zh-tw", default, 0, 0);
            var set = userResult.FirstOrDefault();
            if (set is null) return (false,default);
            var ok = PasswordHasher.Verify(password, set.User.PasswordHash, set.User.PasswordSalt, set.User.PasswordAlgoVer);
            if (!ok) return (false,default);
            return (true, new User_DTO
            {
                UserId = set.User.UserId,
                UserName = set.User.UserName,
                AccountStatus = set.User.AccountStatus,
            });
        }
        #endregion

    }
}
