using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using System.Linq.Expressions;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.Base;
using static WCMS.SysCore.FeatureDriver.Model.Contracts.QueryListParam;
namespace WCMS.SysCore.FeatureDriver.Repo.Operations.Query.Expressions;

/// <summary>
/// 建立 Repository 清單查詢使用的動態排序 Expression。
/// </summary>
/// <typeparam name="TDbModel">目前查詢的 EF DbModel 型別。</typeparam>
internal static class RepositoryOrderExpressionBuilder<TDbModel> where TDbModel : DbModel
{
    #region Internal
    /// <summary>
    /// 依序套用一般欄位、Navigation 與集合欄位的動態排序。
    /// </summary>
    internal static IQueryable<TDbModel> ApplyOrderBy(
        IQueryable<TDbModel> source,
        IReadOnlyList<OrderBySpec>? specs)
    {
        if (specs == null || specs.Count == 0) return source;
        ParameterExpression parameter = Expression.Parameter(typeof(TDbModel), "x");
        IOrderedQueryable<TDbModel>? ordered = null;
        int index = 0;
        while (index < specs.Count)
        {
            if (TryApplyGroupedCollectionOrder(source, parameter, specs, ref index, ref ordered)) continue;
            OrderBySpec spec = specs[index];
            string[] parts = spec.Col.Split('.', StringSplitOptions.RemoveEmptyEntries);
            Expression key = BuildKeyForOrder(parameter, parts, spec.Desc);
            ordered = ApplyOrderMethod(ordered, source, key, parameter, spec.Desc);
            index++;
        }
        return ordered ?? source;
    }
    /// <summary>
    /// 分頁查詢沒有指定排序時，依 EF Primary Key 建立穩定排序。
    /// </summary>
    internal static IQueryable<TDbModel> ApplyDefaultKeyOrderBy(
        IQueryable<TDbModel> query,
        DbContext dataAccess)
    {
        IReadOnlyList<IProperty>? keyProperties = dataAccess.Model
            .FindEntityType(typeof(TDbModel))?
            .FindPrimaryKey()?
            .Properties;
        if (keyProperties == null || keyProperties.Count == 0) return query;
        IQueryable<TDbModel> orderedQuery = ApplyKeyOrder(query, keyProperties[0], false);
        for (int index = 1; index < keyProperties.Count; index++)
            orderedQuery = ApplyKeyOrder(orderedQuery, keyProperties[index], true);
        return orderedQuery;
    }
    #endregion

    #region Private
    /// <summary>
    /// 嘗試將同一個集合 Navigation 的連續排序欄位套用為 Top-1 Detail 排序。
    /// </summary>
    private static bool TryApplyGroupedCollectionOrder(
        IQueryable<TDbModel> source,
        ParameterExpression parameter,
        IReadOnlyList<OrderBySpec> specs,
        ref int index,
        ref IOrderedQueryable<TDbModel>? ordered)
    {
        if (!TryBuildGroupedCollectionKeys(parameter, specs, index, out List<GroupKey> keys, out int consumed))
            return false;
        foreach (GroupKey key in keys)
            ordered = ApplyOrderMethod(ordered, source, key.KeyExpr, parameter, key.Desc);
        index += consumed;
        return true;
    }
    /// <summary>
    /// 套用第一層 OrderBy 或後續 ThenBy。
    /// </summary>
    private static IOrderedQueryable<TDbModel> ApplyOrderMethod(
        IOrderedQueryable<TDbModel>? ordered,
        IQueryable<TDbModel> source,
        Expression keyExpression,
        ParameterExpression parameter,
        bool descending)
    {
        LambdaExpression selector = Expression.Lambda(keyExpression, parameter);
        string methodName = ResolveOrderMethodName(ordered != null, descending);
        MethodInfo method = typeof(Queryable).GetMethods()
            .First(item => item.Name == methodName && item.GetParameters().Length == 2)
            .MakeGenericMethod(typeof(TDbModel), keyExpression.Type);
        object result = method.Invoke(null, [ordered ?? source, selector])!;
        return (IOrderedQueryable<TDbModel>)result;
    }
    /// <summary>
    /// 依目前是否已有排序與升降冪決定 Queryable 方法名稱。
    /// </summary>
    private static string ResolveOrderMethodName(bool hasOrdered, bool descending)
    {
        if (!hasOrdered) return descending ? nameof(Queryable.OrderByDescending) : nameof(Queryable.OrderBy);
        return descending ? nameof(Queryable.ThenByDescending) : nameof(Queryable.ThenBy);
    }
    /// <summary>
    /// 建立同一集合 Navigation 多欄位排序所需的 Top-1 Key。
    /// </summary>
    private static bool TryBuildGroupedCollectionKeys(
        ParameterExpression root,
        IReadOnlyList<OrderBySpec> specs,
        int startIndex,
        out List<GroupKey> keys,
        out int consumed)
    {
        keys = [];
        consumed = 0;
        if (startIndex < 0 || startIndex >= specs.Count - 1) return false;
        string[] firstParts = specs[startIndex].Col.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (!TryFindFirstCollectionIndex(root.Type, firstParts, out int collectionIndex)) return false;
        string[] prefix = [.. firstParts.Take(collectionIndex + 1)];
        List<(string[] Parts, bool Desc)> group = CollectCollectionGroup(root.Type, specs, startIndex, collectionIndex, prefix);
        if (group.Count < 2) return false;
        Expression orderedElements = BuildOrderedElementQuery(root, prefix, group);
        foreach ((string[] parts, bool descending) in group)
            keys.Add(new GroupKey(BuildTop1ElementValueExpression(orderedElements, prefix, parts), descending));
        consumed = group.Count;
        return true;
    }
    /// <summary>
    /// 收集連續且指向相同集合 Navigation 的排序欄位。
    /// </summary>
    private static List<(string[] Parts, bool Desc)> CollectCollectionGroup(
        Type rootType,
        IReadOnlyList<OrderBySpec> specs,
        int startIndex,
        int collectionIndex,
        string[] prefix)
    {
        var result = new List<(string[] Parts, bool Desc)>();
        for (int index = startIndex; index < specs.Count; index++)
        {
            string[] parts = specs[index].Col.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (!IsSamePrefix(parts, prefix)) break;
            if (!TryFindFirstCollectionIndex(rootType, parts, out int currentIndex) || currentIndex != collectionIndex) break;
            result.Add((parts, specs[index].Desc));
        }
        return result;
    }
    /// <summary>
    /// 建立集合元素的 OrderBy／ThenBy 查詢 Expression。
    /// </summary>
    private static Expression BuildOrderedElementQuery(
        ParameterExpression root,
        string[] prefix,
        IReadOnlyList<(string[] Parts, bool Desc)> group)
    {
        Expression navigation = BuildMemberPath(root, prefix);
        Type elementType = TryGetEnumerableElementType(navigation.Type)
            ?? throw new InvalidOperationException($"排序集合 '{string.Join(".", prefix)}' 無法推斷元素型別。");
        Expression currentQuery = Expression.Call(typeof(Queryable), nameof(Queryable.AsQueryable), [elementType], navigation);
        ParameterExpression element = Expression.Parameter(elementType, "e");
        bool isFirst = true;
        foreach ((string[] parts, bool descending) in group)
        {
            Expression key = BuildElementKey(element, prefix, parts);
            currentQuery = BuildElementOrderCall(currentQuery, elementType, element, key, isFirst, descending);
            isFirst = false;
        }
        return currentQuery;
    }
    /// <summary>
    /// 建立集合元素單一 OrderBy／ThenBy 呼叫。
    /// </summary>
    private static Expression BuildElementOrderCall(
        Expression source,
        Type elementType,
        ParameterExpression element,
        Expression key,
        bool isFirst,
        bool descending)
    {
        string methodName = ResolveOrderMethodName(!isFirst, descending);
        MethodInfo method = typeof(Queryable).GetMethods()
            .First(item => item.Name == methodName && item.GetParameters().Length == 2)
            .MakeGenericMethod(elementType, key.Type);
        LambdaExpression selector = Expression.Lambda(key, element);
        return Expression.Call(null, method, source, selector);
    }
    /// <summary>
    /// 從已排序的集合取 Top-1 元素指定欄位作為 Root 排序 Key。
    /// </summary>
    private static Expression BuildTop1ElementValueExpression(
        Expression orderedElements,
        string[] prefix,
        string[] fullParts)
    {
        Type elementType = orderedElements.Type.GetGenericArguments().First();
        ParameterExpression element = Expression.Parameter(elementType, "e");
        Expression property = BuildElementKey(element, prefix, fullParts);
        MethodInfo selectMethod = typeof(Queryable).GetMethods()
            .First(item => item.Name == nameof(Queryable.Select) && item.GetParameters().Length == 2)
            .MakeGenericMethod(elementType, property.Type);
        Expression projected = Expression.Call(null, selectMethod, orderedElements, Expression.Lambda(property, element));
        MethodInfo firstMethod = typeof(Queryable).GetMethods()
            .First(item => item.Name == nameof(Queryable.FirstOrDefault) && item.GetParameters().Length == 1)
            .MakeGenericMethod(property.Type);
        return Expression.Call(null, firstMethod, projected);
    }
    /// <summary>
    /// 建立指定 Property 路徑的 Member Expression。
    /// </summary>
    private static Expression BuildMemberPath(Expression root, IEnumerable<string> parts)
    {
        Expression current = root;
        foreach (string part in parts) current = Expression.PropertyOrField(current, part);
        return current;
    }
    /// <summary>
    /// 從集合元素建立去除集合 Prefix 後的欄位路徑。
    /// </summary>
    private static Expression BuildElementKey(
        ParameterExpression element,
        string[] prefix,
        string[] fullParts)
    {
        return BuildMemberPath(element, fullParts.Skip(prefix.Length));
    }
    /// <summary>
    /// 判斷完整欄位路徑是否具有相同集合 Prefix。
    /// </summary>
    private static bool IsSamePrefix(string[] parts, string[] prefix)
    {
        if (parts.Length <= prefix.Length) return false;
        for (int index = 0; index < prefix.Length; index++)
            if (!string.Equals(parts[index], prefix[index], StringComparison.Ordinal)) return false;
        return true;
    }
    /// <summary>
    /// 找出欄位路徑中第一個集合 Navigation 的位置。
    /// </summary>
    private static bool TryFindFirstCollectionIndex(Type rootType, string[] parts, out int index)
    {
        index = -1;
        Type currentType = rootType;
        for (int currentIndex = 0; currentIndex < parts.Length; currentIndex++)
        {
            Type? memberType = ResolveMemberType(currentType, parts[currentIndex]);
            if (memberType == null) return false;
            if (TryGetEnumerableElementType(memberType) != null && memberType != typeof(string))
            {
                index = currentIndex;
                return true;
            }
            currentType = memberType;
        }
        return false;
    }
    /// <summary>
    /// 取得指定公開 Property 或 Field 的型別。
    /// </summary>
    private static Type? ResolveMemberType(Type ownerType, string memberName)
    {
        PropertyInfo? property = ownerType.GetProperty(
            memberName,
            BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);
        FieldInfo? field = ownerType.GetField(
            memberName,
            BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);
        return property?.PropertyType ?? field?.FieldType;
    }
    /// <summary>
    /// 建立單一排序欄位；集合欄位沿用升冪 Min、降冪 Max 的既有規則。
    /// </summary>
    private static Expression BuildKeyForOrder(
        ParameterExpression root,
        string[] parts,
        bool descending)
    {
        Expression current = root;
        for (int index = 0; index < parts.Length; index++)
        {
            Expression member = Expression.PropertyOrField(current, parts[index]);
            Type? elementType = TryGetEnumerableElementType(member.Type);
            if (elementType == null || member.Type == typeof(string))
            {
                current = member;
                continue;
            }
            current = BuildCollectionAggregateKey(member, elementType, parts, ref index, descending);
            break;
        }
        return current;
    }
    /// <summary>
    /// 將集合後續欄位投影後，以 Min 或 Max 聚合成 Root 可排序的純量。
    /// </summary>
    private static Expression BuildCollectionAggregateKey(
        Expression collection,
        Type elementType,
        string[] parts,
        ref int index,
        bool descending)
    {
        if (++index >= parts.Length)
            throw new InvalidOperationException($"排序欄位 '{string.Join(".", parts)}' 少了集合元素的後續屬性。");
        ParameterExpression element = Expression.Parameter(elementType, "e");
        Expression elementKey = BuildMemberPath(element, parts.Skip(index));
        Expression query = Expression.Call(typeof(Queryable), nameof(Queryable.AsQueryable), [elementType], collection);
        MethodInfo selectMethod = typeof(Queryable).GetMethods()
            .First(item => item.Name == nameof(Queryable.Select) && item.GetParameters().Length == 2)
            .MakeGenericMethod(elementType, elementKey.Type);
        Expression projected = Expression.Call(null, selectMethod, query, Expression.Lambda(elementKey, element));
        string aggregateName = descending ? nameof(Queryable.Max) : nameof(Queryable.Min);
        MethodInfo aggregateMethod = typeof(Queryable).GetMethods()
            .Where(item => item.Name == aggregateName && item.IsGenericMethodDefinition)
            .Where(item => item.GetGenericArguments().Length == 1 && item.GetParameters().Length == 1)
            .Single()
            .MakeGenericMethod(elementKey.Type);
        index = parts.Length;
        return Expression.Call(null, aggregateMethod, projected);
    }
    /// <summary>
    /// 取得陣列或 IEnumerable 泛型元素型別，排除無法推斷的集合。
    /// </summary>
    private static Type? TryGetEnumerableElementType(Type type)
    {
        if (type.IsArray) return type.GetElementType();
        Type? enumerableType = type.GetInterfaces()
            .Concat([type])
            .FirstOrDefault(item => item.IsGenericType && item.GetGenericTypeDefinition() == typeof(IEnumerable<>));
        return enumerableType?.GetGenericArguments().FirstOrDefault();
    }
    /// <summary>
    /// 依 EF Key Property 建立 OrderBy 或 ThenBy。
    /// </summary>
    private static IQueryable<TDbModel> ApplyKeyOrder(
        IQueryable<TDbModel> query,
        IProperty property,
        bool useThenBy)
    {
        ParameterExpression parameter = Expression.Parameter(typeof(TDbModel), "x");
        MethodCallExpression propertyAccess = Expression.Call(
            typeof(EF), nameof(EF.Property), [property.ClrType], parameter, Expression.Constant(property.Name));
        LambdaExpression selector = Expression.Lambda(propertyAccess, parameter);
        string methodName = useThenBy ? nameof(Queryable.ThenBy) : nameof(Queryable.OrderBy);
        MethodCallExpression expression = Expression.Call(
            typeof(Queryable), methodName, [typeof(TDbModel), property.ClrType], query.Expression, Expression.Quote(selector));
        return query.Provider.CreateQuery<TDbModel>(expression);
    }
    /// <summary>
    /// 保存集合多欄位排序的 Key Expression 與方向。
    /// </summary>
    private sealed record GroupKey(Expression KeyExpr, bool Desc);
    #endregion
}
