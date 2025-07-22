using Microsoft.EntityFrameworkCore;
using System.Collections;
using System.ComponentModel.DataAnnotations;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using System.Reflection;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore
{
    public class BizService<TSet> : IBizService<TSet> where TSet : class
    {
        #region Property
        protected ApiResponse<TSet> Response { get; } = new ApiResponse<TSet>();
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
        /// <summary>
        /// 流水編號前綴碼
        /// </summary>
        private string _Prifix = string.Empty;
        /// <summary>
        /// 流水編號前綴碼
        /// </summary>
        public string PrefixId { get { return _Prifix == string.Empty ? ProgId : _Prifix; } protected set { _Prifix = value; } }
        /* LibMessage包*/
        /// <summary>
        /// 變更日誌系統
        /// </summary>
        public SysChangeLog? SysChangeLog { get; }
        /// <summary>
        /// 
        /// </summary>
        private ApplicationDbContext DataAccess { get; }
        /// <summary>
        /// 回應結果
        /// </summary>
        /// <typeparam name="T"></typeparam>
        public class ApiResponse<T> : IApiResponse<T>
        {
            public bool IsSuccess { get { foreach (var msg in SysMessage) if (msg.Status == MessageStatus.Error) return false; return true;} }
            public IList<SysMessageModel> SysMessage { get; set; } = [];
            public IList<T>? Data { get; set; } = [];
            public void AddMessage(MessageStatus status, SysMessageCode code)
            {
                SysMessage.Add(new SysMessageModel { Status=status, MessageCode=code.ToString()});
            }
            public void ThrowIfFailed(string message= "業務邏輯錯誤")
            {
                if (!IsSuccess) throw new BusinessException(message);
            }
        }
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
        public async Task<IApiResponse<TSet>> CreateSetAsync(TSet set)
        {
            try
            {
                await BeginTransactionAsync();
                GetModelType(set, out BasicDataModel header, out Dictionary<string, IList> details);
                SetCreateInfo(header);
                AutoGenerateId(header, details);
                BeforeUpdate(set, FuncAction.Create);
                Response.ThrowIfFailed();
                await DoCreateAsync(set);
                AfterUpdate(default, set, FuncAction.Create, TransStatus.Increase);
                Response.ThrowIfFailed();
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Create);
                Response.AddMessage(MessageStatus.Green, SysMessageCode.BECode00002);
                Response.Data.Add(set);
                return Response;
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<IApiResponse<TSet>> UpdateSetAsync(string internalId, TSet newSet)
        {
            try
            {
                await BeginTransactionAsync();
                GetModelType(newSet, out BasicDataModel header, out Dictionary<string, IList> details);
                SetModifyInfo(header);
                BeforeUpdate(newSet, FuncAction.Update);
                Response.ThrowIfFailed();
                TSet oldSet = await DoQuerySetAsync(internalId);
                TSet oldSet_Cache = oldSet.DeepClone();
                await DoUpdateAsync(oldSet, newSet);
                AfterUpdate(oldSet_Cache, oldSet, FuncAction.Update, TransStatus.Difference);//oldSet已經進入DataAccess，修改完會跟著修正至DB
                Response.ThrowIfFailed();
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Update);
                Response.AddMessage(MessageStatus.Green, SysMessageCode.BECode00006);
                Response.Data.Add(oldSet);
                return Response;

            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<IApiResponse<TSet>> DeleteSetAsync(string internalId)
        {
            try
            {
                await BeginTransactionAsync();
                CheckIsUsed();
                TSet oldSet = await DoQuerySetAsync(internalId);
                TSet oldSet_Cache = oldSet.DeepClone();
                BeforeUpdate(oldSet, FuncAction.Delete);
                Response.ThrowIfFailed();
                await DoDeleteAsync(oldSet);
                AfterUpdate(oldSet_Cache, oldSet, FuncAction.Delete, TransStatus.Difference);
                Response.ThrowIfFailed();
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Update);
                Response.AddMessage(MessageStatus.Green, SysMessageCode.BECode00004);
                Response.Data.Add(oldSet);
                return Response;

            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<IApiResponse<TSet>> InvalidSetAsync(string internalId, bool status)
        {
            try
            {
                await BeginTransactionAsync();
                TSet oldSet = await DoQuerySetAsync(internalId);
                TSet oldSet_Cache = oldSet.DeepClone();
                TSet newSet = oldSet.DeepClone();
                DoInvalidSet(newSet, status);
                BeforeUpdate(oldSet, FuncAction.Invalid);
                Response.ThrowIfFailed();
                await DoUpdateAsync(oldSet, newSet);
                AfterUpdate(oldSet_Cache, oldSet, FuncAction.Invalid, TransStatus.Difference);//oldSet已經進入DataAccess，修改完會跟著修正至DB
                Response.ThrowIfFailed();
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Update);
                Response.AddMessage(MessageStatus.Green, SysMessageCode.BECode00008);
                Response.Data.Add(oldSet);
                return Response;
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<IApiResponse<TSet>> QuerySetAsync(string internalId)
        {
            var data = await DoQuerySetAsync(internalId);
            //Response.AddMessage(MessageStatus.Error, SysMessageCode.BECode00001);
            Response.ThrowIfFailed();
            Response.AddMessage(MessageStatus.Green, SysMessageCode.BECode00010);
            Response.Data.Add(data);
            return Response;
        }
        public async Task<IApiResponse<TSet>> QueryListAsync(string[] selectFields, string condition, int pageNumber, int pageSize)
        {
            /* 暫時只提供查表頭 */
            IList<TSet> result = [];
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && typeof(BasicDataModel).IsAssignableFrom(prop.PropertyType))
                {
                    TSet srcData = PropertyAccessorCache.CreateInstance(typeof(TSet)) as TSet;
                    var data = (await DoQueryListAsync(prop, selectFields, condition, pageNumber, pageSize)).ToDynamicList().FirstOrDefault();
                    PropertyAccessorCache.Set(srcData, prop.Name, data);
                    result.Add(srcData);
                }
            }
            Response.ThrowIfFailed();
            Response.AddMessage(MessageStatus.Green, SysMessageCode.BECode00010);
            Response.Data = result;
            return Response;
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
                    await ((dynamic)RepoDict[prop.Name]).DeleteAsync((dynamic)oldModel);
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        protected async Task<TSet> DoQuerySetAsync(string internalId)
        {
            string condition = await GetPKConditionByInternalId(internalId);
            if (condition == null) return default;
            TSet result = PropertyAccessorCache.CreateInstance(typeof(TSet)) as TSet;
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && typeof(BasicDataModel).IsAssignableFrom(prop.PropertyType))
                {
                    var data = (await DoQueryListAsync(prop, [], condition, 0, 0)).ToDynamicList().FirstOrDefault();
                    PropertyAccessorCache.Set(result, prop.Name, data);
                }
                else if (typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                {
                    var detailType = prop.PropertyType.GetGenericArguments().First();
                    var data = (await DoQueryListAsync(detailType, [], condition, 0, 0));
                    PropertyAccessorCache.Set(result, prop.Name, data);
                }
            }
            return result;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        protected async Task<IList> DoQueryListAsync(PropertyInfo prop, string[] selectFields, string condition, int pageCt, int takeCt)
        {
            return await DoQueryListAsync(prop.PropertyType, selectFields, condition, pageCt, takeCt);
        }
        protected async Task<IList> DoQueryListAsync(Type type, string[] selectFields, string condition, int pageCt, int takeCt)
        {
            var selectExpr = GetSelectFieldsExpr(type, selectFields);
            var whereExpr = GetConditionExpr(type, condition);
            var data = await ((dynamic)RepoDict[type.Name]).QueryListAsync(selectExpr, whereExpr, pageCt, takeCt);
            return data;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        protected void DoInvalidSet(TSet set, bool isInvalid)
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
        private void AutoGenerateId(BasicDataModel header,Dictionary<string, IList> details)
        {
            var keyProp = PropertyAccessorCache.GetProperties(header.GetType()).Where(p => p.IsDefined(typeof(KeyAttribute), inherit: true)).LastOrDefault();
            if (keyProp == null) return;
            var idSelector = BuildIdSelectorLambda(header.GetType(),keyProp);
            string id = PropertyAccessorCache.Get(header, keyProp.Name).ToString();
            id = id != string.Empty ? id : ((dynamic)RepoDict[header.GetType().Name]).GenerateIdAsync(header, idSelector, PrefixId);

            PropertyAccessorCache.Set(header, keyProp.Name, id);
            foreach(var detail in details)
            {
                foreach(var row in detail.Value)
                {
                    PropertyAccessorCache.Set(row, keyProp.Name, id);
                }
            }
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
                return null;
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
        private LambdaExpression GetConditionExpr(Type modelType, string condition)
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
        /// <summary>
        /// 獲取表頭明細模型
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        private void GetModelType(TSet set,out BasicDataModel header,out Dictionary<string, IList> details)
        {
            header = null;
            details = [];
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (typeof(BasicDataModel).IsAssignableFrom(prop.PropertyType))
                {
                    header = PropertyAccessorCache.Get(set, prop.Name) as BasicDataModel;
                }
                else
                {
                    details.Add(prop.Name, PropertyAccessorCache.Get(set, prop.Name) as IList);
                }
            }
        }
        /// <summary>
        /// 檢查資料是否被用
        /// </summary>
        private void CheckIsUsed()
        {

        }
        /// <summary>
        /// 根據內部唯一標示號找到主鍵條件
        /// </summary>
        /// <param name="internalId"></param>
        /// <returns></returns>
        private async Task<string> GetPKConditionByInternalId(string internalId)
        {
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && typeof(BasicDataModel).IsAssignableFrom(prop.PropertyType))
                {
                    string resultCondition = string.Empty;
                    var pkProps = PropertyAccessorCache.GetProperties(prop.PropertyType).Where(p => p.IsDefined(typeof(KeyAttribute), inherit: true)).ToArray();
                    var condition = $"InternalId = \"{internalId}\"";
                    var fieldNames = pkProps.Select(p => p.Name).ToArray();
                    var headerData = (await DoQueryListAsync(prop, fieldNames, condition, 0, 0)).ToDynamicList().FirstOrDefault();
                    foreach (var pk in pkProps)
                        resultCondition = LibData.Merge(" And ", false, resultCondition, $"{pk.Name} = \"{PropertyAccessorCache.Get(headerData, pk.Name)}\"");
                    return resultCondition;
                }
            }
            return string.Empty;
        }
        private static LambdaExpression BuildIdSelectorLambda(Type modelType, PropertyInfo prop)
        {
            var param = Expression.Parameter(modelType, "p");
            var propertyAccess = Expression.Property(param, prop.Name);
            Expression body = propertyAccess.Type == typeof(string) ? (Expression)propertyAccess : Expression.Call(propertyAccess, "ToString", Type.EmptyTypes);
            var delegateType = typeof(Func<,>).MakeGenericType(modelType, typeof(string));
            return Expression.Lambda(delegateType, body, param);
        }
        #endregion
    }
}
