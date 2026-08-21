using WCMS.SysCore.FeatureDriver.Biz.Operations.Write.Keys;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Form;
using WCMS.SysCore.FeatureDriver.Repo.Graph;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Write;

/// <summary>
/// 協調 Form Aggregate Root 與 Detail / SubDetail 的 Repository 寫入。
/// </summary>
internal sealed class FormWriteOperations<TFormModel>(
    FormGraphRepoScope<TFormModel> graphRepo,
    FormGraphCollector<TFormModel> graphCollector,
    FormAggregateSynchronizer<TFormModel> aggregateSynchronizer,
    FormAggregateKeyCoordinator<TFormModel> keyCoordinator,
    FormLifecycleFieldApplier<TFormModel> lifecycleFieldApplier,
    Func<Type, object> repoResolver)
    where TFormModel : class
{
    #region Property
    private FormGraphRepoScope<TFormModel> GraphRepo { get; } = graphRepo;
    private FormGraphCollector<TFormModel> GraphCollector { get; } = graphCollector;
    private FormAggregateSynchronizer<TFormModel> AggregateSynchronizer { get; } = aggregateSynchronizer;
    private FormAggregateKeyCoordinator<TFormModel> KeyCoordinator { get; } = keyCoordinator;
    private FormLifecycleFieldApplier<TFormModel> LifecycleFieldApplier { get; } = lifecycleFieldApplier;
    private Func<Type, object> RepoResolver { get; } = repoResolver;
    #endregion

    #region Internal
    /// <summary>
    /// 建立 Form Aggregate Root 與所有 Detail / SubDetail。
    /// </summary>
    internal async Task CreateAsync(TFormModel data, CancellationToken ct = default)
    {
        DbModel rootModel = FormModelMetadataResolver.GetRootModel(data);
        await ((dynamic)GraphRepo.RootRepo).CreateAsync((dynamic)rootModel, ct);
        foreach (object item in GraphCollector.CollectDetailItems(data)) await ((dynamic)ResolveRepo(item.GetType())).CreateAsync((dynamic)item, ct);
    }
    /// <summary>
    /// 更新 Form Aggregate Root 與所有 Detail / SubDetail。
    /// </summary>
    internal async Task UpdateAsync(TFormModel oldData, TFormModel newData, CancellationToken ct = default)
    {
        KeyCoordinator.PreserveExistingKeys(oldData, newData);
        LifecycleFieldApplier.PreserveCreateInfo(oldData, newData);
        DbModel oldRoot = FormModelMetadataResolver.GetRootModel(oldData);
        DbModel newRoot = FormModelMetadataResolver.GetRootModel(newData);
        await ((dynamic)GraphRepo.RootRepo).UpdateAsync((dynamic)oldRoot, (dynamic)newRoot, ct);
        await AggregateSynchronizer.SyncAsync(oldData, newData, ct);
    }
    /// <summary>
    /// 刪除 Form Aggregate Detail / SubDetail 與 Root。
    /// </summary>
    internal async Task DeleteAsync(TFormModel oldData, CancellationToken ct = default)
    {
        IEnumerable<object> items = GraphCollector.CollectDetailItems(oldData).AsEnumerable().Reverse();
        foreach (object item in items) await ((dynamic)ResolveRepo(item.GetType())).DeleteAsync((dynamic)item, ct);
        DbModel rootModel = FormModelMetadataResolver.GetRootModel(oldData);
        await ((dynamic)GraphRepo.RootRepo).DeleteAsync((dynamic)rootModel, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 取得目前 Graph 內指定 Entity 的 Repository。
    /// </summary>
    private object ResolveRepo(Type modelType)
    {
        return RepoResolver(modelType);
    }
    #endregion
}
