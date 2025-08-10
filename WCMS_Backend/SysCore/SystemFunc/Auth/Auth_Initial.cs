using StackExchange.Redis;
using System;
using WCMS.SysCore.Library.Security;

namespace WCMS.SysCore.SystemFunc.Auth
{
    public static class DbInitializer
    {
        //public static async Task SeedAdminAsync(this ApplicationDbContext db, IConfiguration cfg)
        //{
        //    var id = cfg["SysOperator:UserId"] ?? "admin";
        //    var name = cfg["SysOperator:UserName"] ?? "系統管理員";
        //    var pwd = cfg["SysOperator:Password"] ?? "Admin@12345";
        //    var rid = cfg["SysOperator:RoleId"] ?? "Admin";

        //    if (!await db.AnyAsync(r => r.Id == rid))
        //        db.Roles.Add(new Role { Id = rid, Name = "系統管理員" });

        //    if (!await db.Users.AnyAsync(u => u.Id == id))
        //    {
        //        var (hash, salt, ver) = PasswordHasher.Hash(pwd);
        //        var u = new User
        //        {
        //            Id = id,
        //            UserName = name,
        //            IsActive = true,
        //            PasswordHash = hash,
        //            PasswordSalt = salt,
        //            PasswordAlgoVer = ver
        //        };
        //        db.Users.Add(u);
        //        db.UserRoles.Add(new UserRole { UserId = id, RoleId = rid });
        //    }

        //    await db.SaveChangesAsync();
        //}
    }
}
