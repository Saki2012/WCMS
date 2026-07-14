using System.Collections;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using WCMS.Features._Resx;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.FeatureDriver.Model.Form;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Repo;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Persistence;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.FeatureDriver.Model.Contracts.QueryListParam;
namespace WCMS.SysCore.FeatureDriver.Biz;

/// <summary>
/// Biz服務本體
/// </summary>
/// <typeparam name="TFormModel"></typeparam>
public class BizService<TFormModel> : BizBase, IBizService<TFormModel> where TFormModel : IFormModel
{
    #region Property
    /// <summary>
    /// 資料表 Repository 字典。
    /// </summary>
    protected Dictionary<string, object> RepoDict { get; }
    /// <summary>
    /// 目前表單 Graph CUD 使用的 Repository Scope。
    /// </summary>
    protected FormGraphRepoScope<TFormModel> GraphRepo { get; }
    /// <summary>
    /// 目前表單對應的 Root DbModel 型別。
    /// </summary>
    protected Type RootDbModelType => GraphRepo.RootDbModelType;
    /// <summary>
    /// 
    /// </summary>
    private string? _ProgId = null;
    /// <summary>
    /// 功能Id
    /// </summary>
    public string ProgId { get { _ProgId ??= GetType().GetCustomAttribute<LibBizAttribute>(inherit: true)?.ProgId; return _ProgId; } }
    /// <summary>
    /// 流水編號前綴碼
    /// </summary>
    private string _Prifix = string.Empty;
    /// <summary>
    /// 流水編號前綴碼
    /// </summary>
    public string PrefixId
    {
        get
        {
            if (_Prifix == string.Empty) this.PrefixId = ProgId;
            return _Prifix;
        }
        protected set
        {
            if (!string.IsNullOrEmpty(value) && value.Length > DbStrLen.ID - 11)
                _Prifix = value.Substring(0, DbStrLen.ID - 11); // 最多 xxxyyyymmdd(八位) 個字
            else
                _Prifix = value;
        }
    }
    /// <summary>
    /// 是否自動創建主鍵
    /// </summary>
    protected virtual bool IsAutoGenerateId { get; set; } = true;
    /* LibMessage包*/
    /// <summary>
    /// 變更日誌系統
    /// </summary>
    //public SysChangeLog? SysChangeLog { get; }
    /// <summary>
    /// 
    /// </summary>
    private ApplicationDbContext DataAccess { get; }
    /// <summary>
    /// //網站預設語系(暫時寫死)
    /// </summary>
    protected LangCode SiteDefaultLang { get; set; } = LangCode.zhtw;
    /// <summary>
    /// 執行時語系(暫時寫死，為提供當前用戶語系的資料或是訊息)
    /// </summary>
    protected LangCode EffectiveLang { get; set; } = LangCode.zhtw;
    #endregion

    #region Construct
    public BizService(BizDeps bizDeps) : base(bizDeps)
    {
        //SysChangeLog = new SysChangeLog(repo.DataAccess);
        GraphRepo = bizDeps.formGraphRepoProvider.GetScope<TFormModel>();
        RepoDict = GraphRepo.GraphRepos.ToDictionary(p => p.Key, p => p.Value, StringComparer.Ordinal);
        DataAccess = GraphRepo.DataAccess;
    }
    #endregion

    #region Public
    /// <summary>
    /// 初始化多筆 Form Model。
    /// </summary>
    public async Task BizInitCreateDatasAsync(TFormModel[] datas, CancellationToken ct = default)
    {
        foreach (var data in datas)
        {
            if (FormModelMetadataResolver.GetRootModel(data) is HeaderModel header) header.IsIniData = true;
            await BizCreateDataAsync(data, ct);
        }
    }
    /// <summary>
    /// 新增 Form Model。
    /// </summary>
    public async Task<TFormModel> BizCreateDataAsync(TFormModel data, CancellationToken ct = default)
    {
        return await ExecTransactionAsync(
            async token =>
            {
                GetModelType(data, out HeaderModel header, out Dictionary<string, IList> details);
                SetCreateInfo(header);
                await AutoGenerateId(header, details);
                await BeforeUpdate(data, FuncAction.Create, token);
                if (Message.HasError) return data;
                await DoCreateAsync(data);
                await AfterUpdate(default, data, FuncAction.Create, TransStatus.Increase, token);
                return data;
            },
            async (_, token) =>
            {
                await AfterSaveChanges(FuncAction.Create, token);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00002);
            },
            ct);
    }
    /// <summary>
    /// 修改 Form Model。
    /// </summary>
    public async Task<TFormModel> BizUpdateDataAsync(string internalId, TFormModel newData, CancellationToken ct = default)
    {
        TFormModel oldData = default!;
        TFormModel oldDataSnapshot = default!;
        return await ExecTransactionAsync(
            async token =>
            {
                GetModelType(newData, out HeaderModel header, out Dictionary<string, IList> details);
                SetModifyInfo(header);
                await AutoGenerateId(header, details);
                await BeforeUpdate(newData, FuncAction.Update, token);
                if (Message.HasError) return newData;
                oldData = await DoQueryDataAsync(internalId);
                EnsureDataExists(oldData);
                oldDataSnapshot = oldData.Snapshot();
                await DoUpdateAsync(oldData, newData);
                await AfterUpdate(oldDataSnapshot, oldData, FuncAction.Update, TransStatus.Difference, token);
                return Message.HasError ? newData : oldData;
            },
            async (_, token) =>
            {
                await AfterSaveChanges(FuncAction.Update, token);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00006);
            },
            ct);
    }
    /// <summary>
    /// 刪除 Form Model。
    /// </summary>
    public async Task<TFormModel> BizDeleteDataAsync(string internalId, CancellationToken ct = default)
    {
        TFormModel oldData = default!;
        TFormModel oldDataSnapshot = default!;
        return await ExecTransactionAsync(
            async token =>
            {
                CheckIsUsed();
                oldData = await DoQueryDataAsync(internalId);
                EnsureDataExists(oldData);
                oldDataSnapshot = oldData.Snapshot();
                await BeforeUpdate(oldData, FuncAction.Delete, token);
                if (Message.HasError) return oldData;
                await DoDeleteAsync(oldData);
                await AfterUpdate(oldDataSnapshot, oldData, FuncAction.Delete, TransStatus.Difference, token);
                return oldData;
            },
            async (_, token) =>
            {
                await AfterSaveChanges(FuncAction.Delete, token);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00004);
            },
            ct);
    }
    /// <summary>
    /// 作廢 Form Model。
    /// </summary>
    public async Task<TFormModel> BizInvalidDataAsync(string internalId, bool status, CancellationToken ct = default)
    {
        TFormModel oldData = default!;
        TFormModel oldDataSnapshot = default!;
        TFormModel newData = default!;
        return await ExecTransactionAsync(
            async token =>
            {
                oldData = await DoQueryDataAsync(internalId);
                EnsureDataExists(oldData);
                oldDataSnapshot = oldData.Snapshot();
                newData = oldData.Snapshot();
                DoInvalidSet(newData, status);
                await BeforeUpdate(oldData, FuncAction.Invalid, token);
                if (Message.HasError) return newData;
                await DoUpdateAsync(oldData, newData);
                await AfterUpdate(oldDataSnapshot, oldData, FuncAction.Invalid, TransStatus.Difference, token);
                return Message.HasError ? newData : oldData;
            },
            async (_, token) =>
            {
                await AfterSaveChanges(FuncAction.Update, token);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00008);
            },
            ct);
    }
    /// <summary>
    /// 查詢單筆 Form Model。
    /// </summary>
    public async Task<TFormModel> BizQueryDataAsync(string internalId, CancellationToken ct = default)
    {
        var data = await DoQueryDataAsync(internalId);
        return data;
    }
    /// <summary>
    /// 查詢 Form Model 清單。
    /// </summary>
    public async Task<IList<TFormModel>> BizQueryListAsync(QueryListParam param, CancellationToken ct = default)
    {
        return await BizQueryListAsync(param.Fields, param.Condition, param.OrderBy, param.RankGroups, param.PageNumber, param.PageSize, ct);
    }
    /// <summary>
    /// 查詢 Form Model 清單。
    /// </summary>
    public async Task<IList<TFormModel>> BizQueryListAsync(string[] selectFields, string condition, IReadOnlyList<OrderBySpec> OrderBy = null, IReadOnlyList<RankGroupsSpec> rankGroups = null, int pageNumber = 0, int pageSize = 0, CancellationToken ct = default)
    {
        string[] rootFields = MapSelectFields(selectFields);
        string rootCondition = ApplyDataScope(FormModelMetadataResolver.MapExpressionToRoot(typeof(TFormModel), condition, ModelMetadata));
        IReadOnlyList<OrderBySpec>? rootOrderBy = MapOrderBy(OrderBy);
        IReadOnlyList<RankGroupsSpec>? rootRankGroups = MapRankGroups(rankGroups);
        if (rootRankGroups == null || rootRankGroups.Count == 0)
        {
            IList roots = await DoQueryListAsync(RootDbModelType, rootFields, rootCondition, rootOrderBy, pageNumber, pageSize);
            return BuildFormModelList(roots);
        }
        RankGroupPlan plan = BuildRankGroupPlan(rootCondition, rootRankGroups);
        IReadOnlyList<RankSegment> segments = BuildRankSegments(plan, rootRankGroups, rootOrderBy);
        if (pageNumber <= 0 || pageSize <= 0) return await QuerySegmentsAsync(segments, rootFields, rootCondition, rootRankGroups);
        return await QueryPagedSegmentsAsync(segments, rootFields, rootCondition, rootRankGroups, pageNumber, pageSize);
    }
    /// <summary>
    /// 獲取清單總筆數。
    /// </summary>
    public async Task<int> BizQueryTotalCounts(string condition, CancellationToken ct = default)
    {
        string rootCondition = FormModelMetadataResolver.MapExpressionToRoot(typeof(TFormModel), condition, ModelMetadata);
        return await DoQueryListCountAsync(RootDbModelType, ApplyDataScope(rootCondition));
    }
    /// <summary>
    /// 啟用交易控制。
    /// </summary>
    public async Task<bool> TryBeginTransactionAsync()
    {
        if (DataAccess.Database.CurrentTransaction != null) return false;
        await DataAccess.Database.BeginTransactionAsync();
        return true;
    }
    /// <summary>
    /// 回滾交易控制。
    /// </summary>
    public async Task TryRollbackAsync(bool ownsTx)
    {
        if (!ownsTx) return;
        await DataAccess.Database.RollbackTransactionAsync();
    }
    /// <summary>
    /// 提交交易控制。
    /// </summary>
    public async Task TryCommitAsync(bool ownsTx)
    {
        await DataAccess.SaveChangesAsync();
        if (!ownsTx) return;
        await DataAccess.Database.CommitTransactionAsync();
    }
    #endregion

    #region Protected
    /// <summary>
    /// 建立 Form Model 聚合根與所有 Detail / SubDetail。
    /// </summary>
    protected async Task DoCreateAsync(TFormModel data)
    {
        DbModel rootModel = FormModelMetadataResolver.GetRootModel(data);
        await ((dynamic)GraphRepo.RootRepo).CreateAsync((dynamic)rootModel);
        foreach (object item in CollectDetailItems(data)) await ((dynamic)GetRepoByType(item.GetType())).CreateAsync((dynamic)item);
    }
    /// <summary>
    /// 更新 Form Model 聚合根與所有 Detail / SubDetail。
    /// </summary>
    protected async Task DoUpdateAsync(TFormModel oldData, TFormModel newData)
    {
        PreserveRootKeys(oldData, newData);
        PreserveCreateInfo(oldData, newData);
        DbModel oldRoot = FormModelMetadataResolver.GetRootModel(oldData);
        DbModel newRoot = FormModelMetadataResolver.GetRootModel(newData);
        await ((dynamic)GraphRepo.RootRepo).UpdateAsync((dynamic)oldRoot, (dynamic)newRoot);
        await SyncDetailItemsAsync(oldData, newData);
    }
    /// <summary>
    /// 刪除 Form Model 聚合根與所有 Detail / SubDetail。
    /// </summary>
    protected async Task DoDeleteAsync(TFormModel oldData)
    {
        foreach (object item in CollectDetailItems(oldData).AsEnumerable().Reverse()) await ((dynamic)GetRepoByType(item.GetType())).DeleteAsync((dynamic)item);
        DbModel rootModel = FormModelMetadataResolver.GetRootModel(oldData);
        await ((dynamic)GraphRepo.RootRepo).DeleteAsync((dynamic)rootModel);
    }
    /// <summary>
    /// 查詢單筆 Form Model。
    /// </summary>
    protected async Task<TFormModel> DoQueryDataAsync(string internalId)
    {
        string condition = await GetPKConditionByInternalId(internalId);
        if (condition.IsNullOrEmpty()) return default!;
        IList roots = await DoQueryListAsync(RootDbModelType, GetDefaultRootSelectFields(), condition, default, 0, 0);
        return BuildFormModelList(roots).FirstOrDefault()!;
    }
    protected async Task<IList> DoQueryListAsync<TModel>(string[] selectFields, string queryCondition, IReadOnlyList<OrderBySpec>? orderBy, int pageCt, int takeCt, int skipCt = 0, string? detailFilterCondition = null, IReadOnlyList<RankGroupsSpec>? detailRankGroups = null)
    {
        return await DoQueryListAsync(typeof(TModel), selectFields, queryCondition, orderBy, pageCt, takeCt, skipCt, detailFilterCondition, detailRankGroups);
    }
    protected async Task<IList> DoQueryListAsync(PropertyInfo prop, string[] selectFields, string queryCondition, IReadOnlyList<OrderBySpec>? orderBy, int pageCt, int takeCt, int skipCt = 0, string? detailFilterCondition = null, IReadOnlyList<RankGroupsSpec>? detailRankGroups = null)
    {
        return await DoQueryListAsync(prop.PropertyType, selectFields, queryCondition, orderBy, pageCt, takeCt, skipCt, detailFilterCondition, detailRankGroups);
    }
    /// <summary>
    /// 查詢清單資料。
    /// </summary>
    protected async Task<IList> DoQueryListAsync(Type type, string[] selectFields, string queryCondition, IReadOnlyList<OrderBySpec>? orderBy, int pageCt, int takeCt, int skipCt = 0, string? detailFilterCondition = null, IReadOnlyList<RankGroupsSpec>? detailRankGroups = null)
    {
        var whereExpr = GetConditionExpr(type, queryCondition);
        var filterExpr = GetConditionExpr(type, detailFilterCondition ?? queryCondition);
        var detailFilterMap = ExtractDetailPredicateMap(type, filterExpr);
        var detailRankMap = BuildDetailRankMap(type, detailRankGroups);
        var selectExpr = GetSelectFieldsExpr(type, selectFields, detailFilterMap, detailRankMap);
        var repo = (dynamic)GetRepoByType(type);
        var data = await repo.QueryListAsync(selectExpr, whereExpr, orderBy, pageCt, takeCt, skipCt);
        return data;
    }
    protected async Task<int> DoQueryListCountAsync<TModel>(string condition)
    {
        return await DoQueryListCountAsync(typeof(TModel), condition);
    }
    /// <summary>
    /// 查詢清單總筆數。
    /// </summary>
    protected async Task<int> DoQueryListCountAsync(Type type, string condition)
    {
        var whereExpr = GetConditionExpr(type, condition);
        var repo = (dynamic)GetRepoByType(type);
        var data = await repo.QueryListCountAsync(whereExpr);
        return data;
    }
    /// <summary>
    /// 設定作廢狀態。
    /// </summary>
    protected void DoInvalidSet(TFormModel data, bool isInvalid)
    {
        if (FormModelMetadataResolver.GetRootModel(data) is not HeaderModel header) return;
        header.DataStatus = isInvalid ? DataStatus.Invalid : DataStatus.Valid;
        header.FormStatus = isInvalid ? FormStatus.Obsoleted : FormStatus.Saved;
        header.InvalidTime = isInvalid ? DateTime.UtcNow : null;
        header.InvalidUserId = isInvalid ? OperateUser?.UserId : string.Empty;
    }

    /// <summary>
    /// ☆重要Function，任何交易相關的流程都應該調用該Helper，以確保交易的一致性
    /// 執行交易骨架
    /// 1. inTransaction：交易內主流程
    /// 2. afterCommit：提交後流程（僅真正持有交易者執行）
    /// 3. 巢狀交易時，inner 不會提早觸發 afterCommit
    /// </summary>
    /// <typeparam name="TResult">回傳型別</typeparam>
    /// <param name="inTransaction">交易內主流程</param>
    /// <param name="afterCommit">提交後流程</param>
    /// <param name="ct">取消權杖</param>
    /// <returns>執行結果</returns>
    protected async Task<TResult> ExecTransactionAsync<TResult>(Func<CancellationToken, Task<TResult>> inTransaction, Func<TResult, CancellationToken, Task>? afterCommit = null, CancellationToken ct = default)
    {
        // 宣告變數
        bool ownsTx = false;
        TResult result = default!;
        try
        {
            ct.ThrowIfCancellationRequested();
            ownsTx = await TryBeginTransactionAsync();
            result = await inTransaction(ct);
            if (Message.HasError)
            {
                if (ownsTx) await TryRollbackAsync(true);
                return result;
            }
            ct.ThrowIfCancellationRequested();
            await TryCommitAsync(ownsTx);
            if (ownsTx && afterCommit != null) await afterCommit(result, ct);
            return result;
        }
        catch
        {
            await TryRollbackAsync(ownsTx);
            throw;
        }
    }
    #endregion

    #region Protected virtual
    /// <summary>
    /// 保存前
    /// </summary>
    /// <param name="set"></param>
    protected virtual Task BeforeUpdate(TFormModel set, FuncAction act, CancellationToken ct = default) => Task.CompletedTask;
    /// <summary>
    /// 更新之後，尚未提交 (供過帳使用)
    /// </summary>
    /// <param name="oldSet"></param>
    /// <param name="newSet"></param>
    /// <param name="status"></param>
    protected virtual Task AfterUpdate(TFormModel? oldSet, TFormModel? newSet, FuncAction act, TransStatus status, CancellationToken ct = default) => Task.CompletedTask;
    /// <summary>
    /// 執行SaveChanges後
    /// </summary>
    /// <param name="set"></param>
    protected virtual Task AfterSaveChanges(FuncAction action, CancellationToken ct = default) => Task.CompletedTask;
    /// <summary>
    /// 作廢後
    /// </summary>
    /// <param name="set"></param>
    /// <param name="status"></param>
    protected virtual void AfterInvalid(TFormModel set, bool status) { }
    /// <summary>
    /// 目前表單查詢必須套用的 Root DbModel 資料範圍。
    /// </summary>
    protected virtual string DataScopeCondition => string.Empty;
    #endregion

    #region Private
    /// <summary>
    /// 自動產生流水號ID
    /// 若Id已有值，就不做自動產生
    /// </summary>
    private async Task AutoGenerateId(HeaderModel header, Dictionary<string, IList> details)
    {
        if (header == null) return;
        var keyProp = ModelMetadata.GetProperties(header.GetType()).Where(p => p.IsDefined(typeof(KeyAttribute), inherit: true)).LastOrDefault();
        if (keyProp == null) return;
        object id = PropertyAccessor.Get(header, keyProp.Name);
        if (IsAutoGenerateId && keyProp.PropertyType == typeof(string))
        {
            id ??= string.Empty;
            var idSelector = BuildIdSelectorLambda(header.GetType(), keyProp);
            id = !string.IsNullOrEmpty(id.ToString()) ? id : await ((Task<string>)((dynamic)RepoDict[header.GetType().Name]).GenerateIdAsync(idSelector, PrefixId));
            PropertyAccessor.Set(header, keyProp.Name, id);
        }
        foreach (var detail in details)
        {
            var rows = detail.Value;
            if (rows == null) continue;
            foreach (var row in rows) if (row != null) PropertyAccessor.Set(row, keyProp.Name, id);
        }
    }
    /// <summary>
    /// 設置新增時資料
    /// </summary>
    /// <param name="header"></param>
    private void SetCreateInfo(HeaderModel header)
    {
        DateTime now = DateTime.Now;
        header.CreateUserId = OperateUser.UserId;
        if (header.CreateTime == null) header.CreateTime = now;
        header.ModifyUserId = OperateUser.UserId;
        if (header.ModifyTime == null) header.ModifyTime = now;
        header.InternalId = Guid.NewGuid().ToString();
    }
    /// <summary>
    /// 設置修改時使用者資料
    /// </summary>
    /// <param name="header"></param>
    protected void SetModifyInfo(HeaderModel header)
    {
        DateTime now = DateTime.Now;
        header.ModifyUserId = OperateUser.UserId;
        header.ModifyTime = now;
    }
    /// <summary>
    /// 設置作廢時使用者資料
    /// </summary>
    /// <param name="header"></param>
    /// <param name="status"></param>
    private void SetInvalidInfo(HeaderModel header, bool status)
    {
        DateTime now = DateTime.Now;
        header.ModifyUserId = OperateUser.UserId;
        header.ModifyTime = now;
    }
    /// <summary>
    /// 設定行項RowState
    /// </summary>
    /// <param name="entityList"></param>
    private void SetCreateRowState(dynamic entityList)
    {
        foreach (var entity in entityList) entity.RowState = RowState.Insert;
    }
    private sealed class ParameterReplacer(ParameterExpression from, Expression to) : ExpressionVisitor
    {
        private readonly ParameterExpression _from = from;
        private readonly Expression _to = to;
        protected override Expression VisitParameter(ParameterExpression node) => node == _from ? _to : base.VisitParameter(node);
    }
    private LambdaExpression GetSelectFieldsExpr(Type modelType, string[] selectFields, Dictionary<string, LambdaExpression>? detailFilterMap = null, Dictionary<string, List<LambdaExpression>>? detailRankMap = null)
    {
        if (selectFields == null || selectFields.Length == 0) return null;
        var param = Expression.Parameter(modelType, "x");
        var newModel = Expression.New(modelType);
        var bindings = new List<MemberBinding>();
        // 依最外層屬性分組：e.g. ["CreateUser.UserName", "CreateUser.Email", "CreateTime"]
        var groups = selectFields.Select(f => f.Split('.', StringSplitOptions.RemoveEmptyEntries)).GroupBy(parts => parts[0]);
        foreach (var g in groups)
        {
            var propName = g.Key;
            var propInfo = ModelMetadata.GetProperty(modelType, propName);
            if (propInfo == null) continue;
            // 單層屬性：直接綁定 x.Prop
            if (g.All(parts => parts.Length == 1))
            {
                bindings.Add(Expression.Bind(propInfo, Expression.Property(param, propName)));
                continue;
            }
            // 多層屬性（巢狀物件或集合）
            var childFields = g.Where(p => p.Length > 1).Select(p => string.Join('.', p.Skip(1))).ToArray();
            var childType = propInfo.PropertyType;
            // 是否為集合（排除 string）
            bool isEnumerable = typeof(IEnumerable).IsAssignableFrom(childType) && childType != typeof(string);
            // 取得集合元素型別或子物件型別
            Type itemType;
            if (isEnumerable)
            {
                if (childType.IsArray) itemType = childType.GetElementType()!;
                else itemType = childType.GenericTypeArguments.FirstOrDefault() ?? typeof(object);
            }
            else
            {
                itemType = childType;
            }

            // 針對子型別再遞迴產生 λ：TChild -> TChild
            var innerSelector = GetSelectFieldsExpr(itemType, childFields);
            if (innerSelector == null) continue;

            if (isEnumerable)
            {
                var collExpr = Expression.Property(param, propName);
                var asQueryable = typeof(Queryable).GetMethods().First(m => m.Name == "AsQueryable" && m.IsGenericMethodDefinition).MakeGenericMethod(itemType);
                var select = typeof(Queryable).GetMethods().First(m => m.Name == "Select" && m.GetParameters().Length == 2).MakeGenericMethod(itemType, ((LambdaExpression)innerSelector).ReturnType);
                var toList = typeof(Enumerable).GetMethods().First(m => m.Name == "ToList" && m.GetParameters().Length == 1).MakeGenericMethod(((LambdaExpression)innerSelector).ReturnType);
                var q = Expression.Call(asQueryable, collExpr);
                if (detailFilterMap != null && detailFilterMap.TryGetValue(propName, out var filterLambda) && filterLambda != null)
                {
                    q = (MethodCallExpression)ApplyDetailFilter(q, itemType, filterLambda);
                }
                if (detailRankMap != null && detailRankMap.TryGetValue(propName, out var rankList) && rankList?.Count > 0)
                {
                    q = (MethodCallExpression)ApplyDetailRankOrder(q, itemType, rankList);
                }
                var s = Expression.Call(select, q, innerSelector);
                var tl = Expression.Call(toList, s);
                bindings.Add(Expression.Bind(propInfo, tl));
            }
            else
            {
                // 宣告變數：取得巢狀屬性
                var nestedExpr = Expression.Property(param, propName);
                // 宣告變數：把 innerSelector 參數替換成 x.Prop
                var replacer = new ParameterReplacer(innerSelector.Parameters[0], nestedExpr);
                var replacedBody = replacer.Visit(innerSelector.Body)!;
                // 宣告變數：判斷是否可為 null
                bool canBeNull = !childType.IsValueType || Nullable.GetUnderlyingType(childType) != null;
                // 執行 function：若 navigation 可能為 null，先做 null guard
                if (canBeNull)
                {
                    var nullValue = Expression.Constant(null, childType);
                    replacedBody = Expression.Condition(Expression.Equal(nestedExpr, nullValue), nullValue, replacedBody);
                }
                // return：綁回屬性
                bindings.Add(Expression.Bind(propInfo, replacedBody));
            }
        }
        var body = Expression.MemberInit(newModel, bindings);
        var delegateType = typeof(Func<,>).MakeGenericType(modelType, modelType);
        return Expression.Lambda(delegateType, body, param);
    }
    /// <summary>
    /// 建立 detail 的 RankGroup 排序條件
    /// </summary>
    private Dictionary<string, List<LambdaExpression>> BuildDetailRankMap(Type modelType, IReadOnlyList<RankGroupsSpec>? rankGroups)
    {
        // 宣告變數
        var result = new Dictionary<string, List<LambdaExpression>>(StringComparer.Ordinal);
        if (rankGroups == null || rankGroups.Count == 0) return result;
        // 執行 function
        foreach (var group in rankGroups)
        {
            if (string.IsNullOrWhiteSpace(group.Condition)) continue;
            var groupExpr = GetConditionExpr(modelType, group.Condition);
            var predMap = ExtractDetailPredicateMap(modelType, groupExpr);
            foreach (var pair in predMap)
            {
                if (!result.TryGetValue(pair.Key, out var list))
                {
                    list = [];
                    result[pair.Key] = list;
                }
                list.Add(pair.Value);
            }
        }
        return result;
    }
    /// <summary>
    /// 套用 detail 過濾條件
    /// </summary>
    private static Expression ApplyDetailFilter(Expression source, Type itemType, LambdaExpression filterLambda)
    {
        // 宣告變數
        var where = typeof(Queryable).GetMethods().First(m => m.Name == "Where" && m.GetParameters().Length == 2).MakeGenericMethod(itemType);
        // return
        return Expression.Call(where, source, filterLambda);
    }
    /// <summary>
    /// 套用 detail 的 RankGroup 排序
    /// </summary>
    private static Expression ApplyDetailRankOrder(Expression source, Type itemType, List<LambdaExpression> rankList)
    {
        // 宣告變數
        var param = Expression.Parameter(itemType, "d");
        Expression rankBody = Expression.Constant(rankList.Count);
        // 執行 function
        for (int i = rankList.Count - 1; i >= 0; i--)
        {
            var test = ReplaceParam(rankList[i].Body, rankList[i].Parameters[0], param);
            rankBody = Expression.Condition(test, Expression.Constant(i), rankBody);
        }
        var keySelector = Expression.Lambda(rankBody, param);
        var orderBy = typeof(Queryable).GetMethods().First(m => m.Name == "OrderBy" && m.GetParameters().Length == 2).MakeGenericMethod(itemType, typeof(int));
        // return
        return Expression.Call(orderBy, source, keySelector);
    }
    /// <summary>
    /// Step 3：從 whereExpr 抽出「集合導航」的 predicate：
    /// 來源是 whereExpr 裡的：Nav.Any(d => ...)
    /// 並且保留 and/or/括號（Expression Tree）
    /// </summary>
    private static Dictionary<string, LambdaExpression> ExtractDetailPredicateMap(Type rootType, LambdaExpression whereExpr)
    {
        var map = new Dictionary<string, LambdaExpression>(StringComparer.Ordinal);
        if (whereExpr == null || whereExpr.Parameters.Count == 0) return map;
        var rootParam = whereExpr.Parameters[0];
        // 遞迴抽取：回傳每個 nav 的「predicate expression」(帶同一個 detail param)
        var infoMap = ExtractFromNode(whereExpr.Body, rootParam);
        foreach (var kv in infoMap)
        {
            var navName = kv.Key;
            var info = kv.Value;
            if (info.IsUnsafe || info.Param == null || info.Body == null) continue;
            // 組成 Expression<Func<TDetail,bool>>
            var lambdaType = typeof(Func<,>).MakeGenericType(info.Param.Type, typeof(bool));
            map[navName] = Expression.Lambda(lambdaType, info.Body, info.Param);
        }
        return map;
    }
    private sealed record DetailPredInfo(ParameterExpression? Param, Expression? Body, bool IsUnsafe);
    private static Dictionary<string, DetailPredInfo> ExtractFromNode(Expression node, ParameterExpression rootParam)
    {
        node = StripQuotesAndConverts(node);
        // ✅ match: root.Nav.Any(d => predicate)
        if (TryMatchAnyOnRootNav(node, rootParam, out var navName, out var detailParam, out var detailBody))
        {
            return new Dictionary<string, DetailPredInfo>(StringComparer.Ordinal)
            {
                [navName] = new DetailPredInfo(detailParam, detailBody, IsUnsafe: false)
            };
        }
        // ✅ (A && B) / (A || B)
        if (node is BinaryExpression be && (be.NodeType == ExpressionType.AndAlso || be.NodeType == ExpressionType.OrElse))
        {
            var left = ExtractFromNode(be.Left, rootParam);
            var right = ExtractFromNode(be.Right, rootParam);
            return MergeByBoolean(left, right, be.NodeType);
        }
        if (node is UnaryExpression ue && ue.NodeType == ExpressionType.Not)
        {
            var inner = ExtractFromNode(ue.Operand, rootParam);
            foreach (var k in inner.Keys.ToList())
            {
                var info = inner[k];
                if (info.IsUnsafe || info.Body == null)
                {
                    inner[k] = info with { IsUnsafe = true };
                    continue;
                }
                inner[k] = info with { Body = Expression.Not(info.Body) };
            }
            return inner;
        }
        return new Dictionary<string, DetailPredInfo>(StringComparer.Ordinal);
    }

    private static Dictionary<string, DetailPredInfo> MergeByBoolean(Dictionary<string, DetailPredInfo> left, Dictionary<string, DetailPredInfo> right, ExpressionType op)
    {
        var result = new Dictionary<string, DetailPredInfo>(StringComparer.Ordinal);
        var keys = left.Keys.Union(right.Keys).ToList();

        foreach (var k in keys)
        {
            left.TryGetValue(k, out var l);
            right.TryGetValue(k, out var r);
            // 只在其中一邊出現：
            if (l == null && r != null)
            {
                // AND：缺邊視為 true → 保留 r
                // OR ：缺邊等同「主表條件 OR 明細條件」→ 不安全，避免錯殺
                result[k] = op == ExpressionType.AndAlso ? r : r with { IsUnsafe = true };
                continue;
            }
            if (r == null && l != null)
            {
                result[k] = op == ExpressionType.AndAlso ? l : l with { IsUnsafe = true };
                continue;
            }
            if (l == null || r == null) continue;
            // 任一不安全就不安全
            if (l.IsUnsafe || r.IsUnsafe)
            {
                result[k] = new DetailPredInfo(l.Param ?? r.Param, l.Body ?? r.Body, IsUnsafe: true);
                continue;
            }
            if (l.Param == null || r.Param == null || l.Body == null || r.Body == null)
            {
                result[k] = new DetailPredInfo(l.Param ?? r.Param, l.Body ?? r.Body, IsUnsafe: true);
                continue;
            }
            // 統一 parameter：右邊換成左邊的 param
            var unifiedParam = l.Param;
            var rightBody = ReplaceParam(r.Body, r.Param, unifiedParam);
            var mergedBody = op == ExpressionType.AndAlso ? Expression.AndAlso(l.Body, rightBody) : Expression.OrElse(l.Body, rightBody);
            result[k] = new DetailPredInfo(unifiedParam, mergedBody, IsUnsafe: false);
        }
        return result;
    }
    private static Expression ReplaceParam(Expression body, ParameterExpression from, ParameterExpression to) => new ParamSwapVisitor(from, to).Visit(body)!;
    private sealed class ParamSwapVisitor : ExpressionVisitor
    {
        private readonly ParameterExpression _from;
        private readonly ParameterExpression _to;
        public ParamSwapVisitor(ParameterExpression from, ParameterExpression to) { _from = from; _to = to; }
        protected override Expression VisitParameter(ParameterExpression node) => node == _from ? _to : base.VisitParameter(node);
    }
    private static Expression StripQuotesAndConverts(Expression e)
    {
        while (true)
        {
            if (e is UnaryExpression ue &&
                (ue.NodeType == ExpressionType.Quote || ue.NodeType == ExpressionType.Convert))
            {
                e = ue.Operand;
                continue;
            }
            return e;
        }
    }
    /// <summary>
    /// 匹配：x.Nav.Any(d => ...)
    /// 支援 Enumerable.Any / Queryable.Any
    /// </summary>
    private static bool TryMatchAnyOnRootNav(Expression node, ParameterExpression rootParam, out string navName, out ParameterExpression detailParam, out Expression detailBody)
    {
        navName = "";
        detailParam = null!;
        detailBody = null!;
        if (node is not MethodCallExpression mc) return false;
        if (!string.Equals(mc.Method.Name, "Any", StringComparison.Ordinal)) return false;
        if (mc.Arguments.Count != 2) return false;
        // arg0: source（允許 Queryable.AsQueryable(x.Nav) 或直接 x.Nav）
        var source = StripQuotesAndConverts(mc.Arguments[0]);
        if (source is MethodCallExpression aq && aq.Method.Name == "AsQueryable" && aq.Arguments.Count == 1) source = StripQuotesAndConverts(aq.Arguments[0]);
        if (source is not MemberExpression navExpr) return false;
        if (navExpr.Expression is not ParameterExpression pe || pe != rootParam) return false;
        var pred = StripQuotesAndConverts(mc.Arguments[1]) as LambdaExpression;
        if (pred == null || pred.Parameters.Count != 1) return false;
        navName = navExpr.Member.Name;
        detailParam = pred.Parameters[0];
        detailBody = pred.Body;
        return true;
    }
    /// <summary>
    /// 獲取要搜尋的條件表達式
    /// </summary>
    /// <typeparam name="TModel"></typeparam>
    /// <param name="condition"></param>
    /// <returns></returns>
    private LambdaExpression GetConditionExpr(Type modelType, string condition)
    {
        var param = Expression.Parameter(modelType, "x");
        string normalized = NormalizeCondition(modelType, condition, out object[] args);
        if (string.IsNullOrWhiteSpace(normalized)) return Expression.Lambda(Expression.Constant(true), param);
        var config = new ParsingConfig { ResolveTypesBySimpleName = true, AllowNewToEvaluateAnyType = true, UseParameterizedNamesInDynamicQuery = true, CustomTypeProvider = new WcmsTypeProvider() };
        var lambda = DynamicExpressionParser.ParseLambda(config, [param], typeof(bool), normalized, args);
        return lambda;
    }
    // 1) 取代原本的 NormalizeCondition
    private string NormalizeCondition(Type modelType, string rawCondition, out object[] args)
    {
        var argList = new List<object>();
        // 與你原本相同的前置清理：補空白、統一運算子
        rawCondition = Regex.Replace(rawCondition, @"(?<=[^!\s<>!=])=(?=[^=])", " == ");
        rawCondition = Regex.Replace(rawCondition, @"(?<=[^\s])(?<op>==|!=|>=|<=|>|<)(?=[^\s])", " ${op} ");
        string normalized = NormalizeRec(modelType, rawCondition, argList);
        args = argList.ToArray();
        return normalized;
    }
    // 2) 遞迴解析：保留括號分組，只在頂層切 and/or
    private string NormalizeRec(Type modelType, string input, List<object> args)
    {
        var (chunks, connectors) = SplitTopLevelByAndOr(input);
        var pieces = new List<string>();
        int i = 0;
        while (i < chunks.Count)
        {
            string seg = chunks[i].Trim();
            if (string.IsNullOrEmpty(seg))
            {
                i++;
                continue;
            }
            var s0 = seg.TrimStart();
            var isNot = s0.StartsWith("not ", StringComparison.OrdinalIgnoreCase) || s0.StartsWith("not(", StringComparison.OrdinalIgnoreCase) || s0.StartsWith("!", StringComparison.Ordinal);
            if (isNot)
            {
                // 取出 not/! 後面的 operand
                var operand = s0.StartsWith("!", StringComparison.Ordinal) ? s0.Substring(1).Trim() : s0.Substring(3).Trim(); // "not"
                // 若是 not(...) 形式，去掉外層括號
                if (operand.StartsWith("(") && operand.EndsWith(")") && IsBalanced(operand)) operand = operand.Substring(1, operand.Length - 2);
                // 先把 operand 正規化成 bool expr
                string innerNorm;
                if (TryParseSimpleClause(operand, out var p, out var opx, out var vx)) innerNorm = BuildNestedClause(modelType, p, opx, vx, ref args) ?? "true";
                else innerNorm = NormalizeRec(modelType, operand, args);
                pieces.Add($"!({innerNorm})");
                // 正常補 connector（未合併的情況）
                if (i < connectors.Count) pieces.Add(connectors[i]);
                i++;
                continue;
            }
            // ( ... ) → 遞迴處理後再包回括號（括號群組不做合併）
            if (seg.StartsWith("(") && seg.EndsWith(")") && IsBalanced(seg))
            {
                string inner = seg.Substring(1, seg.Length - 2);
                string innerNorm = NormalizeRec(modelType, inner, args);
                pieces.Add("(" + innerNorm + ")");
            }
            else
            {
                // 嘗試：同 collection nav + AND 連續子句合併
                if (TryParseSimpleClause(seg, out var p0, out var op0, out var v0)
                    && p0.Length >= 2
                    && TryGetEnumerableElementType(modelType, p0[0], out var elementType))
                {
                    var nav = p0[0];

                    // 收集連續 AND 同 nav 的子句
                    var group = new List<(string[] RestPath, string Op, string? Val)>
            {
                (p0.Skip(1).ToArray(), op0, v0)
            };

                    int j = i;
                    while (j < connectors.Count
                           && connectors[j].Equals("and", StringComparison.OrdinalIgnoreCase))
                    {
                        var nextSeg = chunks[j + 1].Trim();

                        // 不跨括號合併
                        if (nextSeg.StartsWith("(")) break;

                        if (!TryParseSimpleClause(nextSeg, out var pn, out var opn, out var vn)) break;
                        if (pn.Length < 2) break;
                        if (!pn[0].Equals(nav, StringComparison.OrdinalIgnoreCase)) break;

                        group.Add((pn.Skip(1).ToArray(), opn, vn));
                        j++;
                    }

                    if (group.Count >= 2)
                    {
                        // ✅ 合併成單一 Any
                        var merged = BuildMergedAnyClause(modelType, nav, elementType, group, ref args);
                        if (!string.IsNullOrEmpty(merged)) pieces.Add(merged);

                        // group 吃掉了 chunks[i..j]，下一個 connector 是 connectors[j]
                        i = j + 1;

                        // 補回 group 後面那個 connector（如果還有）
                        if (j < connectors.Count) pieces.Add(connectors[j]);
                        continue;
                    }
                }

                // fallback：沿用你原本單子句 BuildNestedClause
                if (TryParseSimpleClause(seg, out var pathParts, out var op, out var val))
                {
                    string? clause = BuildNestedClause(modelType, pathParts, op, val, ref args);
                    if (!string.IsNullOrEmpty(clause)) pieces.Add(clause);
                }
            }

            // 正常補 connector（未合併的情況）
            if (i < connectors.Count) pieces.Add(connectors[i]);
            i++;
        }

        return string.Join(" ", pieces);
    }
    // 3) 只在「括號深度為 0」時，辨識 and / or 作為分隔
    private static (List<string> chunks, List<string> connectors) SplitTopLevelByAndOr(string s)
    {
        // 宣告變數
        var chunks = new List<string>();
        var connectors = new List<string>();
        var sb = new System.Text.StringBuilder();
        int depth = 0;
        bool inSingleQuote = false;
        bool inDoubleQuote = false;

        // 執行 function
        for (int i = 0; i < s.Length;)
        {
            char ch = s[i];

            // 單引號字串：支援 SQL 風格 '' 跳脫
            if (ch == '\'' && !inDoubleQuote)
            {
                if (inSingleQuote && i + 1 < s.Length && s[i + 1] == '\'')
                {
                    sb.Append("''");
                    i += 2;
                    continue;
                }

                if (IsUnescapedQuote(s, i))
                {
                    inSingleQuote = !inSingleQuote;
                    sb.Append(ch);
                    i++;
                    continue;
                }
            }

            // 雙引號字串：支援 "" 跳脫
            if (ch == '"' && !inSingleQuote)
            {
                if (inDoubleQuote && i + 1 < s.Length && s[i + 1] == '"')
                {
                    sb.Append("\"\"");
                    i += 2;
                    continue;
                }

                if (IsUnescapedQuote(s, i))
                {
                    inDoubleQuote = !inDoubleQuote;
                    sb.Append(ch);
                    i++;
                    continue;
                }
            }

            // 只有在不在引號內時，才處理括號與 connector
            if (!inSingleQuote && !inDoubleQuote)
            {
                if (ch == '(')
                {
                    depth++;
                    sb.Append(ch);
                    i++;
                    continue;
                }

                if (ch == ')')
                {
                    depth = Math.Max(0, depth - 1);
                    sb.Append(ch);
                    i++;
                    continue;
                }

                if (depth == 0 && TryReadConnector(s, i, out string? conn, out int adv))
                {
                    chunks.Add(sb.ToString());
                    sb.Clear();
                    connectors.Add(conn!);
                    i += adv;
                    continue;
                }
            }

            sb.Append(ch);
            i++;
        }

        chunks.Add(sb.ToString());

        // return
        return (chunks, connectors);
    }
    // 4) 辨識 and / or（允許左右空白）
    private static bool TryReadConnector(string s, int index, out string? conn, out int advance)
    {
        // 宣告變數
        int i = index;

        // 執行 function
        while (i < s.Length && char.IsWhiteSpace(s[i])) i++;

        bool Match(string word)
        {
            if (i + word.Length > s.Length) return false;
            if (!s.AsSpan(i, word.Length).Equals(word, StringComparison.OrdinalIgnoreCase)) return false;
            if (!IsConnectorBoundary(s, i - 1)) return false;
            if (!IsConnectorBoundary(s, i + word.Length)) return false;
            return true;
        }

        if (Match("and"))
        {
            int j = i + 3;
            while (j < s.Length && char.IsWhiteSpace(s[j])) j++;

            conn = "and";
            advance = j - index;
            return true;
        }

        if (Match("or"))
        {
            int j = i + 2;
            while (j < s.Length && char.IsWhiteSpace(s[j])) j++;

            conn = "or";
            advance = j - index;
            return true;
        }

        conn = null;
        advance = 0;

        // return
        return false;
    }
    // 5) 檢查括號是否平衡
    private static bool IsBalanced(string s)
    {
        // 宣告變數
        int depth = 0;
        bool inSingleQuote = false;
        bool inDoubleQuote = false;

        // 執行 function
        for (int i = 0; i < s.Length; i++)
        {
            char ch = s[i];

            if (ch == '\'' && !inDoubleQuote)
            {
                if (inSingleQuote && i + 1 < s.Length && s[i + 1] == '\'')
                {
                    i++;
                    continue;
                }

                if (IsUnescapedQuote(s, i))
                {
                    inSingleQuote = !inSingleQuote;
                    continue;
                }
            }

            if (ch == '"' && !inSingleQuote)
            {
                if (inDoubleQuote && i + 1 < s.Length && s[i + 1] == '"')
                {
                    i++;
                    continue;
                }

                if (IsUnescapedQuote(s, i))
                {
                    inDoubleQuote = !inDoubleQuote;
                    continue;
                }
            }

            if (inSingleQuote || inDoubleQuote) continue;

            if (ch == '(') depth++;
            else if (ch == ')')
            {
                depth--;
                if (depth < 0) return false;
            }
        }

        // return
        return depth == 0;
    }
    private static string? UnescapeQuotedValue(string? raw)
    {
        // 宣告變數
        bool isEmpty = string.IsNullOrEmpty(raw);

        // 執行 function
        if (isEmpty) return raw;

        // return
        return raw!
            .Replace("''", "'")
            .Replace("\"\"", "\"");
    }
    private static bool IsUnescapedQuote(string s, int index)
    {
        // 宣告變數
        int slashCount = 0;
        int i = index - 1;

        // 執行 function
        while (i >= 0 && s[i] == '\\')
        {
            slashCount++;
            i--;
        }

        // return
        return slashCount % 2 == 0;
    }
    private static bool IsConnectorBoundary(string s, int index)
    {
        // 宣告變數
        bool isEdge = index < 0 || index >= s.Length;

        // 執行 function
        if (isEdge) return true;

        char ch = s[index];

        // return
        return char.IsWhiteSpace(ch) || ch == '(' || ch == ')';
    }
    private string? BuildNestedClause(Type type, string[] pathParts, string op, string? val, ref List<object> args, int index = 0)
    {
        // 宣告變數
        if (index >= pathParts.Length) return null;

        string current = pathParts[index];
        var prop = ModelMetadata.GetProperty(type, current);
        if (prop == null) return null;

        Type nextType = prop.PropertyType;
        bool isEnumerable = typeof(IEnumerable).IsAssignableFrom(nextType) && nextType != typeof(string);
        if (isEnumerable) nextType = nextType.IsGenericType ? nextType.GetGenericArguments()[0] : nextType.GetElementType();

        // 執行 function
        if (index == pathParts.Length - 1)
        {
            string fieldExpr = current;
            string expr = null;

            switch (op.ToLowerInvariant())
            {
                case "is null":
                    expr = $"{fieldExpr} == null";
                    break;

                case "is not null":
                    expr = $"{fieldExpr} != null";
                    break;

                case "in":
                case "not in":
                    {
                        // 宣告變數：取得欄位型別與實際比對型別
                        var cleaned = val?.Trim('(', ')') ?? "";
                        var fieldProp = ModelMetadata.GetProperty(type, fieldExpr).PropertyType;
                        var targetType = Nullable.GetUnderlyingType(fieldProp) ?? fieldProp;
                        var isIn = op.Equals("in", StringComparison.OrdinalIgnoreCase);

                        // 執行：整理 in / not in 的值
                        var valuesArray = cleaned
                            .Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(v => v.Trim().Trim('\'', '"'))
                            .Where(v => !string.IsNullOrWhiteSpace(v))
                            .ToArray();

                        if (valuesArray.Length == 0)
                        {
                            expr = isIn ? "false" : "true";
                            break;
                        }

                        // 執行：建立強型別陣列，避免 object[] 造成 Contains 解析失敗
                        var convertedArray = BuildTypedConditionArray(valuesArray, targetType);

                        int paramIndex = args.Count;
                        args.Add(convertedArray);

                        // return：nullable 欄位需要用 Value 比對
                        expr = BuildInConditionExpr(fieldExpr, fieldProp, isIn, paramIndex);
                        break;
                    }

                case "like":
                    {
                        int pIndex = args.Count;
                        args.Add(val ?? string.Empty);
                        expr = $"{fieldExpr} != null && {fieldExpr}.Contains(@{pIndex})";
                        break;
                    }

                case "hasany":
                    {
                        var raw = (val ?? string.Empty).Trim();

                        if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                            raw = raw.Substring(1, raw.Length - 2);

                        var tokens = raw
                            .Split(',')
                            .Select(s => s.Trim().Trim('"', '\''))
                            .Where(s => !string.IsNullOrWhiteSpace(s))
                            .ToArray();

                        if (tokens.Length == 0) return null;

                        int pIndex = args.Count;
                        args.Add(tokens);
                        expr = $"ApplicationDbContext.SplitToStringTable({fieldExpr}).Any(@{pIndex}.Contains(Id.ToUpper()))";
                        break;
                    }

                case "hasall":
                    {
                        var raw = (val ?? string.Empty).Trim();

                        if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                            raw = raw.Substring(1, raw.Length - 2);

                        var tokens = raw
                            .Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(s => s.Trim().Trim('"', '\''))
                            .Where(s => !string.IsNullOrWhiteSpace(s))
                            .Select(s => s.ToUpperInvariant())
                            .ToArray();

                        if (tokens.Length == 0) return null;

                        int pIndex = args.Count;
                        args.Add(tokens);

                        var split = $"ApplicationDbContext.SplitToStringTable({fieldExpr})";
                        expr =
                            $"{split}.Count(@{pIndex}.Contains(Id.ToUpper())) == @{pIndex}.Length && " +
                            $"{split}.Count() == @{pIndex}.Length";

                        break;
                    }

                case "hasallof":
                    {
                        var raw = (val ?? string.Empty).Trim();

                        if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                            raw = raw.Substring(1, raw.Length - 2);

                        var tokens = raw
                            .Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(s => s.Trim().Trim('"', '\''))
                            .Where(s => !string.IsNullOrWhiteSpace(s))
                            .Select(s => s.ToUpperInvariant())
                            .ToArray();

                        if (tokens.Length == 0) return null;

                        int pIndex = args.Count;
                        args.Add(tokens);

                        var split = $"ApplicationDbContext.SplitToStringTable({fieldExpr})";
                        expr = $"{split}.Count(@{pIndex}.Contains(Id.ToUpper())) == @{pIndex}.Length";

                        break;
                    }

                case "&":
                case "!&":
                    {
                        var raw = (val ?? string.Empty).Trim();
                        if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                            raw = raw.Substring(1, raw.Length - 2);

                        var propInfo = ModelMetadata.GetProperty(type, fieldExpr);
                        var propType = propInfo.PropertyType;
                        var isNullable = Nullable.GetUnderlyingType(propType) != null;
                        var nonNullType = Nullable.GetUnderlyingType(propType) ?? propType;

                        Type underlying;
                        if (nonNullType.IsEnum)
                            underlying = System.Enum.GetUnderlyingType(nonNullType);
                        else
                            underlying = nonNullType;

                        long acc = 0;
                        foreach (var p in raw.Split(new[] { '|', ',', ' ' }, StringSplitOptions.RemoveEmptyEntries))
                            acc |= Convert.ToInt64(p);

                        object flagVal =
                            underlying == typeof(long) ? acc :
                            underlying == typeof(int) ? (int)acc :
                            underlying == typeof(short) ? (short)acc :
                            underlying == typeof(byte) ? (byte)acc :
                            Convert.ChangeType(acc, underlying);

                        var pIndex = args.Count;
                        args.Add(flagVal);

                        var left = isNullable ? $"({fieldExpr} ?? 0)" : fieldExpr;
                        var cmp = op == "&" ? "!= 0" : "== 0";
                        expr = $"(({left} & @{pIndex}) {cmp})";
                        break;
                    }

                default:
                    {
                        var pi = ModelMetadata.GetProperty(type, fieldExpr);
                        var propType = pi?.PropertyType ?? typeof(string);
                        var nonNullType = Nullable.GetUnderlyingType(propType) ?? propType;
                        var dynOp = op == "=" ? "==" : op;

                        object? converted = val;
                        if (nonNullType.IsEnum) converted = ParseEnumFromString(nonNullType, val ?? "");

                        int pIndex = args.Count;
                        args.Add(converted!);
                        expr = $"{fieldExpr} {dynOp} @{pIndex}";
                        break;
                    }
            }

            return expr;
        }

        string inner = BuildNestedClause(nextType, pathParts, op, val, ref args, index + 1);
        if (string.IsNullOrEmpty(inner)) return null;

        string thisLevel = current;

        // return
        return isEnumerable ? $"{thisLevel}.Any({inner})" : $"{thisLevel}.{inner}";
    }
    /// <summary>
    /// 從 rawCondition 抽出「集合導航」的條件：
    /// e.g. "_Detail.PublishStatus == 1 and _Detail.Year >= 2024"
    ///  ->  { "_Detail": "PublishStatus == 1 and Year >= 2024" }
    /// 限制：目前只處理頂層 AND（先不處理 OR/巢狀括號）
    /// </summary>
    private Dictionary<string, string> ExtractDetailConditionMap(Type modelType, string rawCondition)
    {
        var map = new Dictionary<string, string>(StringComparer.Ordinal);
        if (string.IsNullOrWhiteSpace(rawCondition)) return map;
        var (chunks, connectors) = SplitTopLevelByAndOr(rawCondition);
        for (int i = 0; i < chunks.Count; i++)
        {
            var seg = chunks[i].Trim();
            if (string.IsNullOrEmpty(seg)) continue;
            // 只做 AND；遇到 OR 先跳過（避免行為錯）
            if (i < connectors.Count && connectors[i].Equals("or", StringComparison.OrdinalIgnoreCase)) continue;
            var m = Regex.Match(seg, @"^(?<fullPath>[\w.]+)\s*(?<op>=|&|!&|==|!=|>=|<=|>|<|in|not in|like|is null|is not null|hasany|hasallof|hasall)\s*(?<val>.+)?$", RegexOptions.IgnoreCase);
            if (!m.Success) continue;
            var fullPath = m.Groups["fullPath"].Value;
            var op = m.Groups["op"].Value;
            var val = m.Groups["val"].Success ? m.Groups["val"].Value.Trim() : null;
            var parts = fullPath.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2) continue;
            var first = parts[0];
            var p = ModelMetadata.GetProperty(modelType, first);
            if (p == null) continue;
            var isEnumerable = typeof(IEnumerable).IsAssignableFrom(p.PropertyType) && p.PropertyType != typeof(string);
            if (!isEnumerable) continue;
            // 去掉集合前綴：_Detail.PublishStatus -> PublishStatus
            var restPath = string.Join('.', parts.Skip(1));
            var rebuilt = string.IsNullOrWhiteSpace(val) ? $"{restPath} {op}" : $"{restPath} {op} {val}";
            // 同集合多條件以 AND 合併
            map[first] = map.TryGetValue(first, out var exist) ? $"{exist} and {rebuilt}" : rebuilt;
        }
        return map;
    }
    private static readonly Dictionary<Type, Func<string, object>> EnumStringMappers = new()
    {
        [typeof(LangCode)] = s => LangCodeExt.Normalize(s),
    };
    private static object ParseEnumFromString(Type enumType, string raw)
    {
        raw ??= string.Empty;
        // 1) 專用 mapping（LangCode: zh-tw/en...）
        if (EnumStringMappers.TryGetValue(enumType, out var map)) return map(raw);
        // 2) 通用：把 zh-tw -> zhtw 這種格式轉成 enum name 嘗試 parse
        var normalized = raw.Trim().Replace("-", "").Replace("_", "");
        try { return System.Enum.Parse(enumType, normalized, ignoreCase: true); } catch { }
        // 3) 通用：數字（若你有些 enum 仍用數值傳入）
        if (long.TryParse(raw.Trim(), out var n)) return System.Enum.ToObject(enumType, n);
        throw new FormatException($"Cannot parse '{raw}' to enum '{enumType.Name}'.");
    }
    // 解析單一子句：AnnouncementDetail.Lang = en
    private static bool TryParseSimpleClause(string seg, out string[] pathParts, out string op, out string? val)
    {
        // 宣告變數
        var m = Regex.Match(
            seg,
            @"^(?<fullPath>[\w.]+)\s*(?<op>=|&|!&|==|!=|>=|<=|>|<|in|not in|like|is null|is not null|hasany|hasallof|hasall)\s*(?<val>.+)?$",
            RegexOptions.IgnoreCase);

        pathParts = Array.Empty<string>();
        op = "";
        val = null;

        // 執行 function
        if (!m.Success) return false;

        var fullPath = m.Groups["fullPath"].Value;
        op = m.Groups["op"].Value;

        if (m.Groups["val"].Success)
        {
            var rawVal = m.Groups["val"].Value.Trim().Trim('\'', '"');
            val = UnescapeQuotedValue(rawVal);
        }

        pathParts = fullPath.Split('.');

        // return
        return pathParts.Length > 0;
    }
    // 判斷 modelType.nav 是否為 IEnumerable（非 string），並取 elementType
    private bool TryGetEnumerableElementType(Type modelType, string navName, out Type elementType)
    {
        elementType = typeof(object);
        var prop = ModelMetadata.GetProperty(modelType, navName);
        if (prop == null) return false;
        var t = prop.PropertyType;
        var isEnumerable = typeof(IEnumerable).IsAssignableFrom(t) && t != typeof(string);
        if (!isEnumerable) return false;
        if (t.IsArray)
        {
            elementType = t.GetElementType() ?? typeof(object);
            return true;
        }
        if (t.IsGenericType)
        {
            elementType = t.GetGenericArguments()[0];
            return true;
        }
        // fallback（很少見）
        elementType = typeof(object);
        return true;
    }

    // 合併：AnnouncementDetail.Any(Lang == @0 and Title != @1)
    private string? BuildMergedAnyClause(Type modelType, string navName, Type elementType, List<(string[] RestPath, string Op, string? Val)> clauses, ref List<object> args)
    {
        // 逐條在 elementType 上 BuildNestedClause，避免每條都各自 Any()
        var innerParts = new List<string>();
        foreach (var c in clauses)
        {
            var inner = BuildNestedClause(elementType, c.RestPath, c.Op, c.Val, ref args, 0);
            if (!string.IsNullOrEmpty(inner)) innerParts.Add(inner);
        }
        if (innerParts.Count == 0) return null;
        // 多條用 and 串（同一筆明細必須同時成立）
        var innerExpr = string.Join(" and ", innerParts);
        return $"{navName}.Any({innerExpr})";
    }

    /// <summary>
    /// 將外部 Form Model Select 欄位轉成 Root DbModel 欄位。
    /// </summary>
    private string[] MapSelectFields(string[] selectFields)
    {
        string[] result = [.. (selectFields ?? []).Select(field => FormModelMetadataResolver.MapFieldPathToRoot(typeof(TFormModel), field, ModelMetadata)).Where(field => !string.IsNullOrWhiteSpace(field))];
        return result.Length == 0 ? GetDefaultRootSelectFields() : result;
    }
    /// <summary>
    /// 將外部 Form Model 排序欄位轉成 Root DbModel 欄位。
    /// </summary>
    private static IReadOnlyList<OrderBySpec>? MapOrderBy(IReadOnlyList<OrderBySpec>? orderBy)
    {
        if (orderBy == null) return null;
        return [.. orderBy.Select(item => item with { Col = FormModelMetadataResolver.MapFieldPathToRoot(typeof(TFormModel), item.Col, ModelMetadata) })];
    }
    /// <summary>
    /// 將外部 Form Model RankGroup 轉成 Root DbModel 查詢條件。
    /// </summary>
    private static IReadOnlyList<RankGroupsSpec>? MapRankGroups(IReadOnlyList<RankGroupsSpec>? rankGroups)
    {
        if (rankGroups == null) return null;
        return [.. rankGroups.Select(group => group with
        {
            Condition = FormModelMetadataResolver.MapExpressionToRoot(typeof(TFormModel), group.Condition, ModelMetadata),
            OrderBy = MapOrderBy(group.OrderBy)
        })];
    }
    /// <summary>
    /// 合併目前表單固定資料範圍。
    /// </summary>
    private string ApplyDataScope(string condition)
    {
        return LibData.Merge(SysParam.QueryOperators.And, false, condition, DataScopeCondition);
    }
    /// <summary>
    /// 將 Root DbModel 清單組裝成 Form Model 清單。
    /// </summary>
    private static IList<TFormModel> BuildFormModelList(IList roots)
    {
        IList<TFormModel> result = [];
        foreach (object root in roots)
        {
            if (root is not DbModel rootModel) continue;
            result.Add(FormModelMetadataResolver.CreateFormModel<TFormModel>(rootModel));
        }
        return result;
    }
    /// <summary>
    /// 建立 Root DbModel 完整 Graph 查詢欄位。
    /// </summary>
    private string[] GetDefaultRootSelectFields()
    {
        List<string> result = [];
        AddDefaultRootSelectFields(RootDbModelType, string.Empty, result);
        return [.. result.Distinct(StringComparer.Ordinal)];
    }
    /// <summary>
    /// 遞迴加入目前 Graph 的 Root Scalar 與 InverseProperty Detail 欄位。
    /// </summary>
    private void AddDefaultRootSelectFields(Type modelType, string prefix, List<string> result)
    {
        foreach (PropertyInfo prop in ModelMetadata.GetProperties(modelType))
        {
            if (!prop.CanWrite) continue;
            Type? childType = GetGraphPropertyType(prop);
            if (childType == null)
            {
                bool isScalar = prop.PropertyType == typeof(byte[]) || (!LibData.IsListPropertyType(prop) && !typeof(DbModel).IsAssignableFrom(prop.PropertyType));
                if (isScalar && !prop.IsDefined(typeof(NotMappedAttribute), true)) result.Add(prefix + prop.Name);
                continue;
            }
            bool isCollection = typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && prop.PropertyType != typeof(string);
            if (!isCollection || !prop.IsDefined(typeof(InversePropertyAttribute), true) || !GraphRepo.ContainsRepo(childType)) continue;
            AddDefaultRootSelectFields(childType, prefix + prop.Name + ".", result);
        }
    }
    /// <summary>
    /// 取得 Property 對應的 DbModel 或集合元素型別。
    /// </summary>
    private static Type? GetGraphPropertyType(PropertyInfo prop)
    {
        Type propertyType = prop.PropertyType;
        if (typeof(DbModel).IsAssignableFrom(propertyType)) return propertyType;
        if (propertyType == typeof(string) || propertyType == typeof(byte[])) return null;
        if (!typeof(IEnumerable).IsAssignableFrom(propertyType)) return null;
        Type? itemType = propertyType.IsArray ? propertyType.GetElementType() : propertyType.GetGenericArguments().FirstOrDefault();
        return itemType != null && typeof(DbModel).IsAssignableFrom(itemType) ? itemType : null;
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
    /// 查詢所有排序分段資料。
    /// </summary>
    private async Task<IList<TFormModel>> QuerySegmentsAsync(IReadOnlyList<RankSegment> segments, string[] selectFields, string condition, IReadOnlyList<RankGroupsSpec> rankGroups)
    {
        IList<TFormModel> result = [];
        foreach (var seg in segments)
        {
            IList roots = await DoQueryListAsync(RootDbModelType, selectFields, seg.Where, seg.OrderBy, 0, 0, 0, condition, rankGroups);
            foreach (TFormModel item in BuildFormModelList(roots)) result.Add(item);
        }
        return result;
    }
    /// <summary>
    /// 查詢分頁排序分段資料。
    /// </summary>
    private async Task<IList<TFormModel>> QueryPagedSegmentsAsync(IReadOnlyList<RankSegment> segments, string[] selectFields, string condition, IReadOnlyList<RankGroupsSpec> rankGroups, int pageNumber, int pageSize)
    {
        IList<TFormModel> result = [];
        int globalSkip = (pageNumber - 1) * pageSize;
        int remaining = pageSize;
        foreach (var seg in segments)
        {
            if (remaining <= 0) break;
            int segCount = await DoQueryListCountAsync(RootDbModelType, seg.Where);
            if (globalSkip >= segCount) { globalSkip -= segCount; continue; }
            int take = Math.Min(remaining, segCount - globalSkip);
            IList roots = await DoQueryListAsync(RootDbModelType, selectFields, seg.Where, seg.OrderBy, 0, take, globalSkip, condition, rankGroups);
            foreach (TFormModel item in BuildFormModelList(roots)) result.Add(item);
            remaining -= take;
            globalSkip = 0;
        }
        return result;
    }
    /// <summary>
    /// 獲取 Header 與所有 Detail / SubDetail 集合。
    /// </summary>
    private void GetModelType(TFormModel data, out HeaderModel header, out Dictionary<string, IList> details)
    {
        DbModel rootModel = FormModelMetadataResolver.GetRootModel(data);
        header = rootModel as HeaderModel ?? throw new InvalidOperationException($"Root DbModel must inherit HeaderModel: {rootModel.GetType().FullName}");
        details = [];
        foreach ((string name, IList items) in CollectDetailLists(data)) details[name] = items;
    }
    /// <summary>
    /// 檢查資料是否被用。
    /// </summary>
    private void CheckIsUsed()
    {

    }
    /// <summary>
    /// 根據 InternalId 取得 Header 主鍵查詢條件。
    /// </summary>
    private async Task<string> GetPKConditionByInternalId(string internalId)
    {
        string resultCondition = string.Empty;
        PropertyInfo[] pkProps = ModelMetadata.GetProperties(RootDbModelType).Where(prop => prop.IsDefined(typeof(KeyAttribute), true)).ToArray();
        string condition = ApplyDataScope($"{nameof(HeaderModel.InternalId)} = \"{internalId}\"");
        string[] fieldNames = pkProps.Select(prop => prop.Name).ToArray();
        object? headerData = (await DoQueryListAsync(RootDbModelType, fieldNames, condition, default, 0, 0)).ToDynamicList().FirstOrDefault();
        if (headerData == null) return resultCondition;
        foreach (PropertyInfo pk in pkProps) resultCondition = LibData.Merge(SysParam.QueryOperators.And, false, resultCondition, $"{pk.Name} = \"{PropertyAccessor.Get(headerData, pk.Name)}\"");
        return ApplyDataScope(resultCondition);
    }
    /// <summary>
    /// 保留 Root 主鍵並同步回填 Graph 中同名關聯鍵。
    /// </summary>
    private void PreserveRootKeys(TFormModel oldData, TFormModel newData)
    {
        DbModel oldRoot = FormModelMetadataResolver.GetRootModel(oldData);
        DbModel newRoot = FormModelMetadataResolver.GetRootModel(newData);
        List<object> details = CollectDetailItems(newData);
        foreach (PropertyInfo key in ModelMetadata.GetAttrProperties(RootDbModelType, typeof(KeyAttribute)))
        {
            object? value = PropertyAccessor.Get(oldRoot, key.Name);
            PropertyAccessor.Set(newRoot, key.Name, value);
            foreach (object detail in details) SetMatchingProperty(detail, key.Name, value);
        }
    }
    /// <summary>
    /// 回填物件上存在且可寫入的同名 Property。
    /// </summary>
    private void SetMatchingProperty(object target, string propertyName, object? value)
    {
        PropertyInfo? property = ModelMetadata.GetProperty(target.GetType(), propertyName);
        if (property?.CanWrite == true) PropertyAccessor.Set(target, propertyName, value);
    }
    /// <summary>
    /// 保留建立資訊，避免外部覆蓋系統欄位。
    /// </summary>
    private void PreserveCreateInfo(TFormModel oldData, TFormModel newData)
    {
        DbModel oldRoot = FormModelMetadataResolver.GetRootModel(oldData);
        DbModel newRoot = FormModelMetadataResolver.GetRootModel(newData);
        PropertyAccessor.Set(newRoot, nameof(HeaderModel.CreateUserId), PropertyAccessor.Get(oldRoot, nameof(HeaderModel.CreateUserId)));
        PropertyAccessor.Set(newRoot, nameof(HeaderModel.CreateTime), PropertyAccessor.Get(oldRoot, nameof(HeaderModel.CreateTime)));
    }
    /// <summary>
    /// 同步 Detail / SubDetail 新增、修改、刪除。
    /// </summary>
    private async Task SyncDetailItemsAsync(TFormModel oldData, TFormModel newData)
    {
        Dictionary<Type, List<object>> oldItems = CollectDetailItemsByType(oldData);
        Dictionary<Type, List<object>> newItems = CollectDetailItemsByType(newData);
        foreach (Type type in oldItems.Keys.Union(newItems.Keys)) await SyncDetailTypeAsync(type, oldItems.GetValueOrDefault(type) ?? [], newItems.GetValueOrDefault(type) ?? []);
    }
    /// <summary>
    /// 同步單一 Detail 型別資料。
    /// </summary>
    private async Task SyncDetailTypeAsync(Type type, List<object> oldItems, List<object> newItems)
    {
        var repo = (dynamic)GetRepoByType(type);
        var keyProps = ModelMetadata.GetAttrProperties(type, typeof(KeyAttribute));
        var nonKeyProps = ModelMetadata.GetProperties(type).Where(p => !keyProps.Select(k => k.Name).ToHashSet().Contains(p.Name)).ToList();
        var oldDict = oldItems.ToDictionary(item => BuildKey(item, keyProps));
        var newDict = newItems.ToDictionary(item => BuildKey(item, keyProps));
        foreach (var key in oldDict.Keys.Intersect(newDict.Keys)) if (HasDifferentValue(oldDict[key], newDict[key], nonKeyProps)) await repo.UpdateAsync(oldDict[key], newDict[key]);
        foreach (var key in oldDict.Keys.Except(newDict.Keys)) await repo.DeleteAsync(oldDict[key]);
        foreach (var key in newDict.Keys.Except(oldDict.Keys)) await repo.CreateAsync(newDict[key]);
    }
    /// <summary>
    /// 收集聚合內所有 Detail / SubDetail 資料。
    /// </summary>
    private List<object> CollectDetailItems(object source)
    {
        List<object> result = [];
        foreach ((string _, IList items) in CollectDetailLists(source)) foreach (object item in items) if (item != null) result.Add(item);
        return result;
    }
    /// <summary>
    /// 依型別收集聚合內所有 Detail / SubDetail 資料。
    /// </summary>
    private Dictionary<Type, List<object>> CollectDetailItemsByType(object source)
    {
        Dictionary<Type, List<object>> result = [];
        foreach (object item in CollectDetailItems(source))
        {
            Type type = item.GetType();
            if (!result.TryGetValue(type, out List<object>? list)) result[type] = list = [];
            list.Add(item);
        }
        return result;
    }
    /// <summary>
    /// 收集目前 Form Graph 內所有集合屬性。
    /// </summary>
    private List<(string Name, IList Items)> CollectDetailLists(object source)
    {
        List<(string Name, IList Items)> result = [];
        CollectDetailListsCore(source, result, [], []);
        return result;
    }
    /// <summary>
    /// 依 Form Model 與 InverseProperty 規則遞迴收集 Graph 集合。
    /// </summary>
    private void CollectDetailListsCore(object source, List<(string Name, IList Items)> result, HashSet<object> visitedModels, HashSet<object> visitedLists)
    {
        if (source == null || !visitedModels.Add(source)) return;
        bool isFormContainer = source.GetType() == typeof(TFormModel) && source is not DbModel;
        foreach (PropertyInfo prop in ModelMetadata.GetProperties(source.GetType()))
        {
            Type? childType = GetGraphPropertyType(prop);
            if (childType == null || !GraphRepo.ContainsRepo(childType)) continue;
            object? value = PropertyAccessor.Get(source, prop.Name);
            if (value is IList list && (isFormContainer || prop.IsDefined(typeof(InversePropertyAttribute), true)))
            {
                if (visitedLists.Add(list)) result.Add((prop.Name, list));
                foreach (object item in list) CollectDetailListsCore(item, result, visitedModels, visitedLists);
                continue;
            }
            if (isFormContainer && value is DbModel childModel) CollectDetailListsCore(childModel, result, visitedModels, visitedLists);
        }
    }
    /// <summary>
    /// 建立 Detail 主鍵字串。
    /// </summary>
    private string BuildKey(object item, IEnumerable<PropertyInfo> keyProps)
    {
        return string.Join("|", keyProps.Select(k => PropertyAccessor.Get(item, k.Name)?.ToString() ?? "null"));
    }
    /// <summary>
    /// 判斷非主鍵欄位是否有變更。
    /// </summary>
    private bool HasDifferentValue(object oldItem, object newItem, IEnumerable<PropertyInfo> props)
    {
        foreach (var prop in props) if (!object.Equals(PropertyAccessor.Get(oldItem, prop.Name), PropertyAccessor.Get(newItem, prop.Name))) return true;
        return false;
    }
    private static LambdaExpression BuildIdSelectorLambda(Type modelType, PropertyInfo prop)
    {
        var param = Expression.Parameter(modelType, "p");
        var propertyAccess = Expression.Property(param, prop.Name);
        Expression body = propertyAccess.Type == typeof(string) ? (Expression)propertyAccess : Expression.Call(propertyAccess, "ToString", Type.EmptyTypes);
        var delegateType = typeof(Func<,>).MakeGenericType(modelType, typeof(string));
        return Expression.Lambda(delegateType, body, param);
    }
    /// <summary>
    /// 
    /// </summary>
    /// <param name="modelType"></param>
    /// <returns></returns>
    private object GetRepoByType(Type modelType)
    {
        if (GraphRepo.ContainsRepo(modelType)) return GraphRepo.GetRepo(modelType);
        return DbRepositoryProvider.GetRepo(modelType);
    }
    private static int? TryGetRowId(object? obj)
    {
        if (obj == null) return null;
        var p = obj.GetType().GetProperty("RowId");
        if (p == null) return null;
        var v = p.GetValue(obj);
        if (v is int i) return i;
        return null;
    }
    /// <summary>
    /// 將搜尋的結果扁平化成TFormModel型
    /// </summary>
    /// <param name="headerProp"></param>
    /// <param name="data"></param>
    /// <returns></returns>
    private TFormModel BuildSetFromData(PropertyInfo headerProp, object data)
    {
        // 建 TFormModel 實例 + 先塞回 header（data1）
        var set = PropertyAccessor.CreateInstance<TFormModel>();
        PropertyAccessor.Set(set, headerProp.Name, data);
        // 快取 TFormModel 的屬性字典（O(1) 查找）
        var setProps = ModelMetadata.GetProperties<TFormModel>();
        var setPropDict = setProps.ToDictionary(p => p.Name, p => p, StringComparer.Ordinal);
        // 迭代 DFS：避免深層遞迴與 StackOverflow
        var visited = new HashSet<int>();
        var stack = new Stack<object>();
        stack.Push(data);
        while (stack.Count > 0)
        {
            var node = stack.Pop();
            if (node == null) continue;

            // 參考等值去重
            var id = RuntimeHelpers.GetHashCode(node);
            if (!visited.Add(id)) continue;

            var nodeType = node.GetType();
            var nodeProps = ModelMetadata.GetProperties(nodeType);

            foreach (var p in nodeProps)
            {
                if (IsListPropertyType(p))
                {
                    var raw = PropertyAccessor.Get(node, p.Name) as IEnumerable;
                    if (raw == null) continue;

                    // 把清單中的子項推進 stack（讓下一層的清單也能被處理）
                    foreach (var item in raw)
                    {
                        if (item != null) stack.Push(item);
                    }

                    // 規則 1：用屬性名（去底線）直配 TFormModel
                    var targetName = p.Name.Trim('_');
                    if (!AssignToSet(targetName, raw))
                    {
                        // 規則 2：用元素型別名或型別名+List
                        var elemType = GetEnumerableElementType(p.PropertyType);
                        if (elemType != null)
                        {
                            if (!AssignToSet(elemType.Name, raw))
                            {
                                AssignToSet(elemType.Name + "List", raw);
                            }
                        }
                    }
                }
                else if (ShouldDescendInto(p))
                {
                    var child = PropertyAccessor.Get(node, p.Name);
                    if (child != null) stack.Push(child);
                }
            }
        }
        return set;
        // ====== local functions ======
        bool AssignToSet(string name, IEnumerable raw)
        {
            if (!setPropDict.TryGetValue(name, out var dstProp)) return false;

            var targetType = dstProp.PropertyType;
            var elemType = GetEnumerableElementType(targetType) ?? typeof(object);

            // 1) 先拿現在 TFormModel 上的清單（若沒有就新建一個 List<T>）
            var currentObj = PropertyAccessor.Get(set!, dstProp.Name);
            IList targetList;

            if (currentObj is IList existingList
                && existingList.GetType().IsGenericType
                && existingList.GetType().GetGenericArguments()[0].IsAssignableFrom(elemType))
            {
                // 已有同型別/相容清單 → 直接累加
                targetList = existingList;
            }
            else
            {
                // 沒有或型別不相容 → 建新的 List<TElem>
                var listType = typeof(List<>).MakeGenericType(elemType);
                targetList = (IList)Activator.CreateInstance(listType)!;
            }

            // 2) 累加來源（必要時做元素型別轉換）
            foreach (var item in raw)
            {
                targetList.Add(ChangeIfNeeded(item, elemType));
            }

            // 3) 若是新建的清單或原本為 null，指回 TFormModel
            if (!ReferenceEquals(targetList, currentObj))
            {
                PropertyAccessor.Set(set!, dstProp.Name, targetList);
            }

            return true;
        }
        static object? ChangeIfNeeded(object? item, Type targetElem)
        {
            if (item == null) return null;
            var t = item.GetType();
            if (targetElem.IsAssignableFrom(t)) return item;

            try { return Convert.ChangeType(item, targetElem); }
            catch { return item; }
        }
        static bool IsListPropertyType(PropertyInfo p)
        {
            if (p.PropertyType == typeof(string)) return false;
            return typeof(IEnumerable).IsAssignableFrom(p.PropertyType);
        }
        static bool ShouldDescendInto(PropertyInfo p)
        {
            var t = p.PropertyType;
            if (t == typeof(string)) return false;
            if (typeof(IEnumerable).IsAssignableFrom(t)) return false; // 清單在上面處理
            return !t.IsValueType && !t.IsPrimitive;
        }
        static Type? GetEnumerableElementType(Type t)
        {
            if (t.IsGenericType)
            {
                var g = t.GetGenericTypeDefinition();
                if (g == typeof(IEnumerable<>) || g == typeof(IList<>) ||
                    g == typeof(ICollection<>) || g == typeof(IReadOnlyList<>) ||
                    g == typeof(List<>))
                {
                    return t.GetGenericArguments()[0];
                }
            }
            var i = t.GetInterfaces().FirstOrDefault(x => x.IsGenericType && x.GetGenericTypeDefinition() == typeof(IEnumerable<>));
            return i?.GetGenericArguments()[0];
        }
        static object? ConvertEnumerableToTarget(IEnumerable src, Type targetType)
        {
            var elemType = GetEnumerableElementType(targetType) ?? typeof(object);
            var listType = typeof(List<>).MakeGenericType(elemType);
            var list = (IList)Activator.CreateInstance(listType)!;
            foreach (var item in src) list.Add(item);
            if (targetType.IsAssignableFrom(listType)) return list;
            var ctor = targetType.GetConstructor([listType]);
            if (ctor != null) return ctor.Invoke([list]);
            return null;
        }
    }
    // 產生 RankGroups 的最終 where condition（FirstMatchWins + Rest）
    private sealed record RankGroupPlan(IReadOnlyList<string> GroupWhereList, string RestWhere, string BaseWhere);
    // 將 base condition + rankGroups 組成：
    // group0 = Base AND (G0)
    // group1 = Base AND NOT(G0) AND (G1)
    // ...
    // rest  = Base AND NOT(G0 OR G1 OR ...)
    private static RankGroupPlan BuildRankGroupPlan(string baseCond, IReadOnlyList<RankGroupsSpec> groups)
    {
        // 宣告變數
        var groupWhereList = new List<string>();
        var groupOrList = new List<string>();

        // 執行 function
        for (int i = 0; i < groups.Count; i++)
        {
            var g = groups[i];
            if (string.IsNullOrWhiteSpace(g.Condition)) continue;

            // 1) 先做 base AND group
            var where = MergeAnd(baseCond, g.Condition);

            // 2) 後續 group 要排除前面的 group（優先排序）
            if (groupOrList.Count > 0)
            {
                var prevOr = string.Join(" or ", groupOrList.Select(x => $"({x})"));
                where = MergeAnd(where, NotExpr(prevOr)); // ✅ 不用 not(...)
            }

            groupWhereList.Add(where);
            groupOrList.Add(g.Condition);
        }

        // 3) Rest = base AND NOT(any group)
        var restWhere = baseCond;
        if (groupOrList.Count > 0)
        {
            var allOr = string.Join(" or ", groupOrList.Select(x => $"({x})"));
            restWhere = MergeAnd(baseCond, NotExpr(allOr)); // ✅ 不用 not(...)
        }
        var baseWhere = NormalizeBaseWhere(baseCond);


        // return
        return new RankGroupPlan(groupWhereList, restWhere, baseWhere);
    }

    // 將 base condition 轉成可安全串接的片段
    private static string NormalizeBaseWhere(string baseCondition)
    {
        // 宣告變數
        var trimmed = (baseCondition ?? string.Empty).Trim();
        // 執行 function
        if (string.IsNullOrWhiteSpace(trimmed)) trimmed = "true";
        // return
        return trimmed;
    }
    private sealed record RankSegment(string Where, IReadOnlyList<OrderBySpec>? OrderBy);

    private static List<RankSegment> BuildRankSegments(RankGroupPlan plan, IReadOnlyList<RankGroupsSpec>? rankGroups, IReadOnlyList<OrderBySpec>? baseOrderBy)
    {
        // 宣告變數
        var result = new List<RankSegment>();
        var groups = rankGroups?.Where(g => !string.IsNullOrWhiteSpace(g.Condition)).ToList() ?? new List<RankGroupsSpec>();

        // 執行 function：每個 group 用自己的 orderBy（若沒給就 fallback baseOrderBy）
        for (int i = 0; i < plan.GroupWhereList.Count; i++)
        {
            var gOrderBy = groups[i].OrderBy ?? baseOrderBy;
            result.Add(new RankSegment(plan.GroupWhereList[i], gOrderBy));
        }

        // Rest 段：用 baseOrderBy
        result.Add(new RankSegment(plan.RestWhere, baseOrderBy));

        // return
        return result;
    }

    private static string MergeAnd(string a, string b)
    {
        // 宣告變數
        var aa = (a ?? "").Trim();
        var bb = (b ?? "").Trim();

        // 執行 function
        if (string.IsNullOrWhiteSpace(aa)) return bb;
        if (string.IsNullOrWhiteSpace(bb)) return aa;

        // return
        return $"({aa}) and ({bb})";
    }
    private static string NotExpr(string expr)
    {
        // 宣告變數
        var e = (expr ?? "").Trim();

        // 執行 function
        if (string.IsNullOrWhiteSpace(e)) return "true";

        // return（交給 NormalizeRec 去把裡面的子句轉成 bool）
        return $"not ({e})";
    }
    // 過濾掉空的 group condition，並保持順序
    private static List<RankGroupsSpec> NormalizeRankGroups(IReadOnlyList<RankGroupsSpec>? rankGroups)
    {
        // 宣告變數
        var result = new List<RankGroupsSpec>();
        // 執行 function
        if (rankGroups == null) return result;
        foreach (var g in rankGroups)
        {
            if (string.IsNullOrWhiteSpace(g.Condition)) continue;
            result.Add(g);
        }
        // return
        return result;
    }

    // 產出每個 group 的 where（含前序 NOT）
    private static List<string> BuildGroupWhereList(string baseWhere, List<RankGroupsSpec> groups)
    {
        // 宣告變數
        var list = new List<string>();
        // 執行 function
        for (int i = 0; i < groups.Count; i++)
        {
            var gWhere = Wrap(groups[i].Condition);
            var prevNot = BuildPrevNot(groups, i); // NOT(G0 OR ... OR G(i-1))
            var full = string.IsNullOrWhiteSpace(prevNot) ? $"{Wrap(baseWhere)} and {gWhere}" : $"{Wrap(baseWhere)} and {prevNot} and {gWhere}";
            list.Add(full);
        }
        // return
        return list;
    }

    // rest = Base AND NOT(G0 OR G1 OR ...)
    private static string BuildRestWhere(string baseWhere, List<RankGroupsSpec> groups)
    {
        // 宣告變數
        var any = BuildAnyOr(groups);
        // 執行 function
        if (string.IsNullOrWhiteSpace(any)) return baseWhere;
        // return
        return $"{Wrap(baseWhere)} and not {any}";
    }

    // 產生 NOT( G0 OR ... OR G(i-1) )
    private static string BuildPrevNot(List<RankGroupsSpec> groups, int endExclusive)
    {
        // 宣告變數
        if (endExclusive <= 0) return string.Empty;
        // 執行 function
        var any = BuildAnyOr(groups.Take(endExclusive).ToList());
        if (string.IsNullOrWhiteSpace(any)) return string.Empty;
        // return
        return $"not {any}";
    }

    // 產生 (G0) OR (G1) OR ...
    private static string BuildAnyOr(List<RankGroupsSpec> groups)
    {
        // 宣告變數
        var parts = groups.Select(g => g.Condition?.Trim()).Where(s => !string.IsNullOrWhiteSpace(s)).Select(Wrap).ToArray();
        // 執行 function
        if (parts.Length == 0) return string.Empty;
        // return
        return "(" + string.Join(" or ", parts) + ")";
    }

    // 確保子條件都有括號（避免 and/or precedence 出事）
    private static string Wrap(string s)
    {
        // 宣告變數
        var t = (s ?? string.Empty).Trim();
        // 執行 function
        if (string.IsNullOrWhiteSpace(t)) return "(true)";
        if (t.StartsWith("(") && t.EndsWith(")")) return t;
        // return
        return "(" + t + ")";
    }
    /// <summary>
    /// 建立條件用的強型別陣列，避免 Dynamic LINQ Contains 無法推斷型別。
    /// </summary>
    private static Array BuildTypedConditionArray(string[] values, Type targetType)
    {
        // 宣告變數
        var array = Array.CreateInstance(targetType, values.Length);

        // 執行 function：逐筆轉成欄位實際型別
        for (int i = 0; i < values.Length; i++)
        {
            array.SetValue(ConvertConditionValue(values[i], targetType), i);
        }

        // return
        return array;
    }

    /// <summary>
    /// 轉換條件值，支援 enum / Guid / 一般型別。
    /// </summary>
    private static object ConvertConditionValue(string raw, Type targetType)
    {
        // 宣告變數
        var value = raw.Trim().Trim('\'', '"');

        // 執行 function：依欄位型別轉換
        if (targetType.IsEnum) return ParseEnumFromString(targetType, value);
        if (targetType == typeof(Guid)) return Guid.Parse(value);
        if (targetType == typeof(string)) return value;

        // return
        return Convert.ChangeType(value, targetType);
    }

    /// <summary>
    /// 建立 in / not in 條件式，nullable value type 需先判斷 null。
    /// </summary>
    private static string BuildInConditionExpr(string fieldExpr, Type fieldType, bool isIn, int paramIndex)
    {
        // 宣告變數
        var isNullableValueType = Nullable.GetUnderlyingType(fieldType) != null;

        // 執行 function：非 nullable 欄位可直接比對
        if (!isNullableValueType)
            return isIn ? $"@{paramIndex}.Contains({fieldExpr})" : $"!@{paramIndex}.Contains({fieldExpr})";

        // return：nullable 欄位需用 Value 比對
        return isIn
            ? $"{fieldExpr} != null && @{paramIndex}.Contains({fieldExpr}.Value)"
            : $"{fieldExpr} == null || !@{paramIndex}.Contains({fieldExpr}.Value)";
    }

    /// <summary>
    /// 更新前先補齊新明細的 RowId，避免 newDict 建 key 時 RowId 仍為 null。
    /// </summary>
    private static void EnsureNewDetailRowIds(IList? oldValue, IList? newValue)
    {
        if (newValue == null) return;
        var nextRowId = Math.Max(GetMaxRowId(oldValue), GetMaxRowId(newValue)) + 1;
        foreach (var item in newValue)
        {
            if (item is not DetailModel) continue;
            var rowId = TryGetRowId(item);
            if (rowId.GetValueOrDefault() > 0) continue;
            SetRowId(item, nextRowId++);
        }
    }
    /// <summary>
    /// 取得清單中的最大 RowId。
    /// </summary>
    private static int GetMaxRowId(IList? list)
    {
        if (list == null) return 0;
        return list.Cast<object>().Select(p => TryGetRowId(p) ?? 0).DefaultIfEmpty(0).Max();
    }
    /// <summary>
    /// 設定 RowId，支援 int / int?。
    /// </summary>
    private static void SetRowId(object obj, int rowId)
    {
        var prop = obj.GetType().GetProperty("RowId");
        if (prop == null || !prop.CanWrite) return;
        prop.SetValue(obj, rowId);
    }
    #endregion
}
