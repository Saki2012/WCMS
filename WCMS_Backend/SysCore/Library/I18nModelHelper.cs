using System.Linq.Expressions;
using System.Reflection;

namespace WCMS.SysCore.Library
{
    public static class I18nModelHelper
    {
        public static string GetLocalizedDescription(Type type)
        {
            var attr = type.GetCustomAttribute<LibDescAttribute>();
            return DoGetLocalizedDescription(type.Name, attr);
        }

        public static string GetLocalizedDescription(PropertyInfo prop)
        {
            var attr = prop.GetCustomAttribute<LibDescAttribute>();
            return DoGetLocalizedDescription(prop.Name, attr);
        }

        private static string DoGetLocalizedDescription(string name,LibDescAttribute attr)
        {
            string result = string.Empty;
            if (attr != null&& attr.Description.IsNullOrEmpty()) attr.SetResourceKey(name);
            result = attr?.Description;
            return result.IsNullOrEmpty()?$"[{name}]":result;
        }

    }
    public static class I18nCache
    {
        private static readonly Dictionary<string, string> _cache = [];
        //public static void ClearCache<T>() => _cache.Remove();

        public static string GetLabel<T>()
        {
            var type = typeof(T);
            if (_cache.TryGetValue(type.Name, out var result)) return result;
            var labels = I18nModelHelper.GetLocalizedDescription(type);
            _cache[type.Name] = labels;
            return labels;
        }
        public static string GetLabel<T>(Expression<Func<T,object>> selector)
        {
            MemberExpression? member = selector.Body as MemberExpression;
            if (member == null && selector.Body is UnaryExpression u && u.Operand is MemberExpression m) member = m;
            if (member?.Member is PropertyInfo prop) return GetLabel(prop);
            return GetLabel(typeof(T));
        }

        public static string GetLabel(Type type)
        {
            if (_cache.TryGetValue(type.Name, out var result)) return result;
            var labels = I18nModelHelper.GetLocalizedDescription(type);
            _cache[type.Name] = labels;
            return labels;
        }

        public static string GetLabel(PropertyInfo prop)
        {
            if (_cache.TryGetValue(prop.Name, out var result)) return result;
            var labels = I18nModelHelper.GetLocalizedDescription(prop);
            _cache[prop.Name] = labels;
            return labels;
        }
        
    }
}
