namespace WCMS.Features.Setup.Migration;

/// <summary>
/// 註冊標準 Feature 舊資料匯入服務。
/// </summary>
internal static class OldDataMigrationSetup
{
    #region Public
    /// <summary>
    /// 註冊舊資料匯入協調服務。
    /// </summary>
    public static void AddServices(IServiceCollection services)
    {
        services.AddScoped<OldDataMigrationService>();
    }
    #endregion
}
