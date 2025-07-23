using EFCore.BulkExtensions;
using GraphQL;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.VisualBasic;
using System.Buffers.Text;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using System.Reflection;
using System.Reflection.Metadata;
using System.Security.AccessControl;
using System.Threading.Tasks;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static GraphQL.Validation.Rules.OverlappingFieldsCanBeMerged;
using static System.Runtime.InteropServices.JavaScript.JSType;
using static WCMS.SysCore.Enum.SysEnum;

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
        public async Task CreateAsync(object newData)
        {
            if (newData is TModel single)
            {
                await DataAccess.AddAsync(single);
            }
            else if (newData is IEnumerable<TModel> list)
            {
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
            foreach(var fieldProp in PropertyAccessorCache.GetProperties(typeof(TModel))) 
            {
                if (!fieldProp.CanWrite) continue;
                var oldVal = PropertyAccessorCache.Get(oldData, fieldProp.Name);
                var NewVal = PropertyAccessorCache.Get(newData, fieldProp.Name);
                if (!Equals(oldVal,NewVal)) PropertyAccessorCache.Set(oldData, fieldProp.Name, NewVal);
            }
        }
        /// <summary>
        /// 刪除(非同步)
        /// </summary>
        /// <param name="key"></param>
        public async Task<bool> DeleteAsync(TModel oldData)
        {
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
        public async Task<IList<TModel>> QueryListAsync(LambdaExpression selectExpr, LambdaExpression whereExpr, int pageCt = 0, int takeCt = 0)
        {
            IQueryable<TModel> query = DataAccess.Set<TModel>();
            // ✅ Where 條件
            if (!whereExpr.IsNullOrEmpty()) query = query.Where((Expression<Func<TModel, bool>>)whereExpr);
            // ✅ 分頁
            if (takeCt > 0 && pageCt > 0) query = query.Skip((pageCt - 1) * takeCt).Take(takeCt);
            // ✅ 解析 navigation 路徑
            var includes = new HashSet<string>();
            if (selectExpr != null) includes.UnionWith(ExpressionIncludeHelper.ExtractIncludePaths(selectExpr));
            // ✅ 執行 Include
            foreach (var path in includes) query = query.Include(path);  // 支援多層如 A.B.C
            // ✅ Select
            var result = selectExpr == null? await query.Cast<TModel>().ToListAsync() : await query.Select((Expression<Func<TModel, TModel>>)selectExpr).Cast<TModel>().ToListAsync();
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
                        var path = BuildPath(node);
                        if (path.Contains(".")) _paths.Add(path); // 主表欄位不加入
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

                    // ✅ 額外補：如果 method chain 是 CategoryDetail.AsQueryable().Select(...)
                    if (node.Method.Name == "Select" && node.Arguments.Count == 2)
                    {
                        // 目標物件為 AsQueryable(CategoryDetail)
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
}
