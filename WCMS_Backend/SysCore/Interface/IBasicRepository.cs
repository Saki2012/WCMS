using Microsoft.EntityFrameworkCore;
using System.Collections;
using System.Linq.Expressions;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.Interface
{
    public interface IBasicRepository<TModel> where TModel : class
    {
        #region Property
        /// <summary>
        /// 
        /// </summary>
        public ApplicationDbContext DataAccess { get; }
        #endregion

        #region Public
        /// <summary>
        /// 新增(非同步)
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        public Task CreateAsync(object newData);
        /// <summary>
        /// 修改(非同步)
        /// </summary>
        /// <param name="key"></param>
        /// <param name="inputSet"></param>
        /// <returns></returns>
        public Task UpdateAsync(TModel oldData, TModel newData);
        /// <summary>
        /// 刪除(非同步)
        /// </summary>
        /// <param name="key"></param>
        public Task<bool> DeleteAsync(TModel oldData);
        /// <summary>
        /// 查看表單(非同步)
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        public Task<TModel> QueryDataAsync(params object[] key);
        /// <summary>
        /// 查詢明細(非同步)
        /// </summary>
        /// <returns></returns>
        public Task<IList<TModel>> QueryListAsync(LambdaExpression selectExpr, LambdaExpression whereExpr, int pageCt = 1, int takeCt = 10);
        /// <summary>
        /// 自動產生流水號ID
        /// </summary>
        /// <returns></returns>
        public Task<string> GenerateIdAsync(DbSet<TModel> dbSet, Expression<Func<TModel, string>> idSelector, string prefix, string format);
        #endregion
    }

}
