using System.Collections;
using System.Collections.Concurrent;
using System.Reflection;
using WCMS.SysCore.Interface;

namespace WCMS.SysCore
{
    public class RepositoryMapProvider(IServiceProvider provider) : IRepositoryMapProvider
    {
        #region Property
        private readonly IServiceProvider _provider = provider;
        private readonly ConcurrentDictionary<Type, Dictionary<string, object>> _cache = new();
        #endregion

        #region Public
        public Dictionary<string, object> GetRepoDict<TSet>() where TSet : class
        {
            return _cache.GetOrAdd(typeof(TSet), _ =>
            {
                var dict = new Dictionary<string, object>();
                foreach (var prop in typeof(TSet).GetProperties(BindingFlags.Public | BindingFlags.Instance))
                {
                    Type modelType = GetPropertyModelType(prop);
                    if (modelType == null) continue;

                    var repoType = typeof(IBasicRepository<>).MakeGenericType(modelType);
                    var repo = _provider.GetRequiredService(repoType); // Scoped安全使用

                    if(prop.PropertyType.IsGenericType) dict[prop.PropertyType.GetGenericArguments().FirstOrDefault().Name] = repo;
                    else dict[prop.PropertyType.Name] = repo;
                }
                return dict;
            });
        }
        public object EnsureRepo<TSet>(Type modelType) where TSet : class
        {
            var dict = GetOrCreateDict<TSet>();
            var key = modelType.Name;

            if (!dict.TryGetValue(key, out var repo))
            {
                var repoType = typeof(IBasicRepository<>).MakeGenericType(modelType);
                repo = _provider.GetRequiredService(repoType);
                dict[key] = repo;
            }
            return repo;
        }
        #endregion

        #region Private
        private Dictionary<string, object> GetOrCreateDict<TSet>() where TSet : class => _cache.GetOrAdd(typeof(TSet), _ => GetRepoDict<TSet>());
        private Type? GetPropertyModelType(PropertyInfo prop)
        {
            if (typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && prop.PropertyType != typeof(string))
                return prop.PropertyType.GetGenericArguments().FirstOrDefault();
            else if (prop.PropertyType.IsClass && prop.PropertyType != typeof(string))
                return prop.PropertyType;
            return null;
        }
        #endregion
    }
}
