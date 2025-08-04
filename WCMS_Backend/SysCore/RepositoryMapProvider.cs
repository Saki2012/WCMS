using System.Collections;
using System.Collections.Concurrent;
using System.Reflection;
using WCMS.SysCore.Interface;

namespace WCMS.SysCore
{
    public class RepositoryMapProvider : IRepositoryMapProvider
    {
        private readonly IServiceProvider _provider;
        private readonly ConcurrentDictionary<Type, Dictionary<string, object>> _cache = new();


        public RepositoryMapProvider(IServiceProvider provider)
        {
            _provider = provider;
        }

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
        private Type? GetPropertyModelType(PropertyInfo prop)
        {
            if (typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && prop.PropertyType != typeof(string))
                return prop.PropertyType.GetGenericArguments().FirstOrDefault();
            else if (prop.PropertyType.IsClass && prop.PropertyType != typeof(string))
                return prop.PropertyType;
            return null;
        }
    }
}
