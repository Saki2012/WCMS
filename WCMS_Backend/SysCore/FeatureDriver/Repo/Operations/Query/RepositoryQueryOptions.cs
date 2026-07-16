using System.Linq.Expressions;
using static WCMS.SysCore.FeatureDriver.Model.Contracts.QueryListParam;
namespace WCMS.SysCore.FeatureDriver.Repo.Operations.Query;

/// <summary>
/// 定義 Repository 清單查詢的可選條件、排序、分頁與追蹤設定。
/// </summary>
public sealed class RepositoryQueryOptions
{
    #region Property
    /// <summary>
    /// 查詢結果欄位投影；未指定時回傳完整 Entity 並套用預設 Reference Include。
    /// </summary>
    public LambdaExpression? SelectExpression { get; init; }
    /// <summary>
    /// 查詢篩選條件；未指定時不套用 Where。
    /// </summary>
    public LambdaExpression? WhereExpression { get; init; }
    /// <summary>
    /// 查詢排序規則；未指定時僅在分頁情境套用主鍵保底排序。
    /// </summary>
    public IReadOnlyList<OrderBySpec>? OrderBy { get; init; }
    /// <summary>
    /// 頁碼，從 1 開始；未指定或小於等於 0 時改用 SkipCount。
    /// </summary>
    public int PageNumber { get; init; }
    /// <summary>
    /// 單次取得筆數；小於等於 0 時不分頁。
    /// </summary>
    public int PageSize { get; init; }
    /// <summary>
    /// 略過筆數；僅在 PageNumber 未指定時使用。
    /// </summary>
    public int SkipCount { get; init; }
    /// <summary>
    /// 是否使用 NoTracking 查詢；預設啟用並保留 Identity Resolution。
    /// </summary>
    public bool AsNoTracking { get; init; } = true;
    #endregion
}
