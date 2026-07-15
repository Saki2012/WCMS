
namespace WCMS.SysCore.Configuration
{

    /// <summary>
    /// Spec 站台設定，集中提供目前啟用的客製代號。
    /// </summary>
    public static class SpecSettings
    {
        public const string SpecFeatures = nameof(SpecFeatures);

        /// <summary>
        /// 目前啟用的 SpecCode，例如 Spec1810、Spec1817。
        /// </summary>
        public static string SpecCode { get; private set; } = string.Empty;
        /// <summary>
        /// 是否啟用 AA 資料檢查
        /// </summary>
        public static bool AACheck { get; private set; } = false;
        /// <summary>
        /// 初始化 Spec 設定。
        /// </summary>
        public static void Init(IConfiguration configuration)
        {
            SpecCode = configuration[nameof(SpecCode)]?.Trim() ?? string.Empty;
            AACheck = configuration.GetValue<bool>(nameof(AACheck));
        }
        /// <summary>
        /// 取得指定 SpecCode 對應的 SpecFeatures namespace。
        /// </summary>
        public static string SpecFeaturesNamespace
        {
            get
            {
                if (string.IsNullOrWhiteSpace(SpecCode)) return string.Empty;
                return $"{nameof(WCMS)}.{SpecFeatures}.{SpecCode.Trim()}";
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
            return ns == $"{nameof(WCMS)}.{SpecFeatures}" || ns.StartsWith($"{nameof(WCMS)}.{SpecFeatures}.", StringComparison.Ordinal);
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
