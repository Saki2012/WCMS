using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using System.Collections.Generic;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.Features.SiteEdit.Tag;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.Security;


namespace WCMS.SysCore.SystemFunc.UserRolePermission.User
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class UserController : ApiDataController<UserSet>
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
                    AccountStatus = SysEnum.AccountStatus.Enable
                }
            };
            var result = await Service.CreateSetAsync(newUserSet);
            await EvictForSetAsync(ct);
            return Ok(result);
        }

        #region 隱藏路由[NonAction]
        [NonAction]
        public override async Task<IActionResult> Create(UserSet set, CancellationToken ct)
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
