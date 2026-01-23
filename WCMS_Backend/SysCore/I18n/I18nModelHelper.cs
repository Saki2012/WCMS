using System.Collections.Concurrent;
using System.Globalization;
using System.Linq.Expressions;
using System.Reflection;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SysCore.I18n
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
        private static readonly ConcurrentDictionary<string, string> _cache = new();
        private static string CultureKey => CultureInfo.CurrentUICulture.Name;
        private static string TypeKey(Type type) => $"{CultureKey}|T:{type.FullName}";
        private static string PropKey(PropertyInfo prop) => $"{CultureKey}|P:{prop.DeclaringType?.FullName}.{prop.Name}";
        public static string GetLabel<T>() => GetLabel(typeof(T));
        public static string GetLabel<T>(Expression<Func<T, object>> selector)
        {
            MemberExpression? member = selector.Body as MemberExpression;
            if (member == null && selector.Body is UnaryExpression u && u.Operand is MemberExpression m) member = m;
            if (member?.Member is PropertyInfo prop) return GetLabel(prop);
            return GetLabel(typeof(T));
        }
        public static string GetLabel(Type type) => _cache.GetOrAdd(TypeKey(type), _ => I18nModelHelper.GetLocalizedDescription(type));
        public static string GetLabel(PropertyInfo prop) => _cache.GetOrAdd(PropKey(prop), _ => I18nModelHelper.GetLocalizedDescription(prop));
    }
}
