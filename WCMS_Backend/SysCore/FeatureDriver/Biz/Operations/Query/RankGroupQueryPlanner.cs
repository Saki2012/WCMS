using static WCMS.SysCore.FeatureDriver.Model.Contracts.QueryListParam;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Query;

/// <summary>
/// 將 RankGroup 規則轉換為 First-Match-Wins 查詢分段。
/// </summary>
internal static class RankGroupQueryPlanner
{
    #region Internal
    /// <summary>
    /// 建立所有 RankGroup 與 Rest 查詢分段。
    /// </summary>
    internal static IReadOnlyList<RankSegment> BuildSegments(
        string baseCondition,
        IReadOnlyList<RankGroupsSpec> rankGroups,
        IReadOnlyList<OrderBySpec>? baseOrderBy)
    {
        RankGroupPlan plan = BuildPlan(baseCondition, rankGroups);
        return CreateSegments(plan, rankGroups, baseOrderBy);
    }
    #endregion

    #region Private
    /// <summary>
    /// 建立每個 Group 與 Rest 的 Where 條件。
    /// </summary>
    private static RankGroupPlan BuildPlan(
        string baseCondition,
        IReadOnlyList<RankGroupsSpec> groups)
    {
        List<string> groupWhereList = [];
        List<string> groupOrList = [];
        foreach (RankGroupsSpec group in groups)
            AppendGroupCondition(baseCondition, group, groupOrList, groupWhereList);
        string restWhere = BuildRestWhere(baseCondition, groupOrList);
        return new RankGroupPlan(groupWhereList, restWhere);
    }
    /// <summary>
    /// 加入單一 Group，並排除前面已命中的 Group。
    /// </summary>
    private static void AppendGroupCondition(
        string baseCondition,
        RankGroupsSpec group,
        List<string> previousGroups,
        List<string> result)
    {
        if (string.IsNullOrWhiteSpace(group.Condition)) return;
        string where = MergeAnd(baseCondition, group.Condition);
        if (previousGroups.Count > 0)
            where = MergeAnd(where, NotExpr(JoinOr(previousGroups)));
        result.Add(where);
        previousGroups.Add(group.Condition);
    }
    /// <summary>
    /// 建立未命中任何 RankGroup 的 Rest 條件。
    /// </summary>
    private static string BuildRestWhere(
        string baseCondition,
        IReadOnlyList<string> groups)
    {
        if (groups.Count == 0) return baseCondition;
        return MergeAnd(baseCondition, NotExpr(JoinOr(groups)));
    }
    /// <summary>
    /// 將條件計畫轉換為可執行的查詢分段。
    /// </summary>
    private static IReadOnlyList<RankSegment> CreateSegments(
        RankGroupPlan plan,
        IReadOnlyList<RankGroupsSpec> rankGroups,
        IReadOnlyList<OrderBySpec>? baseOrderBy)
    {
        List<RankGroupsSpec> groups = [.. rankGroups.Where(
            item => !string.IsNullOrWhiteSpace(item.Condition))];
        List<RankSegment> result = [];
        for (int index = 0; index < plan.GroupWhereList.Count; index++)
            result.Add(new RankSegment(
                plan.GroupWhereList[index],
                groups[index].OrderBy ?? baseOrderBy));
        result.Add(new RankSegment(plan.RestWhere, baseOrderBy));
        return result;
    }
    /// <summary>
    /// 以 OR 組合既有 Group 條件。
    /// </summary>
    private static string JoinOr(IEnumerable<string> conditions)
    {
        return string.Join(" or ", conditions.Select(condition => $"({condition})"));
    }
    /// <summary>
    /// 以 AND 安全組合兩段條件。
    /// </summary>
    private static string MergeAnd(string left, string right)
    {
        string leftValue = (left ?? string.Empty).Trim();
        string rightValue = (right ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(leftValue)) return rightValue;
        if (string.IsNullOrWhiteSpace(rightValue)) return leftValue;
        return $"({leftValue}) and ({rightValue})";
    }
    /// <summary>
    /// 建立可由 Condition Builder 處理的 NOT 條件。
    /// </summary>
    private static string NotExpr(string expression)
    {
        string value = (expression ?? string.Empty).Trim();
        return string.IsNullOrWhiteSpace(value) ? "true" : $"not ({value})";
    }
    /// <summary>
    /// RankGroup 條件計畫。
    /// </summary>
    private sealed record RankGroupPlan(
        IReadOnlyList<string> GroupWhereList,
        string RestWhere);
    #endregion
}

/// <summary>
/// 單一 RankGroup 查詢分段。
/// </summary>
internal sealed record RankSegment(
    string Where,
    IReadOnlyList<OrderBySpec>? OrderBy);
