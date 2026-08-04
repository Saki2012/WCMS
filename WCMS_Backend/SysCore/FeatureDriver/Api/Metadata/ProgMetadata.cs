using WCMS.Features._Resx;

namespace WCMS.SysCore.FeatureDriver.Api.Metadata;

/// <summary>
/// 保存單一後端功能在目前 Module 下使用的 Prog Metadata。
/// </summary>
public sealed record ProgMetadata(
    ModuleCodeEnum ModuleCode,
    string ProgId,
    string ModuleDisplayNameKey,
    string ProgDisplayNameKey);

/// <summary>
/// 提供 ProgId 與模塊顯示資源 Key 的統一映射入口。
/// </summary>
public interface IProgMetadataRegistry
{
    /// <summary>
    /// 依 ModuleCode 與 ProgId 取得必要的 Prog Metadata。
    /// </summary>
    ProgMetadata GetRequired(ModuleCodeEnum moduleCode, string progId);
}
