using System.Reflection;

namespace WCMS.SysCore.Library
{
    public static class I18nModelHelper
    {
        public static Dictionary<string, string> GetLocalizedDescriptions<T>()
        {
            var result = new Dictionary<string, string>();
            var props = PropertyAccessorCache.GetProperties(typeof(T));

            foreach (var prop in props)
            {
                var attr = prop.GetCustomAttribute<LibDescAttribute>();
                if (attr != null)
                {
                    attr.SetResourceKey(prop.Name);
                    result[prop.Name] = attr.Description;
                }
            }
            return result;
        }
    }
    public static class I18nCache
    {
        private static readonly Dictionary<Type, Dictionary<string, string>> _cache = [];
        public static Dictionary<string, string> GetLabels<T>()
        {
            var type = typeof(T);
            if (_cache.TryGetValue(type, out var result)) return result;
            var labels = I18nModelHelper.GetLocalizedDescriptions<T>();
            _cache[type] = labels;
            return labels;
        }
        public static void ClearCache<T>() => _cache.Remove(typeof(T));
    }
}
