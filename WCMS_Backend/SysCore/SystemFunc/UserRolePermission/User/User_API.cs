using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.Security;
using static WCMS.SysCore.Enum.SysEnum;


namespace WCMS.SysCore.SystemFunc.UserRolePermission.User
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class UserController : ApiDataController<UserSet,UserSet_DTO>
    {
        #region Public
        /// <summary>
        /// 新增
        /// </summary>
        /// <param name="newUser"></param>
        /// <returns></returns>
        [HttpPost(nameof(Create))]
        public async Task<IActionResult> Create(CreateUserDto newUser, CancellationToken ct)
        {
            (byte[] hash, byte[] salt, int ver) = PasswordHasher.Hash(newUser.Password);
            newUser.Password = string.Empty;// 清除敏感字串（避免在錯誤日誌裡被序列化）
            UserSet newUserSet = new()
            {
                User = new()
                {
                    UserId = newUser.UserId,
                    UserName = newUser.UserName,
                    Email = newUser.Email,
                    PasswordHash = hash,
                    PasswordSalt = salt,
                    PasswordAlgoVer = ver,
                    AccountStatus = AccountStatus.Enable
                },
                UserInfo =new List<UserInfo>()
                {
                    new UserInfo()
                    {
                        UserId=newUser.UserId,
                        UserName=newUser.UserName,
                        Lang="zh-tw",
                    }
                }
            };
            var result = await Service.BizCreateSetAsync(newUserSet);
            await EvictForSetAsync(ct);
            return Ok(result);
        }

        #region 隱藏路由[NonAction]
        [NonAction]
        public override async Task<IActionResult> Create(UserSet_DTO set, CancellationToken ct)
        {
            return await base.Create(set, ct);
        }
        #endregion

        #endregion
    }


    public sealed class CreateUserDto
    {
        public string UserId { get; set; } = "";         // 帳號
        public string UserName { get; set; } = "";       // 顯示名稱
        public string Password { get; set; } = "";       // 原始密碼
        public string? Email { get; set; }               // 選填
    }
}
