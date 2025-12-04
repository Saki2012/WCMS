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
                set.Attach(oldData);
                oldEntry = DataAccess.Entry(oldData);
            }
            oldEntry.State = EntityState.Unchanged; // 以「逐欄位 IsModified」為準
            // 2) 取出主鍵，禁止在更新時變更主鍵值
            var entityType = DataAccess.Model.FindEntityType(typeof(TModel)) ?? throw new InvalidOperationException($"EntityType not found: {typeof(TModel).Name}");
            var pk = entityType.FindPrimaryKey() ?? throw new InvalidOperationException($"Primary key not found: {typeof(TModel).Name}");
            object[] GetKeyValues(object entity) => pk.Properties.Select(p => p.PropertyInfo!.GetValue(entity)!).ToArray();
            if (!GetKeyValues(oldData).SequenceEqual(GetKeyValues(newData))) throw new InvalidOperationException("Primary key cannot be changed during update.");
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
                // 導航（參考/集合）或複雜型別 → 一律跳過
                if (ef.IsNav(prop.Name)) continue;        // 🟢 只跳過關聯
                if (!ef.IsScalar(prop.Name)) continue;    // 🟢 非 EF scalar 就略過
                if (prop.GetCustomAttribute<KeyAttribute>() != null) continue;  // 跳過主鍵
                if (prop.GetCustomAttribute<NotMappedAttribute>() != null) continue; // 跳過 NotMapped
                if (IsConcurrency(prop)) continue;                               // 跳過併發欄位

                var oldVal = PropertyAccessorCache.Get(oldData, prop.Name);
                var newVal = PropertyAccessorCache.Get(newData, prop.Name);

                // 允許把值改成 null；只要不同就更新並標記
                if (!Equals(oldVal, newVal))
                {
                    PropertyAccessorCache.Set(oldData, prop.Name, newVal);
                    DataAccess.Entry(oldData).Property(prop.Name).IsModified = true;
                }
            }
            // 這個方法只負責把變更標記好；真正 SaveChanges 在上層 CommitDataAsync
            await Task.CompletedTask;
        }
        /// <summary>
        /// 刪除(非同步)
        /// </summary>
        /// <param name="key"></param>
        public async Task<bool> DeleteAsync(TModel oldData)
        {
            var entry = DataAccess.Entry(oldData);
            if (entry.State == EntityState.Detached) DataAccess.Attach(oldData);
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
        public async Task<IList<TModel>> QueryListAsync(LambdaExpression selectExpr, LambdaExpression whereExpr, IReadOnlyList<OrderBySpec>? orderBy = null, int pageCt = 0, int takeCt = 0)
        {
            IQueryable<TModel> query = DataAccess.Set<TModel>();
            // ✅ Where 條件
            if (!whereExpr.IsNullOrEmpty()) query = query.Where((Expression<Func<TModel, bool>>)whereExpr);
            // ✅ 排序
            if (orderBy != null && orderBy.Count > 0) query = ApplyOrderBy(query, orderBy);
            // ✅ 分頁
            if (takeCt > 0 && pageCt > 0) query = query.Skip((pageCt - 1) * takeCt).Take(takeCt);
            // ✅ 解析 navigation 路徑
            var includes = new HashSet<string>();
            if (selectExpr != null) includes.UnionWith(ExpressionIncludeHelper.ExtractIncludePaths(selectExpr));
            // ✅ 執行 Include
            foreach (var path in includes) query = query.Include(path);  // 支援多層如 A.B.C

#if DEBUG
            var sqlStr = selectExpr == null ? query.ToQueryString() : query.Select((Expression<Func<TModel, TModel>>)selectExpr).ToQueryString();
            Console.WriteLine(sqlStr);
#endif
            // ✅ Select
            var result = selectExpr == null? await query.Cast<TModel>().ToListAsync() : await query.Select((Expression<Func<TModel, TModel>>)selectExpr).Cast<TModel>().ToListAsync();
            return result;
        }

        /// <summary>
        /// 查看表單清單總數量(非同步)
        /// </summary>
        /// <returns></returns>
        public async Task<int> QueryListCountAsync(LambdaExpression selectExpr, LambdaExpression whereExpr)
        {
            IQueryable<TModel> query = DataAccess.Set<TModel>();
            // ✅ Where 條件
            if (!whereExpr.IsNullOrEmpty()) query = query.Where((Expression<Func<TModel, bool>>)whereExpr);
            // ✅ 解析 navigation 路徑
            var includes = new HashSet<string>();
            if (selectExpr != null) includes.UnionWith(ExpressionIncludeHelper.ExtractIncludePaths(selectExpr));
            // ✅ 執行 Include
            foreach (var path in includes) query = query.Include(path);  // 支援多層如 A.B.C
#if DEBUG
            var sqlStr = selectExpr == null ? query.ToQueryString() : query.Select((Expression<Func<TModel, TModel>>)selectExpr).ToQueryString();
            Console.WriteLine(sqlStr);
#endif
            // ✅ Select
            var result = selectExpr == null ? await query.Cast<TModel>().CountAsync() : await query.Select((Expression<Func<TModel, TModel>>)selectExpr).Cast<TModel>().CountAsync();
            return result;
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


        private static IQueryable<TModel> ApplyOrderBy(IQueryable<TModel> source, IReadOnlyList<OrderBySpec>? specs)
        {
            if (specs == null || specs.Count == 0) return source;

            var param = Expression.Parameter(typeof(TModel), "x");
            IOrderedQueryable<TModel>? ordered = null;

            foreach (var spec in specs)
            {
                var parts = spec.Col.Split('.', StringSplitOptions.RemoveEmptyEntries);

                // 產生排序用 key（處理集合→聚合成純量）
                Expression key = BuildKeyForOrder(param, parts, spec.Desc);

                var lambda = Expression.Lambda(key, param);
                string methodName =
                    ordered == null
                        ? (spec.Desc ? "OrderByDescending" : "OrderBy")
                        : (spec.Desc ? "ThenByDescending" : "ThenBy");

                var method = typeof(Queryable).GetMethods()
                    .First(m => m.Name == methodName && m.GetParameters().Length == 2);

                var generic = method.MakeGenericMethod(typeof(TModel), key.Type);
                var result = generic.Invoke(null, new object[] { ordered ?? source, lambda })!;
                ordered = (IOrderedQueryable<TModel>)result;
            }

            return ordered ?? source;
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
}
