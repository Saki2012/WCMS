using System.Collections;
using System.Linq.Expressions;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using static WCMS.SysCore.FeatureDriver.Model.Contracts.QueryListParam;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Query;

/// <summary>
/// 建立 Form 查詢的 Root、Navigation 與 Detail Projection Expression。
/// </summary>
internal sealed class FormProjectionExpressionBuilder(
    ModelTypeMetadataCache modelMetadata,
    FormConditionExpressionBuilder conditionBuilder)
{
    #region Property
    /// <summary>
    /// Model Reflection Metadata Cache。
    /// </summary>
    private ModelTypeMetadataCache ModelMetadata { get; } = modelMetadata;
    /// <summary>
    /// WCMS 查詢條件 Expression Builder。
    /// </summary>
    private FormConditionExpressionBuilder ConditionBuilder { get; } = conditionBuilder;
    #endregion

    #region Internal
    private sealed class ParameterReplacer(ParameterExpression from, Expression to) : ExpressionVisitor
    {
        private readonly ParameterExpression _from = from;
        private readonly Expression _to = to;
        protected override Expression VisitParameter(ParameterExpression node) => node == _from ? _to : base.VisitParameter(node);
    }
    internal LambdaExpression? Build(Type modelType, string[] selectFields, Dictionary<string, LambdaExpression>? detailFilterMap = null, Dictionary<string, List<LambdaExpression>>? detailRankMap = null)
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
            var innerSelector = Build(itemType, childFields);
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
    internal Dictionary<string, List<LambdaExpression>> BuildDetailRankMap(Type modelType, IReadOnlyList<RankGroupsSpec>? rankGroups)
    {
        // 宣告變數
        var result = new Dictionary<string, List<LambdaExpression>>(StringComparer.Ordinal);
        if (rankGroups == null || rankGroups.Count == 0) return result;
        // 執行 function
        foreach (var group in rankGroups)
        {
            if (string.IsNullOrWhiteSpace(group.Condition)) continue;
            var groupExpr = ConditionBuilder.Build(modelType, group.Condition);
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
    internal static Dictionary<string, LambdaExpression> ExtractDetailPredicateMap(Type rootType, LambdaExpression whereExpr)
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
    private sealed class ParamSwapVisitor(ParameterExpression from, ParameterExpression to) : ExpressionVisitor
    {
        private readonly ParameterExpression _from = from;
        private readonly ParameterExpression _to = to;
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
    #endregion
}
