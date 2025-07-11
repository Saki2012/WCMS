using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Reflection;

namespace WCMS.SysCore.Library
{
    /// <summary>
    /// 單一快取表
    /// </summary>
    public static class PropertyAccessorCache
    {
        private static readonly ConcurrentDictionary<Type, Func<object>> _constructorCache = new();
        private static readonly ConcurrentDictionary<Type, Dictionary<string, Func<object, object>>> _getterCache = new();
        private static readonly ConcurrentDictionary<Type, Dictionary<string, Action<object, object>>> _setterCache = new();
        private static readonly ConcurrentDictionary<Type, PropertyInfo[]> _propertyCache = new();

        public static object CreateInstance(Type type)
        {
            var ctor = _constructorCache.GetOrAdd(type, t =>
            {
                var ctorInfo = t.GetConstructor(Type.EmptyTypes);
                var newExpr = Expression.New(ctorInfo);
                return Expression.Lambda<Func<object>>(newExpr).Compile();
            });
            return ctor();
        }

        public static object Get(object target, string propertyName)
        {
            var type = target.GetType();
            var getters = _getterCache.GetOrAdd(type, BuildGetterMap);
            return getters.TryGetValue(propertyName, out var getter) ? getter(target) : throw new KeyNotFoundException($"Property {propertyName} not found.");
        }

        public static PropertyInfo[] GetProperties(Type type)
        {
            return _propertyCache.GetOrAdd(type, t => t.GetProperties());
        }
        public static void Set(object target, string propertyName, object value)
        {
            var type = target.GetType();
            var setters = _setterCache.GetOrAdd(type, BuildSetterMap);
            if (setters.TryGetValue(propertyName, out var setter))
            {
                setter(target, value);
            }
            else
            {
                throw new KeyNotFoundException($"Property {propertyName} not found or not writable.");
            }
        }
        
        private static Dictionary<string, Func<object, object>> BuildGetterMap(Type type)
        {
            var dict = new Dictionary<string, Func<object, object>>();
            foreach (var prop in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                if (!prop.CanRead) continue;

                var param = Expression.Parameter(typeof(object), "target");
                var castedTarget = Expression.Convert(param, type);
                var propertyAccess = Expression.Property(castedTarget, prop);
                var castResult = Expression.Convert(propertyAccess, typeof(object));

                var lambda = Expression.Lambda<Func<object, object>>(castResult, param).Compile();
                dict[prop.Name] = lambda;
            }
            return dict;
        }
        private static Dictionary<string, Action<object, object>> BuildSetterMap(Type type)
        {
            var dict = new Dictionary<string, Action<object, object>>();
            foreach (var prop in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                if (!prop.CanWrite) continue;
                var targetParam = Expression.Parameter(typeof(object), "target");
                var valueParam = Expression.Parameter(typeof(object), "value");
                var castTarget = Expression.Convert(targetParam, type);
                var castValue = Expression.Convert(valueParam, prop.PropertyType);
                var propertySetter = Expression.Call(castTarget, prop.GetSetMethod(), castValue);
                var lambda = Expression.Lambda<Action<object, object>>(propertySetter, targetParam, valueParam).Compile();
                dict[prop.Name] = lambda;
            }
            return dict;
        }
    }
}
