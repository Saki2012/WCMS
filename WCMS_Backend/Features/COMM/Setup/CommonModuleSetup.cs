using WCMS.Features.COMM.Calendar;
using WCMS.SysCore.Configuration.Startup;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Biz;
namespace WCMS.Features.COMM.Setup;

/// <summary>
/// 註冊 COMM 共用資料的啟動初始化工作。
/// </summary>
internal static class CommonModuleSetup
{
    #region Public
    /// <summary>
    /// 註冊行事曆初始化工作。
    /// </summary>
    public static void AddServices(IServiceCollection services)
    {
        services.AddScoped<IApplicationStartupTask, CalendarStartupInitializer>();
    }
    #endregion
}

/// <summary>
/// 初始化尚未建立的 WCMS 萬年曆資料。
/// </summary>
internal sealed class CalendarStartupInitializer(IBizService<CalendarModel> calendarService, IConfiguration configuration) : IApplicationStartupTask
{
    #region Property
    /// <summary>
    /// 取得 COMM 初始化順序。
    /// </summary>
    public int Order => ApplicationStartupOrder.Common;
    #endregion

    #region Public
    /// <summary>
    /// 透過 CalendarBiz 正常生命週期建立初始行事曆。
    /// </summary>
    public async Task InitializeAsync(CancellationToken ct)
    {
        bool enabled = configuration.GetValue(SysParam.Configuration.DbInit.EnabledPath, true);
        if (!enabled || calendarService is not CalendarBiz calendarBiz) return;
        await calendarBiz.InitCalendar(ct);
    }
    #endregion
}
