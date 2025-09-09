using Azure.Core;
using Microsoft.AspNetCore.Identity;
using NetTopologySuite.Geometries;
using Newtonsoft.Json;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.Security;
using WCMS.SysCore.SystemFunc.UserRolePermission.Role;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;

namespace WCMS.SysCore.SystemFunc.Auth
{
    
    public interface IAuthService
    {
        Task<(bool ok, UserSet userSet, List<string> roles, string reason)> SignInAsync(string account, string password);
        Task<UserModel> FindByAccountAsync(string account);
        //Task<List<RoleModel>> GetRolesByUserIdAsync(string account);
    }

    public class AuthBiz(IBizService<UserSet> users, IBizService<RoleSet> roles) : IAuthService
    {
        private readonly UserBiz _users = (UserBiz)users;
        private readonly RoleBiz _roles = (RoleBiz)roles;

        public async Task<(bool ok, UserSet userSet, List<string> roles, string reason)> SignInAsync(string account, string password)
        {
            string[] selectFields = [nameof(UserModel.UserId),$"{nameof(UserModel.UserInfo)}.{nameof(UserInfo.UserName)}" ,nameof(UserModel.PasswordHash),nameof(UserModel.PasswordSalt),nameof(UserModel.PasswordAlgoVer)];
            var userResult = await _users.BizQueryListAsync(selectFields,$"{nameof(UserModel.UserId)} = {account} And {nameof(UserModel.UserInfo)}.{nameof(UserInfo.Lang)} = zh-tw", default, 0,0);
            var set = userResult.FirstOrDefault();
            if (set is null) return (false, null!, new(), "not_found_or_inactive");
            var ok = PasswordHasher.Verify(password, set.User.PasswordHash, set.User.PasswordSalt, set.User.PasswordAlgoVer);
            if (!ok) return (false, null!, new(), "bad_password");
            //var roles = await _roles.BizQuerySetAsync("");
            return (true, set, null, string.Empty);
        }

        public async Task<UserModel> FindByAccountAsync(string account)
        {
            string[] selectFields = [nameof(UserModel.UserId), $"{nameof(UserModel.UserInfo)}.{nameof(UserInfo.UserName)}"];
            var userResult = await _users.BizQueryListAsync(selectFields, $"{nameof(UserModel.UserId)} = {account}", default, 0, 0);
            var user = userResult.FirstOrDefault().User;
            return user;
        }
    }
}
