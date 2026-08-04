using System.Reflection;
using WCMS.Features.IAM.RolePermission;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.Configuration.Startup;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;

namespace WCMS.Features.Setup;

/// <summary>
/// 啟動時驗證 ProgKeys、Controller Catalog 與 Biz Metadata 的一致性。
/// </summary>
internal sealed class ProgMetadataStartupTask(
    IProgMetadataRegistry progMetadataRegistry,
    RolePermissionCatalogCache catalogCache) : IApplicationStartupTask
{
    #region Property
    private IProgMetadataRegistry ProgMetadataRegistry { get; } = progMetadataRegistry;
    private RolePermissionCatalogCache CatalogCache { get; } = catalogCache;

    /// <summary>
    /// 在身分與權限基礎資料初始化前完成 Prog Metadata 驗證。
    /// </summary>
    public int Order => ApplicationStartupOrder.FeatureMetadata;
    #endregion

    #region Public
    /// <summary>
    /// 強制建立權限目錄並驗證目前啟用功能的 Biz Metadata。
    /// </summary>
    public Task InitializeAsync(CancellationToken ct)
    {
        _ = CatalogCache.GetCatalog();
        ValidateBizMetadata();
        return Task.CompletedTask;
    }
    #endregion

    #region Private
    /// <summary>
    /// 驗證目前 Core 與啟用 Spec 的 Biz 是否使用已登錄 ProgId。
    /// </summary>
    private void ValidateBizMetadata()
    {
        foreach (Type bizType in GetBizTypes()) ValidateBizType(bizType);
    }

    /// <summary>
    /// 取得目前執行範圍內宣告 LibBiz 的具體型別。
    /// </summary>
    private static IEnumerable<Type> GetBizTypes()
    {
        return typeof(ProgMetadataStartupTask).Assembly
            .GetTypes()
            .Where(type => !type.IsAbstract)
            .Where(type => type.GetCustomAttribute<LibBizAttribute>(true) != null)
            .Where(IsAllowedBySpec)
            .OrderBy(type => type.FullName, StringComparer.Ordinal);
    }

    /// <summary>
    /// 驗證單一 Biz 的 ModuleCode 與 ProgId 對應關係。
    /// </summary>
    private void ValidateBizType(Type bizType)
    {
        LibBizAttribute metadata = bizType.GetCustomAttribute<LibBizAttribute>(true)!;
        try
        {
            _ = ProgMetadataRegistry.GetRequired(metadata.ModuleCode, metadata.ProgId);
        }
        catch (InvalidOperationException ex)
        {
            throw new InvalidOperationException($"Biz Metadata 驗證失敗：{bizType.FullName}。", ex);
        }
    }

    /// <summary>
    /// 判斷 Biz 是否屬於 Core 或目前啟用的 Spec。
    /// </summary>
    private static bool IsAllowedBySpec(Type bizType)
    {
        string targetNamespace = bizType.Namespace ?? string.Empty;
        string specCode = SpecSettings.SpecCode ?? string.Empty;
        if (!targetNamespace.StartsWith(SysParam.NamespacePrefixes.SpecFeatures, StringComparison.OrdinalIgnoreCase)) return true;
        if (string.IsNullOrWhiteSpace(specCode)) return true;
        return targetNamespace.StartsWith($"{SysParam.NamespacePrefixes.SpecFeatures}{specCode}.", StringComparison.OrdinalIgnoreCase);
    }
    #endregion
}
