using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.Auditing.OperateLog;

namespace WCMS.SysCore.Auditing;

/// <summary>
/// 集中註冊 WCMS 錯誤處理與操作稽核服務。
/// </summary>
internal static class AuditingModuleSetup
{
    #region Public
    /// <summary>
    /// 註冊錯誤訊息與操作日誌服務。
    /// </summary>
    public static void AddServices(IServiceCollection services)
    {
        services.AddScoped<IErrorHelper, ErrorHelper>();
        services.AddScoped<IOperateLog, OperateLog.OperateLogService>();
    }
    #endregion
}
