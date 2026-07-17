using System.Collections;
using System.ComponentModel.DataAnnotations;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using System.Reflection;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Form;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Repo;
using WCMS.SysCore.FeatureDriver.Repo.Graph;
using WCMS.SysCore.FeatureDriver.Repo.Operations.Query;
using WCMS.SysCore.FeatureDriver.Runtime;
using WCMS.SysCore.Library;
using static WCMS.SysCore.FeatureDriver.Model.Contracts.QueryListParam;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Query;

/// <summary>
/// 協調 Form 查詢映射、Expression、Ranking 與 Repository 執行。
/// </summary>
internal sealed class FormQueryOperations<TFormModel>(
    FormGraphRepoScope<TFormModel> graphRepo,
    DbRepositoryProvider dbRepositoryProvider,
    ModelTypeMetadataCache modelMetadata,
    PropertyAccessorCache propertyAccessor,
    FormDefaultSelectFieldResolver<TFormModel> defaultSelectFieldResolver,
    FormConditionExpressionBuilder conditionBuilder,
    FormProjectionExpressionBuilder projectionBuilder,
    Func<string> dataScopeAccessor)
    where TFormModel : class
{
    #region Property
    private FormGraphRepoScope<TFormModel> GraphRepo { get; } = graphRepo;
    private DbRepositoryProvider DbRepositoryProvider { get; } = dbRepositoryProvider;
    private ModelTypeMetadataCache ModelMetadata { get; } = modelMetadata;
    private PropertyAccessorCache PropertyAccessor { get; } = propertyAccessor;
    private FormDefaultSelectFieldResolver<TFormModel> DefaultSelectFieldResolver { get; }
        = defaultSelectFieldResolver;
    private FormConditionExpressionBuilder ConditionBuilder { get; } = conditionBuilder;
    private FormProjectionExpressionBuilder ProjectionBuilder { get; } = projectionBuilder;
    private Func<string> DataScopeAccessor { get; } = dataScopeAccessor;
    private Type RootDbModelType => GraphRepo.RootDbModelType;
    #endregion

    #region Internal
    /// <summary>
    /// 依 InternalId 查詢完整 Form Aggregate。
    /// </summary>
    internal async Task<TFormModel> QueryDataAsync(
        string internalId,
        CancellationToken ct = default)
    {
        string condition = await GetPrimaryKeyConditionAsync(internalId, ct);
        if (condition.IsNullOrEmpty()) return default!;
        IList roots = await QueryRawListAsync(
            RootDbModelType,
            DefaultSelectFieldResolver.Resolve(),
            condition,
            default,
            0,
            0,
            ct: ct);
        return BuildFormModelList(roots).FirstOrDefault()!;
    }
    /// <summary>
    /// 查詢 Form Aggregate 清單。
    /// </summary>
    internal async Task<IList<TFormModel>> QueryListAsync(
        string[] selectFields,
        string condition,
        IReadOnlyList<OrderBySpec>? orderBy,
        IReadOnlyList<RankGroupsSpec>? rankGroups,
        int pageNumber,
        int pageSize,
        CancellationToken ct = default)
    {
        string[] rootFields = MapSelectFields(selectFields);
        string rootCondition = MapAndScopeCondition(condition);
        IReadOnlyList<OrderBySpec>? rootOrderBy = MapOrderBy(orderBy);
        IReadOnlyList<RankGroupsSpec>? rootRankGroups = MapRankGroups(rankGroups);
        if (rootRankGroups == null || rootRankGroups.Count == 0)
            return await QueryStandardListAsync(
                rootFields,
                rootCondition,
                rootOrderBy,
                pageNumber,
                pageSize,
                ct);
        return await QueryRankedListAsync(
            rootFields,
            rootCondition,
            rootOrderBy,
            rootRankGroups,
            pageNumber,
            pageSize,
            ct);
    }
    /// <summary>
    /// 查詢符合條件的 Form Aggregate 總筆數。
    /// </summary>
    internal async Task<int> QueryTotalCountAsync(
        string condition,
        CancellationToken ct = default)
    {
        string rootCondition = FormModelMetadataResolver.MapExpressionToRoot(
            typeof(TFormModel),
            condition,
            ModelMetadata);
        return await QueryCountAsync(
            RootDbModelType,
            ApplyDataScope(rootCondition),
            ct);
    }
    /// <summary>
    /// 依 Entity 型別建立 RepositoryQueryOptions 並查詢清單。
    /// </summary>
    internal async Task<IList> QueryRawListAsync(
        Type type,
        string[] selectFields,
        string queryCondition,
        IReadOnlyList<OrderBySpec>? orderBy,
        int pageNumber,
        int pageSize,
        int skipCount = 0,
        string? detailFilterCondition = null,
        IReadOnlyList<RankGroupsSpec>? detailRankGroups = null,
        CancellationToken ct = default)
    {
        LambdaExpression whereExpression = ConditionBuilder.Build(
            type,
            queryCondition);
        LambdaExpression filterExpression = ConditionBuilder.Build(
            type,
            detailFilterCondition ?? queryCondition);
        Dictionary<string, LambdaExpression> detailFilterMap =
            FormProjectionExpressionBuilder.ExtractDetailPredicateMap(
                type,
                filterExpression);
        Dictionary<string, List<LambdaExpression>> detailRankMap =
            ProjectionBuilder.BuildDetailRankMap(type, detailRankGroups);
        LambdaExpression? selectExpression = ProjectionBuilder.Build(
            type,
            selectFields,
            detailFilterMap,
            detailRankMap);
        RepositoryQueryOptions options = CreateQueryOptions(
            selectExpression,
            whereExpression,
            orderBy,
            pageNumber,
            pageSize,
            skipCount);
        dynamic repo = ResolveRepo(type);
        return await repo.QueryListAsync(options, ct);
    }
    /// <summary>
    /// 依 Entity 型別查詢總筆數。
    /// </summary>
    internal async Task<int> QueryCountAsync(
        Type type,
        string condition,
        CancellationToken ct = default)
    {
        LambdaExpression whereExpression = ConditionBuilder.Build(type, condition);
        dynamic repo = ResolveRepo(type);
        return await repo.QueryListCountAsync(whereExpression, ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立 Repository 查詢設定。
    /// </summary>
    private static RepositoryQueryOptions CreateQueryOptions(
        LambdaExpression? selectExpression,
        LambdaExpression whereExpression,
        IReadOnlyList<OrderBySpec>? orderBy,
        int pageNumber,
        int pageSize,
        int skipCount)
    {
        return new RepositoryQueryOptions
        {
            SelectExpression = selectExpression,
            WhereExpression = whereExpression,
            OrderBy = orderBy,
            PageNumber = pageNumber,
            PageSize = pageSize,
            SkipCount = skipCount,
        };
    }
    /// <summary>
    /// 執行沒有 RankGroup 的一般清單查詢。
    /// </summary>
    private async Task<IList<TFormModel>> QueryStandardListAsync(
        string[] fields,
        string condition,
        IReadOnlyList<OrderBySpec>? orderBy,
        int pageNumber,
        int pageSize,
        CancellationToken ct)
    {
        IList roots = await QueryRawListAsync(
            RootDbModelType,
            fields,
            condition,
            orderBy,
            pageNumber,
            pageSize,
            ct: ct);
        return BuildFormModelList(roots);
    }
    /// <summary>
    /// 依 RankGroup 分段執行清單查詢。
    /// </summary>
    private async Task<IList<TFormModel>> QueryRankedListAsync(
        string[] fields,
        string condition,
        IReadOnlyList<OrderBySpec>? orderBy,
        IReadOnlyList<RankGroupsSpec> rankGroups,
        int pageNumber,
        int pageSize,
        CancellationToken ct)
    {
        IReadOnlyList<RankSegment> segments = RankGroupQueryPlanner
            .BuildSegments(condition, rankGroups, orderBy);
        if (pageNumber <= 0 || pageSize <= 0)
            return await QuerySegmentsAsync(
                segments,
                fields,
                condition,
                rankGroups,
                ct);
        return await QueryPagedSegmentsAsync(
            segments,
            fields,
            condition,
            rankGroups,
            pageNumber,
            pageSize,
            ct);
    }
    /// <summary>
    /// 查詢所有 RankGroup 分段資料。
    /// </summary>
    private async Task<IList<TFormModel>> QuerySegmentsAsync(
        IReadOnlyList<RankSegment> segments,
        string[] fields,
        string condition,
        IReadOnlyList<RankGroupsSpec> rankGroups,
        CancellationToken ct)
    {
        IList<TFormModel> result = [];
        foreach (RankSegment segment in segments)
        {
            IList roots = await QuerySegmentAsync(
                segment,
                fields,
                condition,
                rankGroups,
                0,
                0,
                ct);
            AppendFormModels(result, roots);
        }
        return result;
    }
    /// <summary>
    /// 查詢跨 RankGroup 分段的指定頁面。
    /// </summary>
    private async Task<IList<TFormModel>> QueryPagedSegmentsAsync(
        IReadOnlyList<RankSegment> segments,
        string[] fields,
        string condition,
        IReadOnlyList<RankGroupsSpec> rankGroups,
        int pageNumber,
        int pageSize,
        CancellationToken ct)
    {
        IList<TFormModel> result = [];
        int globalSkip = (pageNumber - 1) * pageSize;
        int remaining = pageSize;
        foreach (RankSegment segment in segments)
        {
            if (remaining <= 0) break;
            PagedSegmentState state = await AppendPagedSegmentAsync(
                result,
                segment,
                fields,
                condition,
                rankGroups,
                globalSkip,
                remaining,
                ct);
            globalSkip = state.GlobalSkip;
            remaining = state.Remaining;
        }
        return result;
    }
    /// <summary>
    /// 將單一 RankGroup 分段的頁面資料加入結果。
    /// </summary>
    private async Task<PagedSegmentState> AppendPagedSegmentAsync(
        IList<TFormModel> result,
        RankSegment segment,
        string[] fields,
        string condition,
        IReadOnlyList<RankGroupsSpec> rankGroups,
        int globalSkip,
        int remaining,
        CancellationToken ct)
    {
        int count = await QueryCountAsync(RootDbModelType, segment.Where, ct);
        if (globalSkip >= count)
            return new PagedSegmentState(globalSkip - count, remaining);
        int take = Math.Min(remaining, count - globalSkip);
        IList roots = await QuerySegmentAsync(
            segment,
            fields,
            condition,
            rankGroups,
            globalSkip,
            take,
            ct);
        AppendFormModels(result, roots);
        return new PagedSegmentState(0, remaining - take);
    }
    /// <summary>
    /// 執行單一 RankGroup 分段查詢。
    /// </summary>
    private async Task<IList> QuerySegmentAsync(
        RankSegment segment,
        string[] fields,
        string detailCondition,
        IReadOnlyList<RankGroupsSpec> rankGroups,
        int skip,
        int take,
        CancellationToken ct)
    {
        return await QueryRawListAsync(
            RootDbModelType,
            fields,
            segment.Where,
            segment.OrderBy,
            0,
            take,
            skip,
            detailCondition,
            rankGroups,
            ct);
    }
    /// <summary>
    /// 將 Root Entity 清單組裝並加入 Form Model 結果。
    /// </summary>
    private static void AppendFormModels(
        IList<TFormModel> result,
        IList roots)
    {
        foreach (TFormModel item in BuildFormModelList(roots)) result.Add(item);
    }
    /// <summary>
    /// 將外部 Form Select 欄位轉成 Root Entity 欄位。
    /// </summary>
    private string[] MapSelectFields(string[] selectFields)
    {
        string[] result = [.. (selectFields ?? [])
            .Select(field => FormModelMetadataResolver.MapFieldPathToRoot(
                typeof(TFormModel),
                field,
                ModelMetadata))
            .Where(field => !string.IsNullOrWhiteSpace(field))];
        return result.Length == 0
            ? DefaultSelectFieldResolver.Resolve()
            : result;
    }
    /// <summary>
    /// 將外部 Form 排序欄位轉成 Root Entity 欄位。
    /// </summary>
    private IReadOnlyList<OrderBySpec>? MapOrderBy(
        IReadOnlyList<OrderBySpec>? orderBy)
    {
        if (orderBy == null) return null;
        return [.. orderBy.Select(item => item with
        {
            Col = FormModelMetadataResolver.MapFieldPathToRoot(
                typeof(TFormModel),
                item.Col,
                ModelMetadata)
        })];
    }
    /// <summary>
    /// 將外部 Form RankGroup 轉成 Root Entity 查詢條件。
    /// </summary>
    private IReadOnlyList<RankGroupsSpec>? MapRankGroups(
        IReadOnlyList<RankGroupsSpec>? rankGroups)
    {
        if (rankGroups == null) return null;
        return [.. rankGroups.Select(group => group with
        {
            Condition = FormModelMetadataResolver.MapExpressionToRoot(
                typeof(TFormModel),
                group.Condition,
                ModelMetadata),
            OrderBy = MapOrderBy(group.OrderBy)
        })];
    }
    /// <summary>
    /// 將 Form 條件映射至 Root 並套用固定資料範圍。
    /// </summary>
    private string MapAndScopeCondition(string condition)
    {
        string rootCondition = FormModelMetadataResolver.MapExpressionToRoot(
            typeof(TFormModel),
            condition,
            ModelMetadata);
        return ApplyDataScope(rootCondition);
    }
    /// <summary>
    /// 合併目前表單固定資料範圍。
    /// </summary>
    private string ApplyDataScope(string condition)
    {
        return LibData.Merge(
            SysParam.QueryOperators.And,
            false,
            condition,
            DataScopeAccessor());
    }
    /// <summary>
    /// 將 Root Entity 清單組裝成 Form Model 清單。
    /// </summary>
    private static IList<TFormModel> BuildFormModelList(IList roots)
    {
        IList<TFormModel> result = [];
        foreach (object root in roots)
            if (root is DbModel rootModel)
                result.Add(FormModelMetadataResolver
                    .CreateFormModel<TFormModel>(rootModel));
        return result;
    }
    /// <summary>
    /// 依 InternalId 取得 Root Primary Key 條件。
    /// </summary>
    private async Task<string> GetPrimaryKeyConditionAsync(
        string internalId,
        CancellationToken ct)
    {
        PropertyInfo[] keys = ModelMetadata.GetProperties(RootDbModelType)
            .Where(property => property.IsDefined(typeof(KeyAttribute), true))
            .ToArray();
        object? root = await QueryPrimaryKeyFieldsAsync(internalId, keys, ct);
        if (root == null) return string.Empty;
        string result = string.Empty;
        foreach (PropertyInfo key in keys)
            result = MergePrimaryKeyCondition(result, root, key);
        return ApplyDataScope(result);
    }
    /// <summary>
    /// 依 InternalId 查詢 Root 的 Primary Key 欄位。
    /// </summary>
    private async Task<object?> QueryPrimaryKeyFieldsAsync(
        string internalId,
        PropertyInfo[] keys,
        CancellationToken ct)
    {
        string condition = ApplyDataScope(
            $"{nameof(HeaderModel.InternalId)} = \"{internalId}\"");
        string[] fields = [.. keys.Select(property => property.Name)];
        IList rows = await QueryRawListAsync(
            RootDbModelType,
            fields,
            condition,
            default,
            0,
            0,
            ct: ct);
        return rows.ToDynamicList().FirstOrDefault();
    }
    /// <summary>
    /// 將單一 Primary Key 值加入查詢條件。
    /// </summary>
    private string MergePrimaryKeyCondition(
        string condition,
        object root,
        PropertyInfo key)
    {
        object keyValue = PropertyAccessor.Get(root, key.Name);
        string keyCondition = $"{key.Name} = \"{keyValue}\"";
        return LibData.Merge(
            SysParam.QueryOperators.And,
            false,
            condition,
            keyCondition);
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
    /// 保存跨 RankGroup 分頁的剩餘 Skip 與 Take 狀態。
    /// </summary>
    private sealed record PagedSegmentState(int GlobalSkip, int Remaining);
    #endregion
}
