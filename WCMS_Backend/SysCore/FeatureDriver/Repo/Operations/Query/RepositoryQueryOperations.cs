using Microsoft.EntityFrameworkCore;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Repo.Cache;
using WCMS.SysCore.FeatureDriver.Repo.Operations.Query.Expressions;
using WCMS.SysCore.Library;
using WCMS.SysCore.Persistence;
namespace WCMS.SysCore.FeatureDriver.Repo.Operations.Query;

/// <summary>
/// 執行 Repository 單筆、清單、數量與 Prefix 最大值查詢。
/// </summary>
public sealed class RepositoryQueryOperations<TDbModel>(
    ApplicationDbContext dataAccess,
    EfRepositoryMetadataCache repositoryMetadata)
    where TDbModel : DbModel
{
    #region Property
    private ApplicationDbContext DataAccess { get; } = dataAccess;
    private EfRepositoryMetadataCache RepositoryMetadata { get; } = repositoryMetadata;
    #endregion

    #region Internal
    /// <summary>
    /// 依 EF Primary Key 查詢可追蹤的單一 Entity。
    /// </summary>
    internal async Task<TDbModel> FindByKeyAsync(
        IReadOnlyList<object> key,
        CancellationToken ct)
    {
        object[] keyValues = [.. key];
        return await DataAccess.Set<TDbModel>().FindAsync(keyValues, ct);
    }
    /// <summary>
    /// 依可選查詢設定取得 Entity 清單。
    /// </summary>
    internal async Task<IList<TDbModel>> QueryListAsync(
        RepositoryQueryOptions? options,
        CancellationToken ct)
    {
        RepositoryQueryOptions queryOptions = options ?? new RepositoryQueryOptions();
        IQueryable<TDbModel> query = BuildBaseQuery(queryOptions);
        query = ApplyWhere(query, queryOptions.WhereExpression);
        query = ApplyOrder(query, queryOptions);
        query = ApplyIncludes(query, queryOptions.SelectExpression);
        query = ApplyPaging(query, queryOptions);
        return await ExecuteListAsync(query, queryOptions.SelectExpression, ct);
    }
    /// <summary>
    /// 依條件取得 Entity 總筆數。
    /// </summary>
    internal async Task<int> QueryListCountAsync(
        LambdaExpression? whereExpression,
        CancellationToken ct)
    {
        IQueryable<TDbModel> query = DataAccess.Set<TDbModel>()
            .AsNoTracking()
            .TagWith($"BasicRepository<{typeof(TDbModel).Name}>.QueryListCountAsync");
        query = ApplyWhere(query, whereExpression);
        return await query.CountAsync(ct);
    }
    /// <summary>
    /// 查詢指定字串欄位在目前前綴下的最大值。
    /// </summary>
    internal async Task<string?> QueryMaxStringValueByPrefixAsync(
        LambdaExpression valueSelector,
        string prefix,
        CancellationToken ct)
    {
        Expression<Func<TDbModel, string>> selector = ValidateStringSelector(valueSelector);
        Expression<Func<TDbModel, bool>> condition = BuildStartsWithExpression(selector, prefix);
        List<string> persistedValues = await QueryPersistedValuesAsync(selector, condition, ct);
        IEnumerable<string> pendingValues = QueryPendingValues(selector, prefix);
        return persistedValues.Concat(pendingValues)
            .OrderByDescending(value => value, StringComparer.Ordinal)
            .FirstOrDefault();
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立清單查詢基底並套用追蹤模式。
    /// </summary>
    private IQueryable<TDbModel> BuildBaseQuery(RepositoryQueryOptions options)
    {
        IQueryable<TDbModel> query = DataAccess.Set<TDbModel>()
            .TagWith($"BasicRepository<{typeof(TDbModel).Name}>.QueryListAsync");
        return options.AsNoTracking ? query.AsNoTrackingWithIdentityResolution() : query;
    }
    /// <summary>
    /// 套用查詢篩選條件。
    /// </summary>
    private static IQueryable<TDbModel> ApplyWhere(
        IQueryable<TDbModel> query,
        LambdaExpression? whereExpression)
    {
        if (whereExpression.IsNullOrEmpty()) return query;
        return query.Where((Expression<Func<TDbModel, bool>>)whereExpression!);
    }
    /// <summary>
    /// 套用指定排序或分頁所需的主鍵保底排序。
    /// </summary>
    private IQueryable<TDbModel> ApplyOrder(
        IQueryable<TDbModel> query,
        RepositoryQueryOptions options)
    {
        bool hasOrder = options.OrderBy is { Count: > 0 };
        if (hasOrder)
            return RepositoryOrderExpressionBuilder<TDbModel>.ApplyOrderBy(query, options.OrderBy!);
        if (options.PageSize > 0)
            return RepositoryOrderExpressionBuilder<TDbModel>.ApplyDefaultKeyOrderBy(query, DataAccess);
        return query;
    }
    /// <summary>
    /// 未使用 Projection 時套用第一層 Reference Include。
    /// </summary>
    private IQueryable<TDbModel> ApplyIncludes(
        IQueryable<TDbModel> query,
        LambdaExpression? selectExpression)
    {
        if (selectExpression != null) return query;
        string[] paths = RepositoryMetadata.GetFirstLevelReferenceIncludes(DataAccess, typeof(TDbModel));
        query = ApplyFirstLevelReferenceIncludes(query, paths, out int includeCount);
        return includeCount > 0 ? query.AsSplitQuery() : query;
    }
    /// <summary>
    /// 套用頁碼或 Skip/Take 切段。
    /// </summary>
    private static IQueryable<TDbModel> ApplyPaging(
        IQueryable<TDbModel> query,
        RepositoryQueryOptions options)
    {
        if (options.PageSize <= 0) return query;
        if (options.PageNumber > 0)
            return query.Skip((options.PageNumber - 1) * options.PageSize).Take(options.PageSize);
        if (options.SkipCount > 0)
            return query.Skip(options.SkipCount).Take(options.PageSize);
        return query.Take(options.PageSize);
    }
    /// <summary>
    /// 執行完整 Entity 或 Projection 清單查詢。
    /// </summary>
    private static async Task<IList<TDbModel>> ExecuteListAsync(
        IQueryable<TDbModel> query,
        LambdaExpression? selectExpression,
        CancellationToken ct)
    {
        if (selectExpression == null) return await query.ToListAsync(ct);
        query = query.AsSplitQuery();
        return await query
            .Select((Expression<Func<TDbModel, TDbModel>>)selectExpression)
            .ToListAsync(ct);
    }
    /// <summary>
    /// 套用 Entity 第一層 Reference Navigation Include 路徑。
    /// </summary>
    private static IQueryable<TDbModel> ApplyFirstLevelReferenceIncludes(
        IQueryable<TDbModel> query,
        IReadOnlyList<string> includePaths,
        out int includeCount)
    {
        includeCount = 0;
        foreach (string path in includePaths)
        {
            if (string.IsNullOrWhiteSpace(path) || path.Contains('.')) continue;
            query = query.Include(path);
            includeCount++;
        }
        return query;
    }
    /// <summary>
    /// 驗證 Prefix 查詢使用的字串欄位 Selector。
    /// </summary>
    private static Expression<Func<TDbModel, string>> ValidateStringSelector(
        LambdaExpression valueSelector)
    {
        return valueSelector as Expression<Func<TDbModel, string>>
            ?? throw new ArgumentException(
                $"Selector type must be Func<{typeof(TDbModel).Name}, string>.",
                nameof(valueSelector));
    }
    /// <summary>
    /// 將字串 Selector 組成可由 EF Core 翻譯的 StartsWith 條件。
    /// </summary>
    private static Expression<Func<TDbModel, bool>> BuildStartsWithExpression(
        Expression<Func<TDbModel, string>> selector,
        string prefix)
    {
        ParameterExpression parameter = selector.Parameters[0];
        MethodInfo startsWith = typeof(string).GetMethod(nameof(string.StartsWith), [typeof(string)])!;
        MethodCallExpression body = Expression.Call(selector.Body, startsWith, Expression.Constant(prefix));
        return Expression.Lambda<Func<TDbModel, bool>>(body, parameter);
    }
    /// <summary>
    /// 查詢資料庫內符合前綴的字串值。
    /// </summary>
    private async Task<List<string>> QueryPersistedValuesAsync(
        Expression<Func<TDbModel, string>> selector,
        Expression<Func<TDbModel, bool>> condition,
        CancellationToken ct)
    {
        return await DataAccess.Set<TDbModel>()
            .AsNoTracking()
            .Where(condition)
            .Select(selector)
            .ToListAsync(ct);
    }
    /// <summary>
    /// 查詢 ChangeTracker 尚未儲存且符合前綴的字串值。
    /// </summary>
    private IEnumerable<string> QueryPendingValues(
        Expression<Func<TDbModel, string>> selector,
        string prefix)
    {
        Func<TDbModel, string> getter = selector.Compile();
        return DataAccess.ChangeTracker.Entries<TDbModel>()
            .Where(entry => entry.State == EntityState.Added)
            .Select(entry => getter(entry.Entity))
            .Where(value => value?.StartsWith(prefix, StringComparison.Ordinal) == true);
    }
    #endregion
}
