using WCMS.SysCore.Enum;

namespace WCMS.SysCore.Library
{
    /// <summary>
    /// Spec 站台設定，集中提供目前啟用的客製代號。
    /// </summary>
    public static class SpecSettings
    {
        /// <summary>
        /// 目前啟用的 SpecCode，例如 Spec1810、Spec1817。
        /// </summary>
        public static string SpecCode { get; private set; } = string.Empty;
        /// <summary>
        /// 初始化 Spec 設定。
        /// </summary>
        public static void Init(IConfiguration configuration)
        {
            SpecCode = configuration["SpecCode"]?.Trim() ?? string.Empty;
        }
        /// <summary>
        /// 取得指定 SpecCode 對應的 SpecFeatures namespace。
        /// </summary>
        public static string SpecFeaturesNamespace
        {
            get
            {
                if (string.IsNullOrWhiteSpace(SpecCode)) return string.Empty;
                return $"{nameof(WCMS)}.{nameof(SpecFeatures)}.{SpecCode.Trim()}";
            }
        }
        /// <summary>
        /// 判斷目前是否啟用 Spec。
        /// </summary>
        public static bool HasSpecCode()
        {
            return !string.IsNullOrWhiteSpace(SpecCode);
        }
        /// <summary>
        /// 判斷 namespace 是否屬於 SpecFeatures。
        /// </summary>
        public static bool IsSpecFeaturesNamespace(string ns)
        {
            ns = ns?.Trim() ?? string.Empty;
            return ns == $"{nameof(WCMS)}.{nameof(SpecFeatures)}" || ns.StartsWith($"{nameof(WCMS)}.{nameof(SpecFeatures)}.", StringComparison.Ordinal);
        }
        /// <summary>
        /// 判斷 namespace 是否屬於目前啟用的 Spec。
        /// </summary>
        public static bool IsCurrentSpecNamespace(string ns)
        {
            ns = ns?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(ns)) return false;
            if (string.IsNullOrWhiteSpace(SpecFeaturesNamespace)) return false;

            return ns == SpecFeaturesNamespace || ns.StartsWith($"{SpecFeaturesNamespace}.", StringComparison.Ordinal);
        }
    }
}
