using Microsoft.EntityFrameworkCore;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.SysCore.Configuration.Startup;
using WCMS.SysCore.Constants;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Persistence;
namespace WCMS.Features.WEB.Setup;

/// <summary>
/// 註冊 WEB 必要資料的啟動初始化工作。
/// </summary>
internal static class WebModuleSetup
{
    #region Public
    /// <summary>
    /// 註冊站台根資料初始化工作。
    /// </summary>
    public static void AddServices(IServiceCollection services)
    {
        services.AddScoped<IApplicationStartupTask, WebStartupInitializer>();
    }
    #endregion
}

/// <summary>
/// 初始化 WCMS 站台根設定與預設語系資料。
/// </summary>
internal sealed class WebStartupInitializer(ApplicationDbContext db, IConfiguration configuration) : IApplicationStartupTask
{
    #region Property
    /// <summary>
    /// 取得 WEB 初始化順序。
    /// </summary>
    public int Order => ApplicationStartupOrder.Web;
    #endregion

    #region Public
    /// <summary>
    /// 建立尚未存在的站台根設定。
    /// </summary>
    public async Task InitializeAsync(CancellationToken ct)
    {
        if (!IsEnabled()) return;
        bool exists = await db.Set<SiteMenu_IndexModel>().AnyAsync(item => item.SiteIndex == string.Empty, ct);
        if (exists) return;
        AccountSeedSetting systemOperator = GetSystemOperator();
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        SiteMenu_IndexModel root = BuildRoot(systemOperator.AccountId);
        await db.Set<SiteMenu_IndexModel>().AddAsync(root, ct);
        await db.Set<SiteMenu_IndexInfoModel>().AddRangeAsync(BuildRootInfos(root.SiteIndex), ct);
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
    /// 取得初始化資料使用的系統操作帳號。
    /// </summary>
    private AccountSeedSetting GetSystemOperator()
    {
        return configuration.GetSection(SysParam.Configuration.DbInit.SysOperatorPath).Get<AccountSeedSetting>()
            ?? throw new InvalidOperationException("DbInit:Account:SysOperator 尚未設定。");
    }
    /// <summary>
    /// 建立站台根設定資料。
    /// </summary>
    private static SiteMenu_IndexModel BuildRoot(string operatorId)
    {
        DateTime now = DateTime.Now;
        return new SiteMenu_IndexModel
        {
            SiteIndex = string.Empty,
            GoogleAnalytics = string.Empty,
            Enable = true,
            DefaultLang = LangCode.zhtw,
            SupportLangs = LangCodeJson.ToJsonArray(LangCode.zhtw, LangCode.en),
            InternalId = Guid.NewGuid().ToString(),
            IsIniData = true,
            CreateTime = now,
            ModifyTime = now,
            CreateUserId = operatorId,
            ModifyUserId = operatorId,
        };
    }
    /// <summary>
    /// 建立站台根設定的中英文語系資料。
    /// </summary>
    private static SiteMenu_IndexInfoModel[] BuildRootInfos(string siteIndex)
    {
        return
        [
            BuildRootInfo(siteIndex, 1, LangCode.zhtw),
            BuildRootInfo(siteIndex, 2, LangCode.en),
        ];
    }
    /// <summary>
    /// 建立單一語系的站台根資訊。
    /// </summary>
    private static SiteMenu_IndexInfoModel BuildRootInfo(string siteIndex, int rowId, LangCode lang)
    {
        return new SiteMenu_IndexInfoModel
        {
            SiteIndex = siteIndex,
            RowId = rowId,
            Lang = lang,
            Title = string.Empty,
            Description = string.Empty,
            SiteHeader = string.Empty,
            SiteFooter = string.Empty,
            Keyword = string.Empty,
        };
    }
    /// <summary>
    /// 保存站台初始化需要的系統操作帳號設定。
    /// </summary>
    private sealed class AccountSeedSetting
    {
        public string AccountId { get; init; } = string.Empty;
    }
    #endregion
}
