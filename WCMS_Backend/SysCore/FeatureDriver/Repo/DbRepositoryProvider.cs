using System.Collections.Concurrent;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.Interface;

namespace WCMS.SysCore.FeatureDriver.Repo;

/// <summary>
/// 依 DB Model 型別動態解析並快取 Repository。
/// </summary>
public class DbRepositoryProvider(IServiceProvider provider) 
{
    #region Property
    private readonly IServiceProvider _provider = provider;
    private readonly ConcurrentDictionary<Type, object> _cache = new();
    #endregion

    #region Public
    /// <summary>
    /// 取得指定 DB Model 的 Repository。
    /// </summary>
    public BasicRepository<TDbModel> GetRepo<TDbModel>() where TDbModel : DbModel
    {
        return (BasicRepository<TDbModel>)GetRepo(typeof(TDbModel));
    }
    /// <summary>
    /// 依型別取得指定 DB Model 的 Repository。
    /// </summary>
    public object GetRepo(Type dbModelType)
    {
        ValidateDbModelType(dbModelType);
        return _cache.GetOrAdd(dbModelType, ResolveRepo);
    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查型別是否為 DB Model。
    /// </summary>
    private static void ValidateDbModelType(Type dbModelType)
    {
        if (typeof(DbModel).IsAssignableFrom(dbModelType)) return;
        throw new InvalidOperationException($"Repository model must inherit DbModel: {dbModelType.FullName}");
    }
    /// <summary>
    /// 從 DI 解析指定型別的 Repository。
    /// </summary>
    private object ResolveRepo(Type dbModelType)
    {
        Type repoType = typeof(BasicRepository<>).MakeGenericType(dbModelType);
        return _provider.GetRequiredService(repoType);
    }
    #endregion
}
