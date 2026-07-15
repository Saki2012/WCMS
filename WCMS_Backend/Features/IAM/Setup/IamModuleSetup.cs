using Microsoft.EntityFrameworkCore;
using WCMS.Features.COMM.Person;
using WCMS.Features.IAM.Account;
using WCMS.Features.IAM.RolePermission;
using WCMS.SysCore.Configuration.Startup;
using WCMS.SysCore.Constants;
using WCMS.SysCore.Persistence;
using WCMS.SysCore.Security.IdentityAccess;
using WCMS.SysCore.Security.IdentityAccess.Authentication;
namespace WCMS.Features.IAM.Setup;

/// <summary>
/// 註冊 IAM 必要資料的啟動初始化工作。
/// </summary>
internal static class IamModuleSetup
{
    #region Public
    /// <summary>
    /// 註冊帳號、角色與人員初始化工作。
    /// </summary>
    public static void AddServices(IServiceCollection services)
    {
        services.AddScoped<IApplicationStartupTask, IamStartupInitializer>();
    }
    #endregion
}

/// <summary>
/// 初始化系統角色、系統操作帳號與管理者帳號。
/// </summary>
internal sealed class IamStartupInitializer(ApplicationDbContext db, IConfiguration configuration) : IApplicationStartupTask
{
    #region Property
    private const string AdminRoleId = "Admin";
    /// <summary>
    /// 取得 IAM 初始化順序。
    /// </summary>
    public int Order => ApplicationStartupOrder.IdentityAccess;
    #endregion

    #region Public
    /// <summary>
    /// 依 DbInit 設定建立必要角色、人員與帳號。
    /// </summary>
    public async Task InitializeAsync(CancellationToken ct)
    {
        if (!IsEnabled()) return;
        AccountsSeedRoot? settings = configuration.GetSection(SysParam.Configuration.DbInit.AccountPath).Get<AccountsSeedRoot>();
        if (settings == null) return;
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await EnsureAdminRoleAsync(ct);
        await EnsurePersonAndAccountAsync(settings.SysOperator, false, ct);
        await EnsurePersonAndAccountAsync(settings.Admin, true, ct);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 判斷是否允許執行資料庫初始化資料。
    /// </summary>
    private bool IsEnabled()
    {
        return configuration.GetValue(SysParam.Configuration.DbInit.EnabledPath, true);
    }
    /// <summary>
    /// 確保系統管理員角色存在。
    /// </summary>
    private async Task EnsureAdminRoleAsync(CancellationToken ct)
    {
        RoleDataModel? role = await db.Set<RoleDataModel>().FirstOrDefaultAsync(item => item.RoleId == AdminRoleId, ct);
        if (role != null) return;
        await db.Set<RoleDataModel>().AddAsync(new RoleDataModel { RoleId = AdminRoleId, RoleName = "系統管理員", IsAdmin = true, InternalId = Guid.NewGuid().ToString(), }, ct);
    }
    /// <summary>
    /// 確保指定設定的人員與帳號存在。
    /// </summary>
    private async Task EnsurePersonAndAccountAsync(AccountSeedSetting setting, bool canLogin, CancellationToken ct)
    {
        PersonModel person = await EnsurePersonAsync(setting, ct);
        AccountModel? account = await db.Set<AccountModel>().FirstOrDefaultAsync(item => item.AccountId == setting.AccountId, ct);
        if (account != null) return;
        await db.Set<AccountModel>().AddAsync(BuildAccount(setting, person.PersonId, canLogin), ct);
    }
    /// <summary>
    /// 確保帳號對應的人員資料存在。
    /// </summary>
    private async Task<PersonModel> EnsurePersonAsync(AccountSeedSetting setting, CancellationToken ct)
    {
        PersonModel? person = await db.Set<PersonModel>().FirstOrDefaultAsync(item => item.PersonId == setting.AccountId, ct);
        if (person != null) return person;
        person = BuildPerson(setting);
        await db.Set<PersonModel>().AddAsync(person, ct);
        await db.SaveChangesAsync(ct);
        return person;
    }
    /// <summary>
    /// 建立初始化用人員資料。
    /// </summary>
    private static PersonModel BuildPerson(AccountSeedSetting setting)
    {
        return new PersonModel
        {
            PersonId = setting.AccountId,
            PersonName = string.IsNullOrWhiteSpace(setting.AccountName) ? setting.AccountId : setting.AccountName,
            Email = string.Empty,
            MobilePhone = string.Empty,
            HomePhone = string.Empty,
            InternalId = Guid.NewGuid().ToString(),
        };
    }
    /// <summary>
    /// 建立初始化用帳號資料與登入憑證。
    /// </summary>
    private static AccountModel BuildAccount(AccountSeedSetting setting, string personId, bool canLogin)
    {
        (byte[] hash, byte[] salt, int version) = canLogin ? PasswordHasher.Hash(setting.Password) : (Array.Empty<byte>(), Array.Empty<byte>(), 0);
        return new AccountModel
        {
            AccountId = setting.AccountId,
            AccountName = setting.AccountName,
            PersonId = personId,
            RoleId = setting.RoleId,
            PasswordHash = hash,
            PasswordSalt = salt,
            PasswordAlgoVer = version,
            AccountStatus = AccountStatus.Enable,
            InternalId = Guid.NewGuid().ToString(),
        };
    }
    /// <summary>
    /// 保存資料庫初始化帳號設定根節點。
    /// </summary>
    private sealed class AccountsSeedRoot
    {
        public AccountSeedSetting SysOperator { get; init; } = new();
        public AccountSeedSetting Admin { get; init; } = new();
    }
    /// <summary>
    /// 保存單一初始化帳號設定。
    /// </summary>
    private sealed class AccountSeedSetting
    {
        public string AccountId { get; init; } = string.Empty;
        public string AccountName { get; init; } = string.Empty;
        public string Password { get; init; } = string.Empty;
        public string RoleId { get; init; } = string.Empty;
    }
    #endregion
}
