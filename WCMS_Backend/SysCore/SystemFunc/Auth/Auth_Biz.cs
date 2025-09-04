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
        Task<(bool ok, UserModel user, List<string> roles, string reason)> SignInAsync(string account, string password);
        Task<UserModel> FindByAccountAsync(string account);
        //Task<List<RoleModel>> GetRolesByUserIdAsync(string account);
    }

    public class AuthBiz(IBizService<UserSet> users, IBizService<RoleSet> roles, IMoveFollowingRecord OperateLog, HttpRequest request) : IAuthService
    {
        private readonly UserBiz _users = (UserBiz)users;
        private readonly RoleBiz _roles = (RoleBiz)roles;
        private readonly IMoveFollowingRecord _operateLog = OperateLog;
        

        public async Task<(bool ok, UserModel user, List<string> roles, string reason)> SignInAsync(string account, string password)
        {
            string[] selectFields = [nameof(UserModel.UserId),nameof(UserModel.UserName),nameof(UserModel.PasswordHash),nameof(UserModel.PasswordSalt),nameof(UserModel.PasswordAlgoVer)];
            var userResult = await _users.BizQueryListAsync(selectFields,$"{nameof(UserModel.UserId)} = {account}", default, 0,0);
            var user = userResult.FirstOrDefault().User;
            if (user is null) return (false, null!, new(), "not_found_or_inactive");
            var ok = PasswordHasher.Verify(password, user.PasswordHash, user.PasswordSalt, user.PasswordAlgoVer);
            if (!ok) return (false, null!, new(), "bad_password");

            MoveFollow followInfo = new MoveFollow();
            followInfo.APIName = nameof(SignInAsync);
            followInfo.UserId = user.UserId;
            followInfo.followingDT = JsonConvert.SerializeObject(user);
            followInfo.IP = request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            //var roles = await _roles.BizQuerySetAsync("");
            return (true, user, null, string.Empty);
        }

        public async Task<UserModel> FindByAccountAsync(string account)
        {
            string[] selectFields = [nameof(UserModel.UserId), nameof(UserModel.UserName)];
            var userResult = await _users.BizQueryListAsync(selectFields, $"{nameof(UserModel.UserId)} = {account}", default, 0, 0);
            var user = userResult.FirstOrDefault().User;

            MoveFollow followInfo = new MoveFollow();
            followInfo.APIName = nameof(FindByAccountAsync);
            followInfo.UserId = user.UserId;
            followInfo.followingDT = JsonConvert.SerializeObject(user);
            followInfo.IP = request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            return user;
        }





    }
}
