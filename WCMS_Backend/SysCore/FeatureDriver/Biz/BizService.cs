using System.Collections;
using System.Reflection;
using WCMS.Features._Resx;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Biz.Operations.Query;
using WCMS.SysCore.FeatureDriver.Biz.Operations.Write;
using WCMS.SysCore.FeatureDriver.Biz.Operations.Write.Keys;
using WCMS.SysCore.FeatureDriver.Biz.Transactions;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.FeatureDriver.Model.Form;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Repo.Graph;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
using static WCMS.SysCore.FeatureDriver.Model.Contracts.QueryListParam;
namespace WCMS.SysCore.FeatureDriver.Biz;

/// <summary>
/// Form Aggregate 的 Biz 對外 Facade 與 Feature Hook 入口。
/// </summary>
public class BizService<TFormModel> : BizBase
    where TFormModel : class
{
    #region Property
    /// <summary>
    /// 資料表 Repository 字典，保留既有 Feature Biz 相容入口。
    /// </summary>
    protected Dictionary<string, object> RepoDict { get; }
    /// <summary>
    /// 目前表單 Graph CUD 使用的 Repository Scope。
    /// </summary>
    protected FormGraphRepoScope<TFormModel> GraphRepo { get; }
    /// <summary>
    /// 目前表單對應的 Root Entity 型別。
    /// </summary>
    protected Type RootDbModelType => GraphRepo.RootDbModelType;
    private string? _progId;
    /// <summary>
    /// 功能 Id。
    /// </summary>
    public string ProgId
    {
        get
        {
            _progId ??= GetType()
                .GetCustomAttribute<LibBizAttribute>(inherit: true)?
                .ProgId;
            return _progId;
        }
    }
    private string _prefix = string.Empty;
    /// <summary>
    /// 流水編號前綴碼。
    /// </summary>
    public string PrefixId
    {
        get
        {
            if (_prefix == string.Empty) PrefixId = ProgId;
            return _prefix;
        }
        protected set
        {
            _prefix = ResolvePrefix(value);
        }
    }
    /// <summary>
    /// 是否自動建立字串業務主鍵。
    /// </summary>
    protected virtual bool IsAutoGenerateId { get; set; } = true;
    /// <summary>
    /// 網站預設語系。
    /// </summary>
    protected LangCode SiteDefaultLang { get; set; } = LangCode.zhtw;
    /// <summary>
    /// 本次執行有效語系。
    /// </summary>
    protected LangCode EffectiveLang { get; set; } = LangCode.zhtw;
    private FormGraphCollector<TFormModel> GraphCollector { get; }
    private FormQueryOperations<TFormModel> QueryOperations { get; }
    private FormWriteOperations<TFormModel> WriteOperations { get; }
    private FormLifecycleFieldApplier<TFormModel> LifecycleFieldApplier { get; }
    private FormAggregateKeyCoordinator<TFormModel> KeyCoordinator { get; }
    private BizTransactionExecutor TransactionExecutor { get; }
    #endregion

    #region Construct
    /// <summary>
    /// 建立目前 Form Aggregate 的 Biz Facade 與內部 Operations。
    /// </summary>
    public BizService(BizDeps bizDeps) : base(bizDeps)
    {
        GraphRepo = bizDeps.formGraphRepoProvider.GetScope<TFormModel>();
        RepoDict = GraphRepo.GraphRepos.ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal);
        GraphCollector = CreateGraphCollector();
        LifecycleFieldApplier = new FormLifecycleFieldApplier<TFormModel>(() => OperateUser, PropertyAccessor);
        KeyCoordinator = CreateKeyCoordinator();
        WriteOperations = CreateWriteOperations();
        QueryOperations = CreateQueryOperations();
        TransactionExecutor = new BizTransactionExecutor(GraphRepo.DataAccess, Message);
    }
    #endregion

    #region Public
    /// <summary>
    /// 初始化多筆 Form Model。
    /// </summary>
    public async Task BizInitCreateDatasAsync(TFormModel[] datas, CancellationToken ct = default)
    {
        await ExecTransactionAsync(
            token => CreateInitialDataBatchAsync(datas, token),
            async token =>
            {
                await AfterSaveChanges(FuncAction.Create, token);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00002);
            },
            ct);
    }
    /// <summary>
    /// 新增 Form Aggregate。
    /// </summary>
    public async Task<TFormModel> BizCreateDataAsync(TFormModel data, CancellationToken ct = default)
    {
        return await ExecTransactionAsync(token => CreateInTransactionAsync(data, token), async (_, token) =>
            {
                await AfterSaveChanges(FuncAction.Create, token);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00002);
            }, ct);
    }
    /// <summary>
    /// 修改 Form Aggregate。
    /// </summary>
    public async Task<TFormModel> BizUpdateDataAsync(string internalId, TFormModel newData, CancellationToken ct = default)
    {
        return await ExecTransactionAsync(token => UpdateInTransactionAsync(internalId, newData, token), async (_, token) =>
            {
                await AfterSaveChanges(FuncAction.Update, token);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00006);
            }, ct);
    }
    /// <summary>
    /// 刪除 Form Aggregate。
    /// </summary>
    public async Task<TFormModel> BizDeleteDataAsync(string internalId, CancellationToken ct = default)
    {
        return await ExecTransactionAsync(token => DeleteInTransactionAsync(internalId, token), async (_, token) =>
            {
                await AfterSaveChanges(FuncAction.Delete, token);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00004);
            }, ct);
    }
    /// <summary>
    /// 作廢或恢復 Form Aggregate。
    /// </summary>
    public async Task<TFormModel> BizInvalidDataAsync(string internalId, bool status, CancellationToken ct = default)
    {
        return await ExecTransactionAsync(
            token => InvalidInTransactionAsync(internalId, status, token),
            async (_, token) =>
            {
                await AfterSaveChanges(FuncAction.Update, token);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00008);
            },
            ct);
    }
    /// <summary>
    /// 查詢單筆 Form Aggregate。
    /// </summary>
    public async Task<TFormModel> BizQueryDataAsync(string internalId, CancellationToken ct = default)
    {
        return await QueryOperations.QueryDataAsync(internalId, ct);
    }
    /// <summary>
    /// 依查詢參數取得 Form Aggregate 清單。
    /// </summary>
    public async Task<IList<TFormModel>> BizQueryListAsync(QueryListParam param, CancellationToken ct = default)
    {
        return await BizQueryListAsync(param.Fields, param.Condition, param.OrderBy, param.RankGroups, param.PageNumber, param.PageSize, ct);
    }
    /// <summary>
    /// 查詢 Form Aggregate 清單。
    /// </summary>
    public async Task<IList<TFormModel>> BizQueryListAsync(
        string[] selectFields,
        string condition,
        IReadOnlyList<OrderBySpec>? orderBy = null,
        IReadOnlyList<RankGroupsSpec>? rankGroups = null,
        int pageNumber = 0,
        int pageSize = 0,
        CancellationToken ct = default)
    {
        return await QueryOperations.QueryListAsync(selectFields, condition, orderBy, rankGroups, pageNumber, pageSize, ct);
    }
    /// <summary>
    /// 取得符合條件的總筆數。
    /// </summary>
    public async Task<int> BizQueryTotalCounts(string condition, CancellationToken ct = default)
    {
        return await QueryOperations.QueryTotalCountAsync(condition, ct);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 建立 Form Aggregate Root 與所有 Detail / SubDetail。
    /// </summary>
    protected async Task DoCreateAsync(TFormModel data, CancellationToken ct = default)
    {
        await WriteOperations.CreateAsync(data, ct);
    }
    /// <summary>
    /// 更新 Form Aggregate Root 與所有 Detail / SubDetail。
    /// </summary>
    protected async Task DoUpdateAsync(TFormModel oldData, TFormModel newData, CancellationToken ct = default)
    {
        await WriteOperations.UpdateAsync(oldData, newData, ct);
    }
    /// <summary>
    /// 刪除 Form Aggregate Root 與所有 Detail / SubDetail。
    /// </summary>
    protected async Task DoDeleteAsync(TFormModel oldData, CancellationToken ct = default)
    {
        await WriteOperations.DeleteAsync(oldData, ct);
    }
    /// <summary>
    /// 查詢單筆 Form Aggregate。
    /// </summary>
    protected async Task<TFormModel> DoQueryDataAsync(string internalId, CancellationToken ct = default)
    {
        return await QueryOperations.QueryDataAsync(internalId, ct);
    }
    /// <summary>
    /// 依 Entity 型別查詢清單資料。
    /// </summary>
    protected async Task<IList> DoQueryListAsync<TModel>(
        string[] selectFields,
        string queryCondition,
        IReadOnlyList<OrderBySpec>? orderBy,
        int pageCt,
        int takeCt,
        int skipCt = 0,
        string? detailFilterCondition = null,
        IReadOnlyList<RankGroupsSpec>? detailRankGroups = null,
        CancellationToken ct = default)
    {
        return await DoQueryListAsync(typeof(TModel), selectFields, queryCondition, orderBy, pageCt, takeCt, skipCt, detailFilterCondition, detailRankGroups, ct);
    }
    /// <summary>
    /// 依 Property 型別查詢清單資料。
    /// </summary>
    protected async Task<IList> DoQueryListAsync(
        PropertyInfo property,
        string[] selectFields,
        string queryCondition,
        IReadOnlyList<OrderBySpec>? orderBy,
        int pageCt,
        int takeCt,
        int skipCt = 0,
        string? detailFilterCondition = null,
        IReadOnlyList<RankGroupsSpec>? detailRankGroups = null,
        CancellationToken ct = default)
    {
        return await DoQueryListAsync(property.PropertyType, selectFields, queryCondition, orderBy, pageCt, takeCt, skipCt, detailFilterCondition, detailRankGroups, ct);
    }
    /// <summary>
    /// 建立 RepositoryQueryOptions 並查詢清單資料。
    /// </summary>
    protected async Task<IList> DoQueryListAsync(
        Type type,
        string[] selectFields,
        string queryCondition,
        IReadOnlyList<OrderBySpec>? orderBy,
        int pageCt,
        int takeCt,
        int skipCt = 0,
        string? detailFilterCondition = null,
        IReadOnlyList<RankGroupsSpec>? detailRankGroups = null,
        CancellationToken ct = default)
    {
        return await QueryOperations.QueryRawListAsync(type, selectFields, queryCondition, orderBy, pageCt, takeCt, skipCt, detailFilterCondition, detailRankGroups, ct);
    }
    /// <summary>
    /// 依 Entity 型別查詢總筆數。
    /// </summary>
    protected async Task<int> DoQueryListCountAsync<TModel>(string condition, CancellationToken ct = default)
    {
        return await DoQueryListCountAsync(typeof(TModel), condition, ct);
    }
    /// <summary>
    /// 查詢指定 Entity 的總筆數。
    /// </summary>
    protected async Task<int> DoQueryListCountAsync(Type type, string condition, CancellationToken ct = default)
    {
        return await QueryOperations.QueryCountAsync(type, condition, ct);
    }
    /// <summary>
    /// 設定作廢或恢復狀態。
    /// </summary>
    protected void DoInvalidSet(TFormModel data, bool isInvalid)
    {
        LifecycleFieldApplier.ApplyInvalid(data, isInvalid);
    }
    /// <summary>
    /// 設定修改使用者與時間。
    /// </summary>
    protected void SetModifyInfo(HeaderModel header)
    {
        LifecycleFieldApplier.ApplyModify(header);
    }
    /// <summary>
    /// 執行統一 Biz 交易骨架。
    /// </summary>
    protected async Task<TResult> ExecTransactionAsync<TResult>(Func<CancellationToken, Task<TResult>> inTransaction, Func<TResult, CancellationToken, Task>? afterCommit = null, CancellationToken ct = default)
    {
        return await TransactionExecutor.ExecuteAsync(inTransaction, afterCommit, ct);
    }
    /// <summary>
    /// 執行不需要回傳資料的統一 Biz 交易骨架。
    /// </summary>
    protected async Task ExecTransactionAsync(Func<CancellationToken, Task> inTransaction, Func<CancellationToken, Task>? afterCommit = null, CancellationToken ct = default)
    {
        await TransactionExecutor.ExecuteAsync(inTransaction, afterCommit, ct);
    }
    #endregion

    #region Protected virtual
    /// <summary>
    /// 保存前 Feature Hook。
    /// </summary>
    protected virtual Task BeforeUpdate(TFormModel set, FuncAction action, CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }
    /// <summary>
    /// Repository 寫入後、Commit 前 Feature Hook。
    /// </summary>
    protected virtual Task AfterUpdate(TFormModel? oldSet, TFormModel? newSet, FuncAction action, TransStatus status, CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }
    /// <summary>
    /// SaveChanges 與 Commit 後 Feature Hook。
    /// </summary>
    protected virtual Task AfterSaveChanges(FuncAction action, CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }
    /// <summary>
    /// 檢查資料是否已被其他功能使用；不可刪除時應加入錯誤訊息。
    /// </summary>
    protected virtual Task CheckIsUsedAsync(TFormModel data, CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }
    /// <summary>
    /// 作廢後 Feature Hook。
    /// </summary>
    protected virtual void AfterInvalid(TFormModel set, bool status)
    {
    }
    /// <summary>
    /// 目前功能固定套用的 Root 資料範圍。
    /// </summary>
    protected virtual string DataScopeCondition => string.Empty;
    #endregion

    #region Private
    /// <summary>
    /// 在同一交易內建立整批初始化資料。
    /// </summary>
    private async Task CreateInitialDataBatchAsync(IEnumerable<TFormModel> datas, CancellationToken ct)
    {
        foreach (TFormModel data in datas)
        {
            HeaderModel header = GraphCollector.GetHeader(data);
            header.IsIniData = true;
            await CreateInTransactionAsync(data, ct);
            if (Message.HasError) return;
        }
    }
    /// <summary>
    /// 執行新增交易內流程。
    /// </summary>
    private async Task<TFormModel> CreateInTransactionAsync(TFormModel data, CancellationToken ct)
    {
        HeaderModel header = GraphCollector.GetHeader(data);
        IReadOnlyList<IList> detailLists = GraphCollector.CollectDetailCollections(data);
        LifecycleFieldApplier.ApplyCreate(header);
        await KeyCoordinator.PrepareAsync(header, detailLists, ct);
        await BeforeUpdate(data, FuncAction.Create, ct);
        if (Message.HasError) return data;
        await DoCreateAsync(data, ct);
        await AfterUpdate(default, data, FuncAction.Create, TransStatus.Increase, ct);
        return data;
    }
    /// <summary>
    /// 執行修改交易內流程。
    /// </summary>
    private async Task<TFormModel> UpdateInTransactionAsync(string internalId, TFormModel newData, CancellationToken ct)
    {
        TFormModel oldData = await DoQueryDataAsync(internalId, ct);
        EnsureDataExists(oldData);
        HeaderModel header = GraphCollector.GetHeader(newData);
        IReadOnlyList<IList> newDetailLists =
            GraphCollector.CollectDetailCollections(newData);
        IReadOnlyList<IList> oldDetailLists =
            GraphCollector.CollectDetailCollections(oldData);
        SetModifyInfo(header);
        await KeyCoordinator.PrepareAsync(header, newDetailLists, oldDetailLists, ct);
        await BeforeUpdate(newData, FuncAction.Update, ct);
        if (Message.HasError) return newData;
        TFormModel snapshot = oldData.Snapshot();
        await DoUpdateAsync(oldData, newData, ct);
        await AfterUpdate(snapshot, oldData, FuncAction.Update, TransStatus.Difference, ct);
        return Message.HasError ? newData : oldData;
    }
    /// <summary>
    /// 執行刪除交易內流程。
    /// </summary>
    private async Task<TFormModel> DeleteInTransactionAsync(string internalId, CancellationToken ct)
    {
        TFormModel oldData = await DoQueryDataAsync(internalId, ct);
        EnsureDataExists(oldData);
        await CheckIsUsedAsync(oldData, ct);
        if (Message.HasError) return oldData;
        TFormModel snapshot = oldData.Snapshot();
        await BeforeUpdate(oldData, FuncAction.Delete, ct);
        if (Message.HasError) return oldData;
        await DoDeleteAsync(oldData, ct);
        await AfterUpdate(snapshot, oldData, FuncAction.Delete, TransStatus.Difference, ct);
        return oldData;
    }
    /// <summary>
    /// 執行作廢或恢復交易內流程。
    /// </summary>
    private async Task<TFormModel> InvalidInTransactionAsync(string internalId, bool status, CancellationToken ct)
    {
        TFormModel oldData = await DoQueryDataAsync(internalId, ct);
        EnsureDataExists(oldData);
        TFormModel snapshot = oldData.Snapshot();
        TFormModel newData = oldData.Snapshot();
        DoInvalidSet(newData, status);
        await BeforeUpdate(oldData, FuncAction.Invalid, ct);
        if (Message.HasError) return newData;
        await DoUpdateAsync(oldData, newData, ct);
        await AfterUpdate(snapshot, oldData, FuncAction.Invalid, TransStatus.Difference, ct);
        return Message.HasError ? newData : oldData;
    }
    /// <summary>
    /// 建立 Graph Collector。
    /// </summary>
    private FormGraphCollector<TFormModel> CreateGraphCollector()
    {
        return new FormGraphCollector<TFormModel>(GraphRepo, ModelMetadata, PropertyAccessor);
    }
    /// <summary>
    /// 建立 Aggregate Key Coordinator。
    /// </summary>
    private FormAggregateKeyCoordinator<TFormModel> CreateKeyCoordinator()
    {
        return new FormAggregateKeyCoordinator<TFormModel>(RootDbModelType, GraphCollector, ModelMetadata, PropertyAccessor, ResolveRepo, () => PrefixId, () => IsAutoGenerateId);
    }
    /// <summary>
    /// 建立 Write Operations。
    /// </summary>
    private FormWriteOperations<TFormModel> CreateWriteOperations()
    {
        FormAggregateSynchronizer<TFormModel> synchronizer = new(GraphCollector, ModelMetadata, PropertyAccessor, ResolveRepo);
        return new FormWriteOperations<TFormModel>(GraphRepo, GraphCollector, synchronizer, KeyCoordinator, LifecycleFieldApplier, ResolveRepo);
    }
    /// <summary>
    /// 建立 Query Operations 與 Expression Builders。
    /// </summary>
    private FormQueryOperations<TFormModel> CreateQueryOperations()
    {
        FormConditionExpressionBuilder conditionBuilder = new(ModelMetadata);
        FormProjectionExpressionBuilder projectionBuilder = new(ModelMetadata, conditionBuilder);
        FormDefaultSelectFieldResolver<TFormModel> defaultSelectResolver = new(GraphRepo, ModelMetadata);
        return new FormQueryOperations<TFormModel>(
            GraphRepo,
            DbRepositoryProvider,
            ModelMetadata,
            PropertyAccessor,
            defaultSelectResolver,
            conditionBuilder,
            projectionBuilder,
            () => DataScopeCondition);
    }
    /// <summary>
    /// 取得目前 Graph 或全域 Entity Repository。
    /// </summary>
    private object ResolveRepo(Type modelType)
    {
        if (GraphRepo.ContainsRepo(modelType)) return GraphRepo.GetRepo(modelType);
        return DbRepositoryProvider.GetRepo(modelType);
    }
    /// <summary>
    /// 確認更新、刪除或作廢目標存在於目前資料範圍。
    /// </summary>
    private static void EnsureDataExists(TFormModel? data)
    {
        if (data != null) return;
        throw new BusinessException("查無資料，或資料不屬於目前功能範圍。");
    }
    /// <summary>
    /// 限制業務編號前綴長度。
    /// </summary>
    private static string ResolvePrefix(string value)
    {
        if (!string.IsNullOrEmpty(value) && value.Length > DbStrLen.ID - 11)
            return value[..(DbStrLen.ID - 11)];
        return value;
    }
    #endregion
}
