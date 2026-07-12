using System.Collections.Concurrent;
using WCMS.SysCore.Interface;

namespace WCMS.SysCore.FeatureDriver.Repo;

/// <summary>
/// 建立並快取 Form Model 對應的 Graph Repository Scope。
/// </summary>
public class FormGraphRepoProvider(DbRepositoryProvider dbRepositoryProvider) 
{
    #region Property
    private readonly DbRepositoryProvider _dbRepositoryProvider = dbRepositoryProvider;
    private readonly ConcurrentDictionary<Type, object> _cache = new();
    #endregion

    #region Public
    /// <summary>
    /// 取得指定 Form Model 的 Graph Repository Scope。
    /// </summary>
    public IFormGraphRepoScope<TFormModel> GetScope<TFormModel>() where TFormModel : class
    {
        object scope = _cache.GetOrAdd(typeof(TFormModel), _ => new FormGraphRepoScope<TFormModel>(_dbRepositoryProvider));
        return (IFormGraphRepoScope<TFormModel>)scope;
    }
    #endregion
}
