using System.Collections.Concurrent;
using System.Globalization;
using System.Reflection;
using System.Resources;

namespace WCMS.SysCore.I18n
{
    /// <summary>
    /// 共用 Resx 讀取器：支援 Spec -> Core fallback、避免重複 new ResourceManager
    /// </summary>
    internal static class LibResxReader
    {
        private static readonly ConcurrentDictionary<string, ResourceManager> RmCache = new();
        /// <summary>
        /// 取得 ResourceManager（快取）
        /// </summary>
        private static ResourceManager GetRm(string baseName, Assembly asm)
        {
            var key = $"{asm.FullName}::{baseName}";
            return RmCache.GetOrAdd(key, _ => new ResourceManager(baseName, asm));
        }
        /// <summary>
        /// 讀取指定 baseName 的字串（找不到回 null）
        /// </summary>
        public static string? TryGetString(string baseName, Assembly asm, string resourceKey, CultureInfo? culture = null)
        {
            if (string.IsNullOrWhiteSpace(baseName)) return null;
            if (string.IsNullOrWhiteSpace(resourceKey)) return null;
            var uiCulture = culture ?? CultureInfo.CurrentUICulture;
            string? value = null;
            var rm = GetRm(baseName, asm);
            if (rm != null) value = rm.GetResourceSet(uiCulture, true,false)?.GetString(resourceKey);
            return value;
        }

        /// <summary>
        /// Spec 優先、找不到就用 Core（找不到回 null）
        /// </summary>
        public static string? TryGetSpecOrCore(string coreBaseName, string? specBaseName, Assembly asm, string resourceKey, CultureInfo? culture = null)
        {
            if (!string.IsNullOrWhiteSpace(specBaseName))
            {
                var specValue = TryGetString(specBaseName, asm, resourceKey, culture);
                if (!string.IsNullOrWhiteSpace(specValue)) return specValue;
            }
            var coreValue = TryGetString(coreBaseName, asm, resourceKey, culture);
            return string.IsNullOrWhiteSpace(coreValue) ? null : coreValue;
        }
    }
}
