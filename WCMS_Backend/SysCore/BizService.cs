using static WCMS.SysCore.Enum.SysEnum;
using WCMS.SysCore.Model;
using Microsoft.EntityFrameworkCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using System.Collections;
using WCMS.SysCore.Interface;
using System.Linq.Expressions;
using System.Linq.Dynamic.Core;

namespace WCMS.SysCore
{
    public class BizService<TSet> : IBizService<TSet> where TSet : class
    {
        #region Property
        /// <summary>
        /// 
        /// </summary>
        public UserModel OperateUser { get; set; } = SysParam.SysOperator;
        /// <summary>
        /// 
        /// </summary>
        protected Dictionary<string, object> RepoDict { get; } = [];
        /// <summary>
        /// 功能Id
        /// </summary>
        public string ProgId { get; }

        /* LibMessage包*/

        /// <summary>
        /// 變更日誌系統
        /// </summary>
        public SysChangeLog? SysChangeLog { get; }
        /// <summary>
        /// 
        /// </summary>
        private ApplicationDbContext DataAccess { get; }
        #endregion

        #region Construct
        public BizService(IRepositoryMapProvider repoMapProvider)
        {
            //SysChangeLog = new SysChangeLog(repo.DataAccess);
            RepoDict = repoMapProvider.GetRepoDict<TSet>();
            DataAccess = ((dynamic)RepoDict.FirstOrDefault().Value).DataAccess;
        }
        #endregion

        #region Public
        public async Task<TSet> CreateSetAsync(TSet set)
        {
            try
            {
                await BeginTransactionAsync();
                //SetCreateInfo()
                BeforeUpdate(set, FuncAction.Create);
                //如果有錯，這邊先回滾，減少後續執行的資源浪費
                await DoCreateAsync(set);
                AfterUpdate(default, set, FuncAction.Create, TransStatus.Increase);
                //如果有錯，這邊回滾，避免資料誤提交
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Create);
                return set;
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<TSet> UpdateSetAsync(object[] key, TSet newSet)
        {
            try
            {
                await BeginTransactionAsync();
                //SetModifyInfo(set);
                BeforeUpdate(newSet, FuncAction.Update);
                //如果有錯，這邊先回滾，減少後續執行的資源浪費
                TSet oldSet = await DoQuerySetAsync(key);
                TSet oldSet_Cache = oldSet.DeepClone();
                await DoUpdateAsync(oldSet, newSet);
                AfterUpdate(oldSet_Cache, oldSet, FuncAction.Update, TransStatus.Difference);//oldSet已經進入DataAccess，修改完會跟著修正至DB
                //如果有錯，這邊回滾，避免資料誤提交
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Update);
                return newSet;
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<bool> DeleteSetAsync(object[] key)
        {
            try
            {
                await BeginTransactionAsync();
                //SetModifyInfo(set);
                TSet oldSet = await DoQuerySetAsync(key);
                TSet oldSet_Cache = oldSet.DeepClone();
                BeforeUpdate(oldSet, FuncAction.Delete);
                //如果有錯，這邊先回滾，減少後續執行的資源浪費
                await DoDeleteAsync(oldSet);
                AfterUpdate(oldSet_Cache, oldSet, FuncAction.Delete, TransStatus.Difference);
                //如果有錯，這邊回滾，避免資料誤提交
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Update);
                return true;
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<TSet> InvalidSetAsync(object[] key, bool status)
        {
            try
            {
                await BeginTransactionAsync();
                TSet oldSet = await DoQuerySetAsync(key);
                TSet oldSet_Cache = oldSet.DeepClone();
                TSet newSet = oldSet.DeepClone();
                await DoInvalidSetAsync(newSet, status);
                BeforeUpdate(oldSet, FuncAction.Invalid);
                //如果有錯，這邊先回滾，減少後續執行的資源浪費
                await DoUpdateAsync(oldSet, newSet);
                AfterUpdate(oldSet_Cache, oldSet, FuncAction.Invalid, TransStatus.Difference);//oldSet已經進入DataAccess，修改完會跟著修正至DB
                //如果有錯，這邊回滾，避免資料誤提交
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Update);
                return oldSet;
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<TSet> QuerySetAsync(object[] key)
        {
            return await DoQuerySetAsync(key);
        }
        public async Task<TSet> QuerySetAsync(string internalId)
        {
            return await DoQuerySetAsync(internalId);
        }
        public async Task<IList<TSet>> QueryListAsync(string[] selectFields, string condition, int pageCt, int takeCt)
        {
            return await DoQueryListAsync(selectFields, condition, pageCt, takeCt);
        }
        /// <summary>
        /// 啟用交易控制(非同步)
        /// </summary>
        /// <returns></returns>
        public async Task BeginTransactionAsync()
        {
            await DataAccess.Database.BeginTransactionAsync();
        }
        /// <summary>
        /// 回滾交易控制(非同步)
        /// </summary>
        /// <returns></returns>
        public async Task RollbackTransactionAsync()
        {
            await DataAccess.Database.RollbackTransactionAsync();
        }
        /// <summary>
        /// 執行更新(非同步)
        /// </summary>
        /// <param name="action"></param>
        public async Task CommitDataAsync()
        {
            await DataAccess.SaveChangesAsync();
            await DataAccess.Database.CommitTransactionAsync();
        }
        #endregion

        #region Protected
        /// <summary>
        /// 
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        protected async Task DoCreateAsync(TSet set)
        {
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                var value = PropertyAccessorCache.Get(set, prop.Name);
                if (value == null) continue;
                await ((dynamic)RepoDict[prop.Name]).CreateAsync((dynamic)value);
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="oldSet"></param>
        /// <param name="newSet"></param>
        /// <returns></returns>
        protected async Task DoUpdateAsync(TSet oldSet, TSet newSet)
        {
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                var oldModel = PropertyAccessorCache.Get(oldSet, prop.Name);
                var newModel = PropertyAccessorCache.Get(newSet, prop.Name);

                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                    await ((dynamic)RepoDict[prop.Name]).UpdateAsync((dynamic)oldModel, (dynamic)newModel);
                else
                {
                    //想一下怎麼處理增刪改的行項
                }
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="oldSet"></param>
        /// <returns></returns>
        protected async Task DoDeleteAsync(TSet oldSet)
        {
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                var oldModel = PropertyAccessorCache.Get(oldSet, prop.Name);
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                    await ((dynamic)RepoDict[prop.Name]).DeleteAsync((dynamic)oldModel); //若做好主子表刪除，應該是不用在往下做了
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        protected async Task<TSet> DoQuerySetAsync(object[] key)
        {
            TSet result = PropertyAccessorCache.CreateInstance(typeof(TSet)) as TSet;
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                dynamic model;
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                { 
                    model = await ((dynamic)RepoDict[prop.Name]).QueryDataAsync(key);
                //else
                //    model = await ((dynamic)RepoDict[prop.Name]).QueryDataDetailAsync(key);
                PropertyAccessorCache.Set(result, prop.Name, model);
                }
                else
                {
                    PropertyAccessorCache.Set(result, prop.Name, PropertyAccessorCache.CreateInstance(prop.PropertyType));
                }
            }
            return result;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        protected async Task<TSet> DoQuerySetAsync(string internalId)
        {
            TSet result = PropertyAccessorCache.CreateInstance(typeof(TSet)) as TSet;

            //var header;
            //foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            //{
            //    if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
            //    {
            //        header = await ((dynamic)RepoDict[prop.Name]).QueryDataAsync(internalId);
            //    }
            //}



            //foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            //{
            //    dynamic model;
            //    if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
            //        model = await ((dynamic)RepoDict[prop.Name]).QueryDataAsync(key);
            //    else
            //        model = await ((dynamic)RepoDict[prop.Name]).QueryDataDetailAsync(key);
            //    PropertyAccessorCache.Set(result, prop.Name, model);
            //}
            return result;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        protected async Task<IList<TSet>> DoQueryListAsync(string[] selectFields, string condition, int pageCt, int takeCt)
        {
            //未來可以做連同detail查詢的grid 待處理
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                {
                    var selectExpr = GetSelectFieldsExpr(prop.PropertyType, selectFields);
                    var whereExpr = GetConditionExpr(prop.PropertyType,condition);
                    return await ((dynamic)RepoDict[prop.Name]).QueryListAsync(selectExpr, whereExpr, pageCt, takeCt);
                }
            }
            return null;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        protected async Task DoInvalidSetAsync(TSet set, bool isInvalid)
        {
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                {
                    if (PropertyAccessorCache.Get(set, prop.Name) is BasicDataModel header)
                    {
                        header.DataStatus = isInvalid ? DataStatus.Invalid : DataStatus.Valid;
                        header.FormStatus = isInvalid ? FormStatus.Obsoleted : FormStatus.Saved;
                        header.InvalidTime = isInvalid ? DateTime.UtcNow : null;
                        header.InvalidUserId = isInvalid ? OperateUser?.UserId : string.Empty;
                    }
                    break;
                }
            }
            return;
        }
        #endregion

        #region Protected virtual
        /// <summary>
        /// 保存前
        /// </summary>
        /// <param name="set"></param>
        protected virtual void BeforeUpdate(TSet set, FuncAction act) { }
        /// <summary>
        /// 更新之後，尚未提交 (供過帳使用)
        /// </summary>
        /// <param name="oldSet"></param>
        /// <param name="newSet"></param>
        /// <param name="status"></param>
        protected virtual void AfterUpdate(TSet? oldSet, TSet? newSet, FuncAction act, TransStatus status) { }
        /// <summary>
        /// 執行SaveChanges後
        /// </summary>
        /// <param name="set"></param>
        protected virtual void AfterSaveChanges(FuncAction action) { }
        /// <summary>
        /// 作廢後
        /// </summary>
        /// <param name="set"></param>
        /// <param name="status"></param>
        protected virtual void AfterInvalid(TSet set, bool status) { }
        #endregion

        #region Private
        /// <summary>
        /// 自動產生流水號ID
        /// 若Id已有值，就不做自動產生
        /// </summary>
        private string AutoGenerateId(TSet set, string prefix = "")
        {
            prefix = prefix.Equals(string.Empty) ? ProgId : prefix;
            return prefix;
            //string id;

            //if (set.header.id != string.Empty) id = set.header.id;
            //else id = Repo.GenerateIdAsync(set, p => p.id, prefix);

            //set.header.id = id;
            //foreach(var item in set.detail)
            //{
            //    item.id = id; 
            //}
        }
        /// <summary>
        /// 設置新增時資料
        /// </summary>
        /// <param name="header"></param>
        private void SetCreateInfo(BasicDataModel header)
        {
            DateTime now = DateTime.Now;
            header.CreateUserId = OperateUser.UserId;
            header.CreateTime = now;
            header.ModifyUserId = OperateUser.UserId;
            header.ModifyTime = now;
            header.InternalId = Guid.NewGuid().ToString();
        }
        /// <summary>
        /// 設置修改時使用者資料
        /// </summary>
        /// <param name="header"></param>
        private void SetModifyInfo(BasicDataModel header)
        {
            DateTime now = DateTime.Now;
            header.ModifyUserId = OperateUser.UserId;
            header.ModifyTime = now;
        }
        /// <summary>
        /// 設置作廢時使用者資料
        /// </summary>
        /// <param name="header"></param>
        /// <param name="status"></param>
        private void SetInvalidInfo(BasicDataModel header, bool status)
        {
            DateTime now = DateTime.Now;
            header.ModifyUserId = OperateUser.UserId;
            header.ModifyTime = now;
            header.FormStatus = status ? FormStatus.Obsoleted : FormStatus.Saved;
            header.InvalidUserId = status ? OperateUser.UserId : string.Empty;
            header.InvalidTime = status ? now : null;
        }
        /// <summary>
        /// 設定行項RowState
        /// </summary>
        /// <param name="entityList"></param>
        private void SetCreateRowState(dynamic entityList)
        {
            foreach (var entity in entityList) entity.RowState = RowState.Insert;
        }
        /// <summary>
        /// 獲取要搜尋的欄位表達式
        /// </summary>
        /// <typeparam name="TModel"></typeparam>
        /// <param name="selectFields"></param>
        /// <returns></returns>
        private LambdaExpression GetSelectFieldsExpr(Type modelType, string[] selectFields)
        {
            var param = Expression.Parameter(modelType, "x");
            // 過濾出 TModel 中的有效欄位
            var validProps = PropertyAccessorCache.GetProperties(modelType).Where(p => selectFields.Contains(p.Name, StringComparer.OrdinalIgnoreCase)).ToList();
            // 若欄位為空，可選擇回傳 Identity (x => x) 或拋出例外
            if (!validProps.Any())
            {
                // Identity 版本
                return Expression.Lambda(param, param);
            }
            var bindings = validProps.Select(p => Expression.Bind(p, Expression.Property(param, p.Name)));
            var body = Expression.MemberInit(Expression.New(modelType), bindings);
            var convertedBody = Expression.Convert(body, typeof(object));
            return Expression.Lambda(convertedBody, param);
        }
        /// <summary>
        /// 獲取要搜尋的條件表達式
        /// </summary>
        /// <typeparam name="TModel"></typeparam>
        /// <param name="condition"></param>
        /// <returns></returns>
        public static LambdaExpression GetConditionExpr(Type modelType, string condition)
        {
            if (string.IsNullOrWhiteSpace(condition))
            {
                // x => true
                var param = Expression.Parameter(modelType, "x");
                return Expression.Lambda(Expression.Constant(true), param);
            }
            // 產生 Expression<Func<T, bool>>
            var parsingConfig = new ParsingConfig { /* 可加嚴格型別檢查等 */ };
            var lambda = DynamicExpressionParser.ParseLambda(
                parsingConfig,
                [Expression.Parameter(modelType, "x")],
                typeof(bool),
                condition
            );
            return lambda;
        }
        #endregion
    }
}
