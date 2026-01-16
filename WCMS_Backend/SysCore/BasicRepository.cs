using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Collections;
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.QueryListParam;

namespace WCMS.SysCore
{
    public class BasicRepository<TModel>(ApplicationDbContext dataAccess) : IBasicRepository<TModel> where TModel : class
    {
        #region Property
        /// <summary>
        /// 
        /// </summary>
        public ApplicationDbContext DataAccess { get; } = dataAccess;
        #endregion

        #region Public
        /// <summary>
        /// 新增(非同步)
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        public async Task CreateAsync(object newData, int rowId = 1)
        {
            if (newData is TModel single)
            {
                await DataAccess.AddAsync(single);
            }
            else if (newData is IEnumerable<TModel> list)
            {
                foreach (var p in list)
                {
                    if(p is DetailRowModel detailRowModel)
                    {
                        var rowIdProp = PropertyAccessorCache.GetProperty(p.GetType(), "RowId");
                        if (rowIdProp != null) 
                        {
                            if (((dynamic)detailRowModel).RowId == 0 || ((dynamic)detailRowModel).RowId == null)
                                ((dynamic)detailRowModel).RowId = rowId++;
                        }
                    }
                }
                await DataAccess.AddRangeAsync(list);
            }
        }
        /// <summary>
        /// 修改(非同步)
        /// </summary>
        /// <param name="key"></param>
        /// <param name="inputSet"></param>
        /// <returns></returns>
        public async Task UpdateAsync(TModel oldData, TModel newData)
        {
            var set = DataAccess.Set<TModel>();

            // 1) 確保 oldData 受追蹤（不要 Attach newData）
            var oldEntry = DataAccess.Entry(oldData);
            if (oldEntry.State == EntityState.Detached)
            {
                var entityType = DataAccess.Model.FindEntityType(typeof(TModel))
                    ?? throw new InvalidOperationException($"EntityType not found: {typeof(TModel).Name}");

                var pk = entityType.FindPrimaryKey()
                    ?? throw new InvalidOperationException($"Primary key not found: {typeof(TModel).Name}");

                object[] GetKeyValues(object entity) =>
                    pk.Properties.Select(p => p.PropertyInfo!.GetValue(entity)!).ToArray();

                var targetKeys = GetKeyValues(oldData);

                // ✅ 1) 先用 set.Local 找（快）
                var local = set.Local.FirstOrDefault(e => GetKeyValues(e!).SequenceEqual(targetKeys));
                if (local != null)
                {
                    oldData = local;
                }
                else
                {
                    // ✅ 2) 再用 ChangeTracker 全域找（穩）
                    var tracked = DataAccess.ChangeTracker.Entries<TModel>()
                        .FirstOrDefault(e => GetKeyValues(e.Entity!).SequenceEqual(targetKeys));

                    if (tracked != null)
                    {
                        oldData = tracked.Entity;
                    }
                    else
                    {
                        // ✅ 3) 最安全：用 FindAsync 取回「正規 tracked entity」
                        //    FindAsync 會優先用 Context cache，沒有才打 DB
                        var found = await set.FindAsync(targetKeys);
                        if (found != null)
                        {
                            oldData = found;
                        }
                        else
                        {
                            // ✅ 4) 真的找不到才 attach（fallback）
                            set.Attach(oldData);
                        }
                    }
                }

                oldEntry = DataAccess.Entry(oldData);
            }

            // 2) 以「逐欄位 IsModified」為準
            oldEntry.State = EntityState.Unchanged;

            // 3) 欄位差異套用到 oldData（跳過集合/Key/NotMapped/併發欄位）
            var ef = EfMetaCache.Get(DataAccess, typeof(TModel));

            bool IsConcurrency(PropertyInfo p) =>
                p.GetCustomAttribute<TimestampAttribute>() != null ||
                p.GetCustomAttribute<ConcurrencyCheckAttribute>() != null ||
                string.Equals(p.Name, nameof(BasicDataModel.DataVersion), StringComparison.OrdinalIgnoreCase) ||
                string.Equals(p.Name, nameof(DetailRowModel.RowState), StringComparison.OrdinalIgnoreCase);

            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TModel)))
            {
                if (!prop.CanWrite) continue;
                if (ef.IsNav(prop.Name)) continue;                 // 關聯略過
                if (!ef.IsScalar(prop.Name)) continue;             // 非 scalar 略過
                if (prop.GetCustomAttribute<KeyAttribute>() != null) continue;
                if (prop.GetCustomAttribute<NotMappedAttribute>() != null) continue;
                if (IsConcurrency(prop)) continue;

                var oldVal = PropertyAccessorCache.Get(oldData, prop.Name);
                var newVal = PropertyAccessorCache.Get(newData, prop.Name);

                if (!Equals(oldVal, newVal))
                {
                    PropertyAccessorCache.Set(oldData, prop.Name, newVal);
                    DataAccess.Entry(oldData).Property(prop.Name).IsModified = true;
                }
            }

            await Task.CompletedTask;
        }
        /// <summary>
        /// 刪除(非同步)
        /// </summary>
        /// <param name="key"></param>
        public async Task<bool> DeleteAsync(TModel oldData)
        {
            // 1) 取得 entry
            var entry = DataAccess.Entry(oldData);
            // 2) Detached 時：避免 AttachGraph（會把 navigation 一起掛上去造成 PK 衝突）
            if (entry.State == EntityState.Detached)
            {
                // ✅ 清空 reference navigation，避免帶著 master instance 一起被追蹤
                var et = DataAccess.Model.FindEntityType(typeof(TModel));
                if (et != null)
                {
                    foreach (var nav in et.GetNavigations().Where(n => !n.IsCollection))
                    {
                        // 只清 reference nav（collection 不處理）
                        var prop = PropertyAccessorCache.GetProperty(oldData.GetType(), nav.Name);
                        if (prop != null && prop.CanWrite) PropertyAccessorCache.Set(oldData, nav.Name, null);
                    }
                }
                // ✅ 直接標記 Deleted（不 Attach）
                DataAccess.Entry(oldData).State = EntityState.Deleted;
                return true;
            }
            // 3) 已追蹤：直接刪
            DataAccess.Remove(oldData);
            return true;
        }
        /// <summary>
        /// 查看表單(非同步)
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        public async Task<TModel> QueryDataAsync(params object[] key)
        {
            return await DataAccess.Set<TModel>().FindAsync(key);
        }
        /// <summary>
        /// 查看表單清單(非同步)
        /// </summary>
        /// <returns></returns>
        public async Task<IList<TModel>> QueryListAsync(LambdaExpression? selectExpr,LambdaExpression? whereExpr,IReadOnlyList<OrderBySpec>? orderBy = null,int pageCt = 0,int takeCt = 0, bool asNoTracking = true)
        {
            IQueryable<TModel> query = DataAccess.Set<TModel>();
            query = query.TagWith($"BasicRepository<{typeof(TModel).Name}>.QueryListAsync");
            if (asNoTracking) query = query.AsNoTrackingWithIdentityResolution();
            // ✅ Where 條件
            if (!whereExpr.IsNullOrEmpty()) query = query.Where((Expression<Func<TModel, bool>>)whereExpr);
            // ✅ 排序
            if (orderBy != null && orderBy.Count > 0) query = ApplyOrderBy(query, orderBy);
            // ✅ Include（兩種模式：selectExpr 抽 include / fields 空 → 預設第一層 include）
            if (selectExpr == null)
            {
                query = DefaultIncludeHelper.ApplyFirstLevelReferenceIncludes(DataAccess, query, out int includeCt);
                if (includeCt > 0) query = query.AsSplitQuery();
            }
            // ✅ 分頁（建議放在 include 後也 OK；你原本放前面也能跑）
            if (takeCt > 0 && pageCt > 0) query = query.Skip((pageCt - 1) * takeCt).Take(takeCt);
            // ✅ Select
            if (selectExpr == null) return await query.ToListAsync();
            return await query.Select((Expression<Func<TModel, TModel>>)selectExpr).ToListAsync();
        }

        /// <summary>
        /// 查看表單清單總數量(非同步)
        /// </summary>
        /// <returns></returns>
        public async Task<int> QueryListCountAsync(LambdaExpression? whereExpr)
        {
            // ✅ Count 永遠 NoTracking
            IQueryable<TModel> query = DataAccess.Set<TModel>().AsNoTracking();
            query = query.TagWith($"BasicRepository<{typeof(TModel).Name}>.QueryListCountAsync");
            // ✅ Where 條件
            if (!whereExpr.IsNullOrEmpty()) query = query.Where((Expression<Func<TModel, bool>>)whereExpr);
            return await query.CountAsync();
        }
        /// <summary>
        /// 自動產生流水號ID
        /// </summary>
        /// <param name="dbSet"></param>
        /// <param name="idSelector"></param>
        /// <param name="prefix"></param>
        /// <param name="format"></param>
        /// <returns></returns>
        public async Task<string> GenerateIdAsync(LambdaExpression idSelector, string prefix = "", string format = "D3")
        {
            Expression<Func<TModel, string>> selector = idSelector as Expression<Func<TModel, string>>;
            string id = prefix + DateTime.Now.ToString("yyyyMMdd");
            var dbSet = DataAccess.Set<TModel>();
            var startsWithExpr = BuildStartsWithExpression(selector, id);

            //var addedEntities = DataAccess.ChangeTracker.Entries<TModel>().Where(e => e.State == EntityState.Added).Select(e => e.Entity).Cast<TModel>();
            //var existedEntities = await dbSet.AsNoTracking().Where(startsWithExpr).Select(selector).ToListAsync();
            //var localEntities = addedEntities.AsQueryable().Where(startsWithExpr.Compile()).Select(selector.Compile());
            //var allIds = existedEntities.Concat(localEntities).ToList();

            var addedEntities = DataAccess.ChangeTracker.Entries<TModel>().Where(e => e.State == EntityState.Added).Select(e => e.Entity).Cast<TModel>().ToList();
            var existedEntities = await dbSet.AsNoTracking().Where(startsWithExpr).Select(selector).ToListAsync();
            var localEntities = addedEntities.AsQueryable().Where(startsWithExpr.Compile()).Select(selector.Compile());
            var allIds = existedEntities.Concat(localEntities).ToList();

            var maxIdToday = allIds.OrderByDescending(x => x).FirstOrDefault();
            int nextSerial = 1;
            if (!string.IsNullOrEmpty(maxIdToday) && maxIdToday.Length >= id.Length + 3)
            {
                var serialStr = maxIdToday.Substring(id.Length, 3);
                if (int.TryParse(serialStr, out var currentSerial)) nextSerial = currentSerial + 1;
            }
            return id + nextSerial.ToString(format);
        }
        #endregion

        #region Private

        private static Expression<Func<TModel, bool>> BuildStartsWithExpression(Expression<Func<TModel, string>> selector,string prefix)
        {
            var param = selector.Parameters[0];
            var body = Expression.Call(selector.Body, typeof(string).GetMethod(nameof(string.StartsWith), new[] { typeof(string) })!, Expression.Constant(prefix) );
            return Expression.Lambda<Func<TModel, bool>>(body, param);
        }

        private static class ExpressionIncludeHelper
        {
            public static IEnumerable<string> ExtractIncludePaths(LambdaExpression expression)
            {
                var visitor = new NavigationPathVisitor();
                visitor.Visit(expression);
                return visitor.Paths;
            }

            private class NavigationPathVisitor : ExpressionVisitor
            {
                private readonly Stack<string> _path = new();
                private readonly HashSet<string> _paths = new();

                public IEnumerable<string> Paths => _paths;

                protected override Expression VisitMember(MemberExpression node)
                {
                    if (node.Expression is MemberExpression || node.Expression is ParameterExpression)
                    {
                        var full = BuildPath(node);              // 例如：CreateUser.UserName / Details.FieldA
                        var i = full.LastIndexOf('.');
                        if (i > 0)
                        {
                            var navOnly = full.Substring(0, i);  // → CreateUser / Details
                            _paths.Add(navOnly);
                        }
                    }
                    return base.VisitMember(node);
                }

                protected override Expression VisitUnary(UnaryExpression node)
                {
                    if (node.NodeType == ExpressionType.Convert)
                    {
                        Visit(node.Operand);  // 解開 Convert
                    }
                    return node;
                }

                protected override Expression VisitMemberInit(MemberInitExpression node)
                {
                    foreach (var binding in node.Bindings)
                    {
                        if (binding is MemberAssignment assignment)
                        {
                            Visit(assignment.Expression);
                        }
                    }
                    return base.VisitMemberInit(node);
                }

                protected override Expression VisitLambda<T>(Expression<T> node)
                {
                    return Visit(node.Body);  // 一定要訪問 body，不然整棵都不會進來
                }

                private string BuildPath(MemberExpression node)
                {
                    var names = new Stack<string>();
                    Expression current = node;
                    while (current is MemberExpression m)
                    {
                        names.Push(m.Member.Name);
                        current = m.Expression;
                    }
                    return string.Join(".", names);
                }

                protected override Expression VisitMethodCall(MethodCallExpression node)
                {
                    // 先訪問子節點
                    if (node.Arguments != null)
                    {
                        foreach (var arg in node.Arguments)
                            Visit(arg);
                    }
                    if (node.Object != null)
                        Visit(node.Object);

                    // ✅ 額外補：如果 method chain 是 _CategoryDetail.AsQueryable().Select(...)
                    if (node.Method.Name == "Select" && node.Arguments.Count == 2)
                    {
                        // 目標物件為 AsQueryable(_CategoryDetail)
                        var source = node.Arguments[0];
                        if (source is MethodCallExpression asQueryableCall &&
                            asQueryableCall.Method.Name == "AsQueryable" &&
                            asQueryableCall.Arguments.Count == 1 &&
                            asQueryableCall.Arguments[0] is MemberExpression navExpr)
                        {
                            var path = BuildPath(navExpr);
                            if (!string.IsNullOrWhiteSpace(path))
                            {
                                _paths.Add(path); // ✅ 加入 navigation include path
                            }
                        }
                    }

                    return base.VisitMethodCall(node);
                }
            }
        }

        private static Type? TryGetIEnumerableElementType(Type type)
        {
            if (type.IsArray) return type.GetElementType();
            foreach (var t in type.GetInterfaces().Concat(new[] { type }))
                if (t.IsGenericType && t.GetGenericTypeDefinition() == typeof(IEnumerable<>))
                    return t.GetGenericArguments()[0];
            return null;
        }


        /// <summary>
        /// ✅ 統一排序套用：支援「同一個集合導航」的多欄位 group 排序（Top-1 detail key）
        /// </summary>
        private static IQueryable<TModel> ApplyOrderBy(IQueryable<TModel> source, IReadOnlyList<OrderBySpec>? specs)
        {
            if (specs == null || specs.Count == 0) return source;

            var param = Expression.Parameter(typeof(TModel), "x");
            IOrderedQueryable<TModel>? ordered = null;

            var i = 0;
            while (i < specs.Count)
            {
                // ✅ 1) 嘗試把同 collection prefix 的排序欄位打包成 group（Top-1 detail）
                if (TryBuildGroupedCollectionKeys(param, specs, i, out var groupKeys, out var consumed))
                {
                    foreach (var g in groupKeys)
                    {
                        ordered = ApplyOrderMethod(ordered, source, g.KeyExpr, param, g.Desc);
                    }

                    i += consumed;
                    continue;
                }

                // ✅ 2) fallback：單欄位排序（沿用你原本的 BuildKeyForOrder：collection→Min/Max）
                var spec = specs[i];
                var parts = spec.Col.Split('.', StringSplitOptions.RemoveEmptyEntries);

                Expression key = BuildKeyForOrder(param, parts, spec.Desc);
                ordered = ApplyOrderMethod(ordered, source, key, param, spec.Desc);

                i++;
            }

            return ordered ?? source;
        }
        /// <summary>
        /// ✅ 套用 OrderBy/ThenBy（依是否已有 ordered 決定）
        /// </summary>
        private static IOrderedQueryable<TModel> ApplyOrderMethod(
            IOrderedQueryable<TModel>? ordered,
            IQueryable<TModel> source,
            Expression keyExpr,
            ParameterExpression param,
            bool desc)
        {
            var lambda = Expression.Lambda(keyExpr, param);

            var methodName =
                ordered == null
                    ? (desc ? nameof(Queryable.OrderByDescending) : nameof(Queryable.OrderBy))
                    : (desc ? nameof(Queryable.ThenByDescending) : nameof(Queryable.ThenBy));

            var method = typeof(Queryable).GetMethods()
                .First(m => m.Name == methodName && m.GetParameters().Length == 2)
                .MakeGenericMethod(typeof(TModel), keyExpr.Type);

            var result = method.Invoke(null, new object[] { ordered ?? source, lambda })!;
            return (IOrderedQueryable<TModel>)result;
        }
        private sealed record GroupKey(Expression KeyExpr, bool Desc);

        /// <summary>
        /// ✅ 偵測並建立「同一個集合導航」的 group 排序 key：
        /// - 先對集合元素套用 group 的 OrderBy/ThenBy（用 group 各 spec 的 Desc）
        /// - 再對每個 spec：Select(prop).FirstOrDefault() 當外層排序 key
        /// </summary>
        private static bool TryBuildGroupedCollectionKeys(
            ParameterExpression root,
            IReadOnlyList<OrderBySpec> specs,
            int startIndex,
            out List<GroupKey> keys,
            out int consumed)
        {
            keys = new();
            consumed = 0;

            // ✅ 至少要有 2 個排序欄位才值得打包（避免改變既有單欄位行為）
            if (startIndex < 0 || startIndex >= specs.Count - 1) return false;

            // ✅ 解析第一個 spec：找出「第一個集合導航」的位置（例如 SpecResearchDetail）
            var firstParts = specs[startIndex].Col.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (!TryFindFirstCollectionIndex(root.Type, firstParts, out var colIndex)) return false;

            // ✅ collection prefix：例如 ["SpecResearchDetail"]
            var prefix = firstParts.Take(colIndex + 1).ToArray();

            // ✅ 收集連續 spec：必須同 prefix 且都含 collection
            var group = new List<(string[] Parts, bool Desc)>();
            var j = startIndex;

            while (j < specs.Count)
            {
                var parts = specs[j].Col.Split('.', StringSplitOptions.RemoveEmptyEntries);
                if (!IsSamePrefix(parts, prefix)) break;
                if (!TryFindFirstCollectionIndex(root.Type, parts, out var idx) || idx != colIndex) break;

                group.Add((parts, specs[j].Desc));
                j++;
            }

            // ✅ 需要至少 2 個欄位才打包
            if (group.Count < 2) return false;

            // ✅ 建立 ordered elements query（同一套排序規則）
            var orderedElemQuery = BuildOrderedElementQuery(root, prefix, group);

            // ✅ 每個欄位都用「同一筆 Top-1 detail」取值當 key
            foreach (var (parts, desc) in group)
            {
                var keyExpr = BuildTop1ElementValueExpr(orderedElemQuery, prefix, parts);
                keys.Add(new GroupKey(keyExpr, desc));
            }

            consumed = group.Count;
            return true;
        }
        /// <summary>
        /// ✅ 產生集合元素的排序查詢：AsQueryable(nav).OrderBy(...).ThenBy(...).
        /// </summary>
        private static Expression BuildOrderedElementQuery(
            ParameterExpression root,
            string[] prefix,
            List<(string[] Parts, bool Desc)> group)
        {
            // ✅ prefix 最後一段就是 collection navigation name
            Expression nav = root;
            for (int i = 0; i < prefix.Length; i++)
            {
                nav = Expression.PropertyOrField(nav, prefix[i]);
            }

            var elemType = TryGetIEnumerableElementType(nav.Type)
                ?? throw new InvalidOperationException($"排序集合 '{string.Join(".", prefix)}' 無法推斷元素型別。");

            // AsQueryable(nav)
            var asQ = Expression.Call(
                typeof(Queryable),
                nameof(Queryable.AsQueryable),
                new[] { elemType },
                nav
            );

            // ✅ 元素排序：依 group spec 的 remaining path 建立 key
            var ep = Expression.Parameter(elemType, "e");
            Expression currentQuery = asQ;
            var first = true;

            foreach (var (parts, desc) in group)
            {
                var key = BuildElementKey(ep, prefix, parts); // e => e.Year / e.AcademicYear ...
                var lambda = Expression.Lambda(key, ep);

                var methodName =
                    first
                        ? (desc ? nameof(Queryable.OrderByDescending) : nameof(Queryable.OrderBy))
                        : (desc ? nameof(Queryable.ThenByDescending) : nameof(Queryable.ThenBy));

                var method = typeof(Queryable).GetMethods()
                    .First(m => m.Name == methodName && m.GetParameters().Length == 2)
                    .MakeGenericMethod(elemType, key.Type);

                currentQuery = Expression.Call(null, method, currentQuery, lambda);
                first = false;
            }

            return currentQuery;
        }
        /// <summary>
        /// ✅ 從 ordered elements 取 Top-1 元素的某個欄位值：
        /// ordered.Select(e => e.Prop).FirstOrDefault()
        /// </summary>
        private static Expression BuildTop1ElementValueExpr(Expression orderedElemQuery, string[] prefix, string[] fullParts)
        {
            // ✅ fullParts = prefix + [PropPath...]
            var elemType = orderedElemQuery.Type.GetGenericArguments().First();

            var ep = Expression.Parameter(elemType, "e");
            var propExpr = BuildElementKey(ep, prefix, fullParts); // e => e.Prop

            // Select(...)
            var selectMethod = typeof(Queryable).GetMethods()
                .First(m => m.Name == nameof(Queryable.Select) && m.GetParameters().Length == 2)
                .MakeGenericMethod(elemType, propExpr.Type);

            var selector = Expression.Lambda(propExpr, ep);
            var projected = Expression.Call(null, selectMethod, orderedElemQuery, selector);

            // FirstOrDefault(...)
            var fodMethod = typeof(Queryable).GetMethods()
                .First(m => m.Name == nameof(Queryable.FirstOrDefault) && m.GetParameters().Length == 1)
                .MakeGenericMethod(propExpr.Type);

            return Expression.Call(null, fodMethod, projected);
        }
        /// <summary>
        /// ✅ 建立元素 key：剔除 prefix（collection nav）後，從元素 e 往下取屬性
        /// </summary>
        private static Expression BuildElementKey(ParameterExpression elemParam, string[] prefix, string[] fullParts)
        {
            // fullParts: prefix + remaining
            var start = prefix.Length; // prefix 已含 collection nav 名稱
            Expression cur = elemParam;

            for (int i = start; i < fullParts.Length; i++)
            {
                cur = Expression.PropertyOrField(cur, fullParts[i]);
            }

            return cur;
        }

        private static bool IsSamePrefix(string[] parts, string[] prefix)
        {
            if (parts.Length <= prefix.Length) return false;
            for (int i = 0; i < prefix.Length; i++)
            {
                if (!string.Equals(parts[i], prefix[i], StringComparison.Ordinal)) return false;
            }
            return true;
        }

        /// <summary>
        /// ✅ 找出 parts 裡第一個 IEnumerable<>（排除 string）的位置
        /// </summary>
        private static bool TryFindFirstCollectionIndex(Type rootType, string[] parts, out int index)
        {
            index = -1;

            Type cur = rootType;
            for (int i = 0; i < parts.Length; i++)
            {
                var pi = cur.GetProperty(parts[i], BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);
                var fi = cur.GetField(parts[i], BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);

                var mt = pi?.PropertyType ?? fi?.FieldType;
                if (mt == null) return false;

                var elemType = TryGetIEnumerableElementType(mt);
                if (elemType != null && mt != typeof(string))
                {
                    index = i;
                    return true;
                }

                cur = mt;
            }

            return false;
        }
        private static Expression BuildKeyForOrder(ParameterExpression root, string[] parts, bool desc)
        {
            Expression current = root;
            Type currentType = root.Type;

            for (int i = 0; i < parts.Length; i++)
            {
                var member = Expression.PropertyOrField(current, parts[i]);
                var elemType = TryGetIEnumerableElementType(member.Type);

                // 碰到集合：用 Min/Max( e => 後續路徑 ) 聚合成純量
                if (elemType != null && member.Type != typeof(string))
                {
                    if (++i >= parts.Length)
                        throw new InvalidOperationException($"排序欄位 '{string.Join(".", parts)}' 少了集合元素的後續屬性。");

                    // 走完集合元素的後續路徑
                    var pe = Expression.Parameter(elemType, "e");
                    Expression elemKey = Expression.PropertyOrField(pe, parts[i]);
                    while (++i < parts.Length)
                        elemKey = Expression.PropertyOrField(elemKey, parts[i]);

                    // AsQueryable(collection)
                    var asQ = Expression.Call(typeof(Queryable), nameof(Queryable.AsQueryable), new[] { elemType }, member);

                    // 升冪取 Min、降冪取 Max（可依需求改）
                    var selector = Expression.Lambda(elemKey, pe);
                    var selectMethod = typeof(Queryable).GetMethods()
                        .First(m => m.Name == nameof(Queryable.Select) && m.GetParameters().Length == 2)
                        .MakeGenericMethod(elemType, elemKey.Type);
                    var projected = Expression.Call(null, selectMethod, asQ, selector);
                    var aggName = desc ? nameof(Queryable.Max) : nameof(Queryable.Min);
                    var aggMethod = typeof(Queryable).GetMethods()
                        .Where(m => m.Name == aggName && m.IsGenericMethodDefinition)
                        .Where(m => m.GetGenericArguments().Length == 1 && m.GetParameters().Length == 1)
                        .Single()
                        .MakeGenericMethod(elemKey.Type);


                    current = Expression.Call(null, aggMethod, projected);
                    currentType = elemKey.Type;
                    break; // 已聚合為純量，路徑消化完畢
                }
                else
                {
                    current = member;
                    currentType = member.Type;
                }
            }

            return current;
        }
        #endregion

        #region IDisposable Support
        private bool disposedValue = false; // 偵測多餘的呼叫

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    // TODO: 處置 Managed 狀態 (Managed 物件)。
                }

                // TODO: 釋放 Unmanaged 資源 (Unmanaged 物件) 並覆寫下方的完成項。
                // TODO: 將大型欄位設為 null。

                disposedValue = true;
            }
        }

        // TODO: 僅當上方的 Dispose(bool disposing) 具有會釋放 Unmanaged 資源的程式碼時，才覆寫完成項。
        // ~BasicRepository()
        // {
        //   // 請勿變更這個程式碼。請將清除程式碼放入上方的 Dispose(bool disposing) 中。
        //   Dispose(false);
        // }

        // 加入這個程式碼的目的在正確實作可處置的模式。
        public void Dispose()
        {
            // 請勿變更這個程式碼。請將清除程式碼放入上方的 Dispose(bool disposing) 中。
            Dispose(true);
            // TODO: 如果上方的完成項已被覆寫，即取消下行的註解狀態。
            // GC.SuppressFinalize(this);
        }
        #endregion
    }

    static class EfMetaCache
    {
        public sealed class Map
        {
            public readonly HashSet<string> Scalars;
            public readonly HashSet<string> Navs;
            public readonly HashSet<string> SkipNavs;
            public readonly HashSet<string> Complex;

            public Map(HashSet<string> s, HashSet<string> n, HashSet<string> k, HashSet<string> c)
            { Scalars = s; Navs = n; SkipNavs = k; Complex = c; }

            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            public bool IsNav(string name) => Navs.Contains(name) || SkipNavs.Contains(name) || Complex.Contains(name);

            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            public bool IsScalar(string name) => Scalars.Contains(name);
        }

        static readonly ConcurrentDictionary<Type, Map> _cache = new();

        public static Map Get(DbContext db, Type clr)
            => _cache.GetOrAdd(clr, t =>
            {
                var et = db.Model.FindEntityType(t)
                         ?? throw new InvalidOperationException($"EF entity not found: {t.Name}");

                var scalars = et.GetProperties().Select(p => p.Name)
                                .ToHashSet(StringComparer.Ordinal);
                var navs = et.GetNavigations().Select(n => n.Name)
                                .ToHashSet(StringComparer.Ordinal);
                var skips = et.GetSkipNavigations().Select(n => n.Name)
                                .ToHashSet(StringComparer.Ordinal);
#if NET8_0_OR_GREATER
                var complex = et.GetComplexProperties().Select(c => c.Name)
                                .ToHashSet(StringComparer.Ordinal);
#else
            var complex = new HashSet<string>();
#endif
                return new Map(scalars, navs, skips, complex);
            });
    }

    static class DefaultIncludeHelper
    {
        private static readonly ConcurrentDictionary<Type, string[]> _cache = new();

        /// <summary>
        /// 取得 Entity 第一層 Reference Navigation 的 Include paths（快取）
        /// </summary>
        public static string[] GetFirstLevelReferenceIncludes(DbContext db, Type entityType)
        {
            // NOTE: 使用快取避免每次掃 metadata
            return _cache.GetOrAdd(entityType, t =>
            {
                var et = db.Model.FindEntityType(t);
                if (et == null) return Array.Empty<string>();
                // NOTE: 只取 Reference（排除 Collection）避免爆量
                var navs = et.GetNavigations().Where(n => !n.IsCollection).Select(n => n.Name).Distinct().ToArray();
                return navs;
            });
        }

        /// <summary>
        /// 套用第一層 Reference Includes（只在你想要時呼叫）
        /// </summary>
        public static IQueryable<T> ApplyFirstLevelReferenceIncludes<T>(DbContext db,IQueryable<T> query,out int includeCt)where T : class
        {
            includeCt = 0;
            var includes = GetFirstLevelReferenceIncludes(db, typeof(T));
            foreach (var path in includes)
            {
                if (!string.IsNullOrWhiteSpace(path) && !path.Contains('.'))
                {
                    query = query.Include(path);
                    includeCt++;
                }
            }
            return query;
        }
    }
}
