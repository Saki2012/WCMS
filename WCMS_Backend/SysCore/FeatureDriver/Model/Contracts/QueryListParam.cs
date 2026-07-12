namespace WCMS.SysCore.FeatureDriver.Model.Contracts;

/// <summary>
/// 查詢條件
/// </summary>
public class QueryListParam 
{
    public readonly record struct OrderBySpec(string Col, bool Desc = false);
    public readonly record struct RankGroupsSpec(string Condition, IReadOnlyList<OrderBySpec>? OrderBy);
    public string[] Fields { get; set; } = [];
    public string Condition { get; set; } = string.Empty;
    public IReadOnlyList<OrderBySpec>? OrderBy { get; set; }
    public IReadOnlyList<RankGroupsSpec>? RankGroups { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}
