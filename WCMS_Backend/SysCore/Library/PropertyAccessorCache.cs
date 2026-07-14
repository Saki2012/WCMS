using System.Linq.Expressions;
using System.Reflection;
using WCMS.SysCore.PlatformServices.Cache;

namespace WCMS.SysCore.Library;

/// <summary>
/// 管理動態物件 Constructor、Getter 與 Setter Delegate 的 Runtime Cache。
/// </summary>
public sealed class PropertyAccessorCache : LibCacheBase
{
    #region Property
    /// <summary>
    /// Property Accessor Cache 的區域名稱。
    /// </summary>
    private const string CacheRegionName = "property-accessor";
    /// <summary>
    /// Constructor Delegate 的 Cache Key 類型。
    /// </summary>
    private const string ConstructorKey = "constructor";
    /// <summary>
    /// Getter Delegate 的 Cache Key 類型。
    /// </summary>
    private const string GetterKey = "getter";
    /// <summary>
    /// Setter Delegate 的 Cache Key 類型。
    /// </summary>
    private const string SetterKey = "setter";
    /// <summary>
    /// Runtime Delegate 使用的 Local Process Lifetime 設定。
    /// </summary>
    private static readonly CacheOptions RuntimeOptions = new()
    {
        Mode = CacheMode.LocalOnly,
        ExpirationStrategy = CacheExpirationStrategy.ProcessLifetime,
    };
    /// <summary>
    /// 取得 Property Accessor 使用的 Cache 區域名稱。
    /// </summary>
    protected override string CacheRegion => CacheRegionName;
    #endregion

    #region Public
    /// <summary>
    /// 初始化 Property Accessor Cache。
    /// </summary>
    public PropertyAccessorCache(CacheService cacheService) : base(cacheService)
    {
    }
    /// <summary>
    /// 建立指定型別的物件實例。
    /// </summary>
    public object CreateInstance(Type type)
    {
        string key = BuildCacheKey(ConstructorKey, GetTypeCacheKey(type));
        Func<object> constructor = GetOrCreateLocal(key, RuntimeOptions, () => BuildConstructor(type))
            ?? throw new InvalidOperationException($"Cannot build constructor cache: {type.FullName}");
        return constructor();
    }
    /// <summary>
    /// 建立指定泛型型別的物件實例。
    /// </summary>
    public T CreateInstance<T>()
    {
        return (T)CreateInstance(typeof(T));
    }
    /// <summary>
    /// 取得指定物件的 Property 值。
    /// </summary>
    public object Get(object target, string propertyName)
    {
        Type type = target.GetType();
        string key = BuildCacheKey(GetterKey, GetTypeCacheKey(type));
        Dictionary<string, Func<object, object>> getters = GetOrCreateLocal(key, RuntimeOptions, () => BuildGetterMap(type))
            ?? throw new InvalidOperationException($"Cannot build getter cache: {type.FullName}");
        return getters.TryGetValue(propertyName, out Func<object, object>? getter)
            ? getter(target)
            : throw new KeyNotFoundException($"Property {propertyName} not found.");
    }
    /// <summary>
    /// 設定指定物件的 Property 值。
    /// </summary>
    public void Set(object target, string propertyName, object value)
    {
        Type type = target.GetType();
        string key = BuildCacheKey(SetterKey, GetTypeCacheKey(type));
        Dictionary<string, Action<object, object>> setters = GetOrCreateLocal(key, RuntimeOptions, () => BuildSetterMap(type))
            ?? throw new InvalidOperationException($"Cannot build setter cache: {type.FullName}");
        if (setters.TryGetValue(propertyName, out Action<object, object>? setter))
        {
            setter(target, value);
            return;
        }
        throw new KeyNotFoundException($"Property {propertyName} not found or not writable.");
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立指定型別的無參數 Constructor Delegate。
    /// </summary>
    private static Func<object> BuildConstructor(Type type)
    {
        ConstructorInfo constructor = type.GetConstructor(Type.EmptyTypes)
            ?? throw new InvalidOperationException($"Public parameterless constructor not found: {type.FullName}");
        NewExpression expression = Expression.New(constructor);
        return Expression.Lambda<Func<object>>(expression).Compile();
    }
    /// <summary>
    /// 建立指定型別的 Getter Delegate 對照表。
    /// </summary>
    private static Dictionary<string, Func<object, object>> BuildGetterMap(Type type)
    {
        var result = new Dictionary<string, Func<object, object>>();
        foreach (PropertyInfo property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (!property.CanRead) continue;
            result[property.Name] = BuildGetter(type, property);
        }
        return result;
    }
    /// <summary>
    /// 建立指定 Property 的 Getter Delegate。
    /// </summary>
    private static Func<object, object> BuildGetter(Type type, PropertyInfo property)
    {
        ParameterExpression target = Expression.Parameter(typeof(object), "target");
        UnaryExpression castTarget = Expression.Convert(target, type);
        MemberExpression access = Expression.Property(castTarget, property);
        UnaryExpression castResult = Expression.Convert(access, typeof(object));
        return Expression.Lambda<Func<object, object>>(castResult, target).Compile();
    }
    /// <summary>
    /// 建立指定型別的 Setter Delegate 對照表。
    /// </summary>
    private static Dictionary<string, Action<object, object>> BuildSetterMap(Type type)
    {
        var result = new Dictionary<string, Action<object, object>>();
        foreach (PropertyInfo property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (!property.CanWrite) continue;
            result[property.Name] = BuildSetter(type, property);
        }
        return result;
    }
    /// <summary>
    /// 建立指定 Property 的 Setter Delegate。
    /// </summary>
    private static Action<object, object> BuildSetter(Type type, PropertyInfo property)
    {
        MethodInfo setter = property.GetSetMethod()
            ?? throw new InvalidOperationException($"Public setter not found: {type.FullName}.{property.Name}");
        ParameterExpression target = Expression.Parameter(typeof(object), "target");
        ParameterExpression value = Expression.Parameter(typeof(object), "value");
        UnaryExpression castTarget = Expression.Convert(target, type);
        UnaryExpression castValue = Expression.Convert(value, property.PropertyType);
        MethodCallExpression call = Expression.Call(castTarget, setter, castValue);
        return Expression.Lambda<Action<object, object>>(call, target, value).Compile();
    }
    /// <summary>
    /// 建立可跨 Assembly 區分的型別 Cache Key。
    /// </summary>
    private static string GetTypeCacheKey(Type type)
    {
        return type.AssemblyQualifiedName ?? type.FullName ?? type.Name;
    }
    #endregion
}
