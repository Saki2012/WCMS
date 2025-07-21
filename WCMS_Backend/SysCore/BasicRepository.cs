using WCMS.SysCore.Model;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using System.Linq;
using System.Security.AccessControl;
using System.Collections;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using WCMS.SysCore.Library;
using Microsoft.EntityFrameworkCore;
using static WCMS.SysCore.Enum.SysEnum;
using System.Threading.Tasks;
using static GraphQL.Validation.Rules.OverlappingFieldsCanBeMerged;
using System.Collections.Generic;
using WCMS.SysCore.Enum;
using EFCore.BulkExtensions;
using WCMS.SysCore.Interface;
using System.Linq.Dynamic.Core;
using Microsoft.VisualBasic;
using System.Linq.Expressions;
using System.Buffers.Text;
using GraphQL;

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
        public async Task<IList<TModel>> QueryListAsync(LambdaExpression selectExpr, LambdaExpression whereExpr, int pageCt = 1, int takeCt = 10)
        {
            IQueryable<TModel> query = DataAccess.Set<TModel>();
            if (selectExpr.IsNullOrEmpty()) return null;
            if (!whereExpr.IsNullOrEmpty()) query = query.Where(whereExpr);
            if (takeCt > 0 && pageCt>0) query= query.Skip((pageCt - 1) * takeCt).Take(takeCt);
            //if (selectExpr is Expression <Func<TModel, object>> expr)
            return await query.Select((Expression<Func<TModel, object>>)selectExpr).Cast<TModel>().ToListAsync();
        }
        /// <summary>
        /// 自動產生流水號ID
        /// </summary>
        /// <param name="dbSet"></param>
        /// <param name="idSelector"></param>
        /// <param name="prefix"></param>
        /// <param name="format"></param>
        /// <returns></returns>
        public async Task<string> GenerateIdAsync(DbSet<TModel> dbSet, Expression<Func<TModel, string>> idSelector, string prefix = "", string format = "D3")
        {
             string id = prefix + DateTime.Now.ToString("yyyyMMdd");
            var compiledSelector = idSelector.Compile();
            // 查出當天已存在的最大流水號
            var maxIdToday = await dbSet.AsNoTracking().Where(e => compiledSelector(e).StartsWith(id)).OrderByDescending(e => compiledSelector(e)).Select(e => compiledSelector(e)).FirstOrDefaultAsync();
            int nextSerial = 1;
            if (!string.IsNullOrEmpty(maxIdToday) && maxIdToday.Length >= prefix.Length + 3)
            {
                string serialStr = maxIdToday.Substring(prefix.Length, 3);
                if (int.TryParse(serialStr, out int currentSerial))
                {
                    nextSerial = currentSerial + 1;
                }
            }
            return id + nextSerial.ToString(format);
        }
        #endregion

        #region Private

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
