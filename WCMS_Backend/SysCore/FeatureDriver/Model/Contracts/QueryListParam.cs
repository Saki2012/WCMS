using WCMS.SysCore.FeatureDriver.Model.Metadata;

namespace WCMS.SysCore.FeatureDriver.Model.Contracts;

/// <summary>
/// 查詢條件。
/// </summary>
public class QueryListParam
{
    public readonly record struct OrderBySpec(string Col, bool Desc = false);
    public readonly record struct RankGroupsSpec(string Condition, IReadOnlyList<OrderBySpec>? OrderBy);
    public string[] Fields { get; set; } = [];
    public string Condition { get; set; } = string.Empty;
    public IReadOnlyList<OrderBySpec>? OrderBy { get; set; }
    public IReadOnlyList<RankGroupsSpec>? RankGroups { get; set; }
    /// <summary>
    /// 查詢頁碼；0 代表未指定頁碼。
    /// </summary>
    [LibNum(ApiFieldMode.WriteOnly, MinValue = "0", MaxValue = "10000")]
    public int PageNumber { get; set; }
    /// <summary>
    /// 每頁筆數；0 保留既有未套用分頁的行為。
    /// </summary>
    [LibNum(ApiFieldMode.WriteOnly, MinValue = "0", MaxValue = "200")]
    public int PageSize { get; set; }
}
