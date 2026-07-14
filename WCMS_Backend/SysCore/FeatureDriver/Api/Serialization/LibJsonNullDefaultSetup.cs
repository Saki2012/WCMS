using System.Text.Json;
namespace WCMS.SysCore.FeatureDriver.Api.Serialization;

/// <summary>
/// 註冊 API JSON null 轉換為非 Nullable 欄位預設值的共用規則。
/// </summary>
internal static class LibJsonNullDefaultSetup
{
    #region Public
    /// <summary>
    /// 加入 WCMS 非 Nullable 欄位的 null 預設值解析器。
    /// </summary>
    public static void AddLibJsonNullDefaultHandling(
        this JsonSerializerOptions options,
        JsonSerializationRuntimeCache runtimeCache)
    {
        bool exists = options.TypeInfoResolverChain.OfType<LibJsonNullDefaultResolver>().Any();
        if (exists) return;
        options.TypeInfoResolverChain.Insert(0, new LibJsonNullDefaultResolver(runtimeCache));
    }
    #endregion
}
