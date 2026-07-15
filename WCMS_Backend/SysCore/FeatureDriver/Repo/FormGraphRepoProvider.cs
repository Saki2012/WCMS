using System.Collections.Concurrent;

namespace WCMS.SysCore.FeatureDriver.Repo;

/// <summary>
/// 在目前 DI Scope 內建立並保存 Form Model 對應的 Graph Repository Scope。
/// </summary>
public class FormGraphRepoProvider(DbRepositoryProvider dbRepositoryProvider) 
{
    #region Property
    private readonly DbRepositoryProvider _dbRepositoryProvider = dbRepositoryProvider;
    private readonly ConcurrentDictionary<Type, object> _scopes = new();
    #endregion

    #region Public
    /// <summary>
    /// 取得指定 Form Model 的 Graph Repository Scope。
    /// </summary>
    public FormGraphRepoScope<TFormModel> GetScope<TFormModel>() where TFormModel : class
    {
        object scope = _scopes.GetOrAdd(typeof(TFormModel), _ => new FormGraphRepoScope<TFormModel>(_dbRepositoryProvider));
        return (FormGraphRepoScope<TFormModel>)scope;
    }
    #endregion
}
