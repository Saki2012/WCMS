using System.Collections;
using System.ComponentModel.DataAnnotations;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using WCMS.Features.Member.Account;
using WCMS.Features.SystemSetting.Auth;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.QueryListParam;

namespace WCMS.SysCore
{
    /// <summary>
    /// Biz服務所需注入參數
    /// </summary>
    /// <param name="repoMapProvider"></param>
    /// <param name="message"></param>
    /// <param name="currentUser"></param>
    public sealed record BizDeps(IRepositoryMapProvider repoMapProvider, IErrorHelper message, ICurrentUserAccessor currentUser);

    public class BizService<TSet> : IBizService<TSet> where TSet : class
    {
        #region Property
        /// <summary>
        /// 
        /// </summary>
        public User_DTO OperateUser { get; set; }
        /// <summary>
        /// 
        /// </summary>
        protected Dictionary<string, object> RepoDict { get; }
        protected IRepositoryMapProvider RepoMapProvider { get; }
        /// <summary>
        /// 
        /// </summary>
        private string? _ProgId = null;
        /// <summary>
        /// 功能Id
        /// </summary>
        public string ProgId { get { _ProgId ??= GetType().GetCustomAttribute<ProgIdAttribute>(inherit: true)?.Value; return _ProgId; } }
        /// <summary>
        /// 流水編號前綴碼
        /// </summary>
        private string _Prifix = string.Empty;
        /// <summary>
        /// 流水編號前綴碼
        /// </summary>
        public string PrefixId
        {
            get 
            {
                if (_Prifix == string.Empty)this.PrefixId = ProgId;
                    return  _Prifix; 
            }
            protected set
            {
                if (!string.IsNullOrEmpty(value) && value.Length > SysLengthParam.ID - 11)
                    _Prifix = value.Substring(0, SysLengthParam.ID - 11); // 最多 xxxyyyymmdd(八位) 個字
                else
                    _Prifix = value;
            }
        }
        /// <summary>
        /// 是否自動創建主鍵
        /// </summary>
        protected virtual bool IsAutoGenerateId { get; set; } = true;
        /* LibMessage包*/
        /// <summary>
        /// 變更日誌系統
        /// </summary>
        //public SysChangeLog? SysChangeLog { get; }
        /// <summary>
        /// 
        /// </summary>
        private ApplicationDbContext DataAccess { get; }
        protected IErrorHelper Message { get; }
        /// <summary>
        /// //網站預設語系(暫時寫死)
        /// </summary>
        protected LangCode SiteDefaultLang { get; set; } = LangCode.zhtw;
        /// <summary>
        /// 執行時語系(暫時寫死，為提供當前用戶語系的資料或是訊息)
        /// </summary>
        protected LangCode EffectiveLang { get; set; } = LangCode.zhtw;
        #endregion

        #region Construct
        public BizService(BizDeps bizDeps)
        {
            //SysChangeLog = new SysChangeLog(repo.DataAccess);
            RepoMapProvider = bizDeps.repoMapProvider;
            RepoDict = bizDeps.repoMapProvider.GetRepoDict<TSet>();
            DataAccess = ((dynamic)RepoDict.FirstOrDefault().Value).DataAccess;
            Message = bizDeps.message;
            OperateUser = string.IsNullOrWhiteSpace(OperateUser?.UserId) ? bizDeps.currentUser.User : OperateUser;
        }
        #endregion

        #region Public
        public async Task BizInitCreateSetsAsync(TSet[] sets)
        {
            foreach (var set in sets)
            {
                PropertyInfo headerProp = PropertyAccessorCache.GetProperties<TSet>().Where(p => !p.IsListPropertyType()).FirstOrDefault();
                var header = PropertyAccessorCache.Get(set, headerProp.Name);
                PropertyAccessorCache.Set(header, nameof(BasicDataModel.IsIniData), true);
                await BizCreateSetAsync(set);
            }
        }
        public async Task<TSet> BizCreateSetAsync(TSet set)
        {
            try
            {
                //await BeginTransactionAsync();
                GetModelType(set, out BasicDataModel header, out Dictionary<string, IList> details);
                SetCreateInfo(header);
                await AutoGenerateId(header, details);
                await BeforeUpdate(set, FuncAction.Create);
                if(Message.HasError) return set;
                await DoCreateAsync(set);
                await AfterUpdate(default, set, FuncAction.Create, TransStatus.Increase);
                if (Message.HasError) return set;
                await DataAccess.SaveChangesAsync();      
                AfterSaveChanges(FuncAction.Create);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00002);
                return set;
            }
            catch
            {
                //await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<TSet> BizUpdateSetAsync(string internalId, TSet newSet)
        {
            try
            {
                await BeginTransactionAsync();
                GetModelType(newSet, out BasicDataModel header, out Dictionary<string, IList> details);
                SetModifyInfo(header);
                await AutoGenerateId(header, details);
                await BeforeUpdate(newSet, FuncAction.Update);
                if (Message.HasError) return newSet;
                TSet oldSet = await DoQuerySetAsync(internalId);
                TSet oldSet_Cache = oldSet.DeepClone();
                await DoUpdateAsync(oldSet, newSet);
                await AfterUpdate(oldSet_Cache, oldSet, FuncAction.Update, TransStatus.Difference);//oldSet已經進入DataAccess，修改完會跟著修正至DB
                if (Message.HasError) return newSet;
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Update);
                Message.AddMessage(MessageStatus.Green,SysMessageCode.BECode00006);
                return oldSet;
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<TSet> BizDeleteSetAsync(string internalId)
        {
            try
            {
                await BeginTransactionAsync();
                CheckIsUsed();
                TSet oldSet = await DoQuerySetAsync(internalId);
                TSet oldSet_Cache = oldSet.DeepClone();
                await BeforeUpdate(oldSet, FuncAction.Delete);
                if (Message.HasError) return oldSet;
                await DoDeleteAsync(oldSet);
                await AfterUpdate(oldSet_Cache, oldSet, FuncAction.Delete, TransStatus.Difference);
                if (Message.HasError) return oldSet;
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Update);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00004);
                return oldSet;
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<TSet> BizInvalidSetAsync(string internalId, bool status)
        {
            try
            {
                await BeginTransactionAsync();
                TSet oldSet = await DoQuerySetAsync(internalId);
                TSet oldSet_Cache = oldSet.DeepClone();
                TSet newSet = oldSet.DeepClone();
                DoInvalidSet(newSet, status);
                await BeforeUpdate(oldSet, FuncAction.Invalid);
                if (Message.HasError) return newSet;
                await DoUpdateAsync(oldSet, newSet);
                await AfterUpdate(oldSet_Cache, oldSet, FuncAction.Invalid, TransStatus.Difference);//oldSet已經進入DataAccess，修改完會跟著修正至DB
                if (Message.HasError) return newSet;
                await CommitDataAsync();
                AfterSaveChanges(FuncAction.Update);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00008);
                return oldSet;
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
        }
        public async Task<TSet> BizQuerySetAsync(string internalId)
        {
            var data = await DoQuerySetAsync(internalId);
            return data;
        }
        public async Task<IList<TSet>> BizQueryListAsync(QueryListParam param)
        {
            return await BizQueryListAsync(param.Fields,param.Condition, param.OrderBy, param.PageNumber, param.PageSize);
        }
        public async Task<IList<TSet>> BizQueryListAsync(string[] selectFields, string condition, IReadOnlyList<OrderBySpec> OrderBy=null, int pageNumber=0, int pageSize = 0)
        {
            IList<TSet> result = [];
            var props = PropertyAccessorCache.GetProperties<TSet>();
            var headerProp = props.FirstOrDefault(p => !p.PropertyType.IsGenericType);
            var datas = (await DoQueryListAsync(headerProp, selectFields, condition, OrderBy, pageNumber, pageSize)).ToDynamicList();
            foreach (var data in datas)
            {
                var srcData = BuildSetFromData(headerProp, data);
                result.Add(srcData);
            }
            return result;
        }
        public async Task<int> BizQueryTotalCounts(string[] selectFields, string condition)
        {
            int totalCount = 0;
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && typeof(BasicDataModel).IsAssignableFrom(prop.PropertyType))
                {
                    var count = await DoQueryListCountAsync(prop.PropertyType, selectFields, condition);
                    totalCount = count;
                }
            }
            return totalCount;
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
                string repoDictPropName = string.Empty;
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                    repoDictPropName = prop.PropertyType.Name;
                else if (typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && prop.PropertyType != typeof(string))
                    repoDictPropName = prop.PropertyType.GenericTypeArguments.FirstOrDefault().Name;
                await ((dynamic)RepoDict[repoDictPropName]).CreateAsync((dynamic)value);
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
                string repoDictPropName = string.Empty;
                if (!LibData.IsListPropertyType(prop))
                {
                    repoDictPropName = prop.PropertyType.Name;
                    //TODO:此處暫時這樣寫，之後看如何調整較好
                    PropertyAccessorCache.Set(newModel, nameof(BasicDataModel.CreateUserId), PropertyAccessorCache.Get(oldModel, nameof(BasicDataModel.CreateUserId)));
                    PropertyAccessorCache.Set(newModel, nameof(BasicDataModel.CreateTime), PropertyAccessorCache.Get(oldModel, nameof(BasicDataModel.CreateTime)));
                    await ((dynamic)RepoDict[repoDictPropName]).UpdateAsync((dynamic)oldModel, (dynamic)newModel);
                }
                else if (typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && prop.PropertyType != typeof(string))
                {
                    var modelProp = prop.PropertyType.GenericTypeArguments.FirstOrDefault();
                    repoDictPropName = modelProp.Name;
                    var repo = (dynamic)RepoDict[repoDictPropName];
                    var detailProp = prop.PropertyType.GetGenericArguments().FirstOrDefault();
                    var oldValue = PropertyAccessorCache.Get(oldSet, prop.Name) as IList;
                    var newValue = PropertyAccessorCache.Get(newSet, prop.Name) as IList;
                    var keyProps = PropertyAccessorCache.GetAttrProperties(detailProp, typeof(KeyAttribute));
                    var nonKeyProps = PropertyAccessorCache.GetProperties(detailProp).Where(p => !keyProps.Select(p => p.Name).ToHashSet().Contains(p.Name)).ToList();
                    var oldDict = oldValue.ToDynamicList().ToDictionary(item => string.Join("|", keyProps.Select(k => PropertyAccessorCache.Get(item, k.Name)?.ToString() ?? "null")));
                    var newDict = newValue.ToDynamicList().ToDictionary(item => string.Join("|", keyProps.Select(k => PropertyAccessorCache.Get(item, k.Name)?.ToString() ?? "null")));
                    // 更新（兩邊都有）
                    foreach (var key in oldDict.Keys.Intersect(newDict.Keys))
                    {
                        if (nonKeyProps.Any(p =>
                        {
                            var oldVal = PropertyAccessorCache.Get(oldDict[key], p.Name);
                            var newVal = PropertyAccessorCache.Get(newDict[key], p.Name);
                            return !object.Equals(oldVal, newVal);
                        }))
                            await repo.UpdateAsync(oldDict[key], newDict[key]);
                    }
                    // 刪除（old 有，new 沒有）
                    foreach (var key in oldDict.Keys.Except(newDict.Keys))
                    {
                        await repo.DeleteAsync(oldDict[key]);
                    }
                    //新增新行項
                    var newItems = PropertyAccessorCache.CreateInstance(prop.PropertyType) as IList;
                    newDict.Keys.Except(oldDict.Keys).ToList().ForEach(key => newItems.Add(newDict[key]));
                    if (newItems.Count > 0)
                    {
                        //這邊要獲取RowId的最大int值，但是是為了應急處理，之後要改演算法
                        var keysNew = new HashSet<string>(newDict.Keys, StringComparer.Ordinal);
                        var maxRowId = oldDict.Where(kv => keysNew.Contains(kv.Key)).Select(kv => TryGetRowId(kv.Value) ?? 0).DefaultIfEmpty(0).Max() + 1;
                        await repo.CreateAsync(newItems, maxRowId);
                    }
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
            var props = PropertyAccessorCache.GetProperties(typeof(TSet));
            for (int i = props.Length - 1; i >= 0; i--)
            {
                var prop = props[i];
                dynamic oldModel = PropertyAccessorCache.Get(oldSet, prop.Name);
                string repoDictPropName;
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                {
                    repoDictPropName = prop.PropertyType.Name;
                    await ((dynamic)RepoDict[repoDictPropName]).DeleteAsync(oldModel);
                }
                else
                {
                    repoDictPropName = prop.PropertyType.GenericTypeArguments.FirstOrDefault().Name;
                    foreach (var oldDt in oldModel) await ((dynamic)RepoDict[repoDictPropName]).DeleteAsync(oldDt);
                }
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
            if (condition.IsNullOrEmpty()) return default;
            TSet result = PropertyAccessorCache.CreateInstance(typeof(TSet)) as TSet;
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && typeof(BasicDataModel).IsAssignableFrom(prop.PropertyType))
                {
                    var data = (await DoQueryListAsync(prop, [], condition, default,0, 0)).ToDynamicList().FirstOrDefault();
                    PropertyAccessorCache.Set(result, prop.Name, data);
                }
                else if (typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                {
                    var detailType = prop.PropertyType.GetGenericArguments().First();
                    var data = (await DoQueryListAsync(detailType, [], condition,default, 0, 0));
                    PropertyAccessorCache.Set(result, prop.Name, data);
                }
            }
            return result;
        }
        protected async Task<IList> DoQueryListAsync<TModel>(string[] selectFields, string condition, IReadOnlyList<OrderBySpec>? orderBy, int pageCt, int takeCt)
        {
            return await DoQueryListAsync(typeof(TModel), selectFields, condition, orderBy, pageCt, takeCt);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        protected async Task<IList> DoQueryListAsync(PropertyInfo prop, string[] selectFields, string condition, IReadOnlyList<OrderBySpec>? orderBy, int pageCt, int takeCt)
        {
            return await DoQueryListAsync(prop.PropertyType, selectFields, condition, orderBy, pageCt, takeCt);
        }
        protected async Task<IList> DoQueryListAsync(Type type, string[] selectFields, string condition, IReadOnlyList<OrderBySpec>? orderBy, int pageCt, int takeCt)
        {
            var selectExpr = GetSelectFieldsExpr(type, selectFields);
            var whereExpr = GetConditionExpr(type, condition);
            var repo = (dynamic)GetRepoByType(type);
            var data = await repo.QueryListAsync(selectExpr, whereExpr,orderBy, pageCt, takeCt);
            return data;
        }
        protected async Task<int> DoQueryListCountAsync<TModel>(string[] selectFields, string condition)
        {
            return await DoQueryListCountAsync(typeof(TModel), selectFields, condition);
        }
        /// <summary>
        /// 查詢清單總筆數
        /// </summary>
        /// <param name="type"></param>
        /// <param name="selectFields"></param>
        /// <param name="condition"></param>
        /// <param name="pageCt"></param>
        /// <param name="takeCt"></param>
        /// <returns></returns>
        protected async Task<int> DoQueryListCountAsync(Type type, string[] selectFields, string condition)
        {
            var selectExpr = GetSelectFieldsExpr(type, selectFields);
            var whereExpr = GetConditionExpr(type, condition);
            var repo = (dynamic)GetRepoByType(type);
            var data = await repo.QueryListCountAsync(selectExpr, whereExpr);
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
        protected virtual Task BeforeUpdate(TSet set, FuncAction act) => Task.CompletedTask;
        /// <summary>
        /// 更新之後，尚未提交 (供過帳使用)
        /// </summary>
        /// <param name="oldSet"></param>
        /// <param name="newSet"></param>
        /// <param name="status"></param>
        protected virtual Task AfterUpdate(TSet? oldSet, TSet? newSet, FuncAction act, TransStatus status) => Task.CompletedTask;
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
        private async Task AutoGenerateId(BasicDataModel header, Dictionary<string, IList> details)
        {
            if (header == null) return;
            var keyProp = PropertyAccessorCache.GetProperties(header.GetType()).Where(p => p.IsDefined(typeof(KeyAttribute), inherit: true)).LastOrDefault();
            if (keyProp == null) return;
            object id = PropertyAccessorCache.Get(header, keyProp.Name);
            if (IsAutoGenerateId && keyProp.PropertyType == typeof(string))
            {
                id ??= string.Empty; 

                var idSelector = BuildIdSelectorLambda(header.GetType(), keyProp);
                id = !string.IsNullOrEmpty(id.ToString()) ? id : await ((Task<string>)((dynamic)RepoDict[header.GetType().Name]).GenerateIdAsync(idSelector, PrefixId));
                PropertyAccessorCache.Set(header, keyProp.Name, id);
            }
            foreach (var detail in details)
            {
                var rows = detail.Value;
                if (rows == null) continue;
                foreach (var row in rows) if (row != null) PropertyAccessorCache.Set(row, keyProp.Name, id);
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
            if (header.CreateTime == null) header.CreateTime = now;
            header.ModifyUserId = OperateUser.UserId;
            if (header.ModifyTime == null) header.ModifyTime = now;
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
        private sealed class ParameterReplacer : ExpressionVisitor
        {
            private readonly ParameterExpression _from;
            private readonly Expression _to;
            public ParameterReplacer(ParameterExpression from, Expression to)
            {
                _from = from; _to = to;
            }
            protected override Expression VisitParameter(ParameterExpression node)
                => node == _from ? _to : base.VisitParameter(node);
        }
        private LambdaExpression GetSelectFieldsExpr(Type modelType, string[] selectFields)
        {
            if (selectFields == null || selectFields.Length == 0) return null;

            var param = Expression.Parameter(modelType, "x");
            var newModel = Expression.New(modelType);
            var bindings = new List<MemberBinding>();

            // 依最外層屬性分組：e.g. ["CreateUser.UserName", "CreateUser.Email", "CreateTime"]
            var groups = selectFields
                .Select(f => f.Split('.', StringSplitOptions.RemoveEmptyEntries))
                .GroupBy(parts => parts[0]);

            foreach (var g in groups)
            {
                var propName = g.Key;
                var propInfo = PropertyAccessorCache.GetProperty(modelType, propName);
                if (propInfo == null) continue;

                // 單層屬性：直接綁定 x.Prop
                if (g.All(parts => parts.Length == 1))
                {
                    bindings.Add(Expression.Bind(propInfo, Expression.Property(param, propName)));
                    continue;
                }

                // 多層屬性（巢狀物件或集合）
                var childFields = g.Where(p => p.Length > 1)
                                   .Select(p => string.Join('.', p.Skip(1)))
                                   .ToArray();

                var childType = propInfo.PropertyType;

                // 是否為集合（排除 string）
                bool isEnumerable = typeof(IEnumerable).IsAssignableFrom(childType) && childType != typeof(string);

                // 取得集合元素型別或子物件型別
                Type itemType;
                if (isEnumerable)
                {
                    if (childType.IsArray)
                        itemType = childType.GetElementType()!;
                    else
                        itemType = childType.GenericTypeArguments.FirstOrDefault() ?? typeof(object);
                }
                else
                {
                    itemType = childType;
                }

                // 針對子型別再遞迴產生 λ：TChild -> TChild
                var innerSelector = GetSelectFieldsExpr(itemType, childFields);
                if (innerSelector == null) continue;

                if (isEnumerable)
                {
                    // x.Child.AsQueryable().Select(inner).ToList()
                    var collExpr = Expression.Property(param, propName);

                    var asQueryable = typeof(Queryable).GetMethods()
                        .First(m => m.Name == "AsQueryable" && m.IsGenericMethodDefinition)
                        .MakeGenericMethod(itemType);

                    var select = typeof(Queryable).GetMethods()
                        .First(m => m.Name == "Select" && m.GetParameters().Length == 2)
                        .MakeGenericMethod(itemType, ((LambdaExpression)innerSelector).ReturnType);

                    var toList = typeof(Enumerable).GetMethods()
                        .First(m => m.Name == "ToList" && m.GetParameters().Length == 1)
                        .MakeGenericMethod(((LambdaExpression)innerSelector).ReturnType);

                    var q = Expression.Call(asQueryable, collExpr);
                    var s = Expression.Call(select, q, innerSelector);
                    var tl = Expression.Call(toList, s);

                    bindings.Add(Expression.Bind(propInfo, tl));
                }
                else
                {
                    // 巢狀物件：將 innerSelector 的參數替換成 x.Prop，直接綁定其 Body（MemberInit）
                    var nestedExpr = Expression.Property(param, propName);           // x.Prop
                    var replacer = new ParameterReplacer(innerSelector.Parameters[0], nestedExpr);
                    var replacedBody = replacer.Visit(innerSelector.Body);             // 內聯後的 MemberInit/MemberAccess

                    bindings.Add(Expression.Bind(propInfo, replacedBody));
                }
            }

            var body = Expression.MemberInit(newModel, bindings);
            var delegateType = typeof(Func<,>).MakeGenericType(modelType, modelType);
            return Expression.Lambda(delegateType, body, param);
        }
        /// <summary>
        /// 獲取要搜尋的條件表達式
        /// </summary>
        /// <typeparam name="TModel"></typeparam>
        /// <param name="condition"></param>
        /// <returns></returns>
        private LambdaExpression GetConditionExpr(Type modelType, string condition)
        {
            var param = Expression.Parameter(modelType, "x");
            string normalized = NormalizeCondition(modelType, condition, out object[] args);
            if (string.IsNullOrWhiteSpace(normalized)) return Expression.Lambda(Expression.Constant(true), param);
            var config = new ParsingConfig{ ResolveTypesBySimpleName = true, AllowNewToEvaluateAnyType = true, UseParameterizedNamesInDynamicQuery = true , CustomTypeProvider = new WcmsTypeProvider()};
            var lambda = DynamicExpressionParser.ParseLambda(config, [param], typeof(bool), normalized, args);
            return lambda;
        }
        // 1) 取代原本的 NormalizeCondition
        private string NormalizeCondition(Type modelType, string rawCondition, out object[] args)
        {
            var argList = new List<object>();

            // 與你原本相同的前置清理：補空白、統一運算子
            rawCondition = Regex.Replace(rawCondition, @"(?<=[^!\s<>!=])=(?=[^=])", " == ");
            rawCondition = Regex.Replace(rawCondition, @"(?<=[^\s])(?<op>==|!=|>=|<=|>|<)(?=[^\s])", " ${op} ");

            string normalized = NormalizeRec(modelType, rawCondition, argList);
            args = argList.ToArray();
            return normalized;
        }
        // 2) 遞迴解析：保留括號分組，只在頂層切 and/or
        private string NormalizeRec(Type modelType, string input, List<object> args)
        {
            var (chunks, connectors) = SplitTopLevelByAndOr(input);
            var pieces = new List<string>();

            for (int i = 0; i < chunks.Count; i++)
            {
                string seg = chunks[i].Trim();
                if (string.IsNullOrEmpty(seg)) continue;

                // ( ... ) → 遞迴處理後再包回括號
                if (seg.StartsWith("(") && seg.EndsWith(")") && IsBalanced(seg))
                {
                    string inner = seg.Substring(1, seg.Length - 2);
                    string innerNorm = NormalizeRec(modelType, inner, args);
                    pieces.Add("(" + innerNorm + ")");
                }
                else
                {
                    // 單一子句 → 沿用你原本的子句規則交給 BuildNestedClause
                    var m = Regex.Match(seg,
                        @"^(?<fullPath>[\w.]+)\s*(?<op>=|&|!&|==|!=|>=|<=|>|<|in|not in|like|is null|is not null|hasany|hasallof|hasall)\s*(?<val>.+)?$",
                        RegexOptions.IgnoreCase);

                    if (!m.Success) continue; // 或可視需要丟回錯誤

                    string fullPath = m.Groups["fullPath"].Value;
                    string op = m.Groups["op"].Value;
                    string? val = m.Groups["val"].Success ? m.Groups["val"].Value.Trim('\'', '"') : null;

                    string? clause = BuildNestedClause(modelType, fullPath.Split('.'), op, val, ref args);
                    if (!string.IsNullOrEmpty(clause)) pieces.Add(clause);
                }

                if (i < connectors.Count) pieces.Add(connectors[i]); // "and" / "or"
            }

            return string.Join(" ", pieces);
        }
        // 3) 只在「括號深度為 0」時，辨識 and / or 作為分隔
        private static (List<string> chunks, List<string> connectors) SplitTopLevelByAndOr(string s)
        {
            var chunks = new List<string>();
            var connectors = new List<string>();
            var sb = new System.Text.StringBuilder();
            int depth = 0;

            for (int i = 0; i < s.Length;)
            {
                char ch = s[i];

                if (ch == '(') { depth++; sb.Append(ch); i++; continue; }
                if (ch == ')') { depth = Math.Max(0, depth - 1); sb.Append(ch); i++; continue; }

                if (depth == 0 && TryReadConnector(s, i, out string? conn, out int adv))
                {
                    chunks.Add(sb.ToString());
                    sb.Clear();
                    connectors.Add(conn!); // "and" or "or"
                    i += adv;
                    continue;
                }

                sb.Append(ch);
                i++;
            }

            chunks.Add(sb.ToString());
            return (chunks, connectors);
        }
        // 4) 辨識 and / or（允許左右空白）
        private static bool TryReadConnector(string s, int index, out string? conn, out int advance)
        {
            int i = index;
            while (i < s.Length && char.IsWhiteSpace(s[i])) i++;
            int start = i;

            bool match(string w)
            {
                if (i + w.Length > s.Length) return false;
                if (!s.AsSpan(i, w.Length).Equals(w, StringComparison.OrdinalIgnoreCase)) return false;
                int j = i + w.Length;
                // 右邊需為邊界（空白/括號/結束）
                if (j < s.Length && !char.IsWhiteSpace(s[j]) && s[j] != '(' && s[j] != ')') return false;
                // 左邊也需為邊界（正規化後，基本會成立）
                return true;
            }

            if (match("and"))
            {
                int j = i + 3; while (j < s.Length && char.IsWhiteSpace(s[j])) j++;
                conn = "and"; advance = j - index; return true;
            }

            if (match("or"))
            {
                int j = i + 2; while (j < s.Length && char.IsWhiteSpace(s[j])) j++;
                conn = "or"; advance = j - index; return true;
            }

            conn = null; advance = 0; return false;
        }
        // 5) 檢查括號是否平衡
        private static bool IsBalanced(string s)
        {
            int d = 0;
            foreach (var c in s)
            {
                if (c == '(') d++;
                else if (c == ')') { d--; if (d < 0) return false; }
            }
            return d == 0;
        }
        private string? BuildNestedClause(Type type, string[] pathParts, string op, string? val, ref List<object> args, int index = 0)
        {
            if (index >= pathParts.Length) return null;
            string current = pathParts[index];
            var prop = PropertyAccessorCache.GetProperty(type, current);
            if (prop == null) return null;
            Type nextType = prop.PropertyType;
            bool isEnumerable = typeof(IEnumerable).IsAssignableFrom(nextType) && nextType != typeof(string);
            if (isEnumerable) nextType = nextType.IsGenericType ? nextType.GetGenericArguments()[0] : nextType.GetElementType();
            if (index == pathParts.Length - 1)
            {
                string fieldExpr = current;
                string expr = null;
                switch (op.ToLowerInvariant())
                {
                    case "is null": expr = $"{fieldExpr} == null"; break;
                    case "is not null": expr = $"{fieldExpr} != null"; break;
                    case "in":
                    case "not in":
                        var cleaned = val?.Trim('(', ')') ?? "";

                        var fieldProp = PropertyAccessorCache.GetProperty(type, fieldExpr).PropertyType;
                        var targetType = Nullable.GetUnderlyingType(fieldProp) ?? fieldProp;
                        var valuesArray = cleaned.Split(',').Select(v => v.Trim()).Where(v => !string.IsNullOrEmpty(v)).ToArray();
                        dynamic convertedArray;
                        if (targetType.IsEnum)
                        {
                            var enumArray = Array.ConvertAll(valuesArray, v => System.Enum.ToObject(targetType, int.Parse(v)));
                            var typedEnumArray = Array.CreateInstance(targetType, enumArray.Length);
                            enumArray.CopyTo(typedEnumArray, 0);
                            convertedArray = typedEnumArray;
                        }
                        else convertedArray = valuesArray.Select(v => Convert.ChangeType(v, targetType)).ToArray();
                        int paramIndex = args.Count;
                        args.Add(convertedArray);
                        if (op == "in") expr = $"@{paramIndex}.Contains({fieldExpr})";
                        else expr = $"!@{paramIndex}.Contains({fieldExpr})";
                        break;
                    case "like": expr = $"{fieldExpr}.Contains(\"{val}\")"; break;
                    case "hasany":
                        {
                            // 允許格式：
                            //   Categories hasAny ("a","b","c")
                            //   Categories hasAny (a,b,c)
                            //   Categories hasAny ["a","b"]
                            //   Categories hasAny a,b,c
                            var raw = (val ?? string.Empty).Trim();

                            // 去外層 () 或 []
                            if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                                raw = raw.Substring(1, raw.Length - 2);

                            // 以逗號切分並清理引號/空白
                            var tokens = raw.Split(',').Select(s => s.Trim().Trim('"', '\'')).Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
                            if (tokens.Length == 0) return null;

                            // 放進動態 LINQ 參數清單
                            int pIndex = args.Count;
                            args.Add(tokens);

                            // 透過 DbFunction 切 CSV，再做交集判斷（任一命中即可）
                            // 這會被 EF 轉為：EXISTS (SELECT 1 FROM dbo.SplitToStringTable(field) WHERE Id IN (@p...))
                            expr = $"ApplicationDbContext.SplitToStringTable({fieldExpr}).Any(@{pIndex}.Contains(Id.ToUpper()))";
                            break;
                        }
                    case "hasall":
                        {
                            // 允許格式：
                            //   Categories hasAll ("A1","A2","A3")
                            //   Categories hasAll (A1,A2,A3)
                            //   Categories hasAll ["A1","A2","A3"]
                            //   Categories hasAll A1,A2,A3
                            var raw = (val ?? string.Empty).Trim();

                            // 去外層 () 或 []
                            if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                                raw = raw.Substring(1, raw.Length - 2);

                            // 以逗號切分並清理引號/空白，統一大寫以做到不分大小寫
                            var tokens = raw
                                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(s => s.Trim().Trim('"', '\''))
                                .Where(s => !string.IsNullOrWhiteSpace(s))
                                .Select(s => s.ToUpperInvariant())
                                .ToArray();

                            if (tokens.Length == 0) return null;

                            int pIndex = args.Count;
                            args.Add(tokens);

                            // 以 DbFunction 切 CSV → 計數
                            // 1) 交集數量 == 查詢條件數量
                            // 2) 欄位 CSV 總數量 == 查詢條件數量
                            // 兩者同時滿足 ⇒ 集合相等（順序無關，且不能多/少）
                            var split = $"ApplicationDbContext.SplitToStringTable({fieldExpr})";
                            expr =
                                $"{split}.Count(@{pIndex}.Contains(Id.ToUpper())) == @{pIndex}.Length && " +
                                $"{split}.Count() == @{pIndex}.Length";
                            break;
                        }
                    case "hasallof":
                        {
                            // 允許格式：
                            //   Categories hasAllOf ("A1","A2")
                            //   Categories hasAllOf (A1,A2)
                            //   Categories hasAllOf ["A1","A2"]
                            //   Categories hasAllOf A1,A2
                            var raw = (val ?? string.Empty).Trim();

                            // 去外層 () 或 []
                            if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                                raw = raw.Substring(1, raw.Length - 2);

                            // 以逗號切分並清理引號/空白，統一大寫以做到不分大小寫
                            var tokens = raw
                                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(s => s.Trim().Trim('"', '\''))
                                .Where(s => !string.IsNullOrWhiteSpace(s))
                                .Select(s => s.ToUpperInvariant())
                                .ToArray();

                            if (tokens.Length == 0) return null;

                            int pIndex = args.Count;
                            args.Add(tokens);

                            // DbFunction 切 CSV → 計數
                            // 條件：交集數量 == 查詢條件數量
                            var split = $"ApplicationDbContext.SplitToStringTable({fieldExpr})";
                            expr = $"{split}.Count(@{pIndex}.Contains(Id.ToUpper())) == @{pIndex}.Length";
                            break;
                        }
                    case "&":
                    case "!&":
                        {
                            // 右值（旗標），允許 "4"、"(4)"、"4|8"、"4, 8"
                            var raw = (val ?? string.Empty).Trim();
                            if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                                raw = raw.Substring(1, raw.Length - 2);

                            // 欄位型別（Nullable<int> / enum? 等）
                            var propInfo = PropertyAccessorCache.GetProperty(type, fieldExpr);
                            var propType = propInfo.PropertyType;
                            var isNullable = Nullable.GetUnderlyingType(propType) != null;
                            var nonNullType = Nullable.GetUnderlyingType(propType) ?? propType;

                            // 允許 enum / byte / short / int / long
                            Type underlying;
                            if (nonNullType.IsEnum)
                                underlying = System.Enum.GetUnderlyingType(nonNullType);
                            else
                                underlying = nonNullType;

                            long acc = 0;
                            foreach (var p in raw.Split(new[] { '|', ',', ' ' }, StringSplitOptions.RemoveEmptyEntries))
                                acc |= Convert.ToInt64(p);

                            object flagVal =
                                underlying == typeof(long) ? acc :
                                underlying == typeof(int) ? (int)acc :
                                underlying == typeof(short) ? (short)acc :
                                underlying == typeof(byte) ? (byte)acc :
                                Convert.ChangeType(acc, underlying); // 例如 enum underlying

                            var pIndex = args.Count;
                            args.Add(flagVal);

                            // Nullable 時先 coalesce 成 0，避免 Null 位元運算
                            var left = isNullable ? $"({fieldExpr} ?? 0)" : fieldExpr;

                            // &  => (field & flag) != 0   （包含）
                            // !& => (field & flag) == 0   （不包含）
                            var cmp = (op == "&") ? "!= 0" : "== 0";
                            expr = $"(({left} & @{pIndex}) {cmp})";
                            break;
                        }
                    default: expr = $"{fieldExpr} {op} \"{val}\""; break;
                }
                return expr;
            }
            // 還沒到底，繼續往下巢狀
            string inner = BuildNestedClause(nextType, pathParts, op, val,ref args, index + 1);
            if (string.IsNullOrEmpty(inner)) return null;
            string thisLevel = current;
            return isEnumerable ? $"{thisLevel}.Any({inner})" : $"{thisLevel}.{inner}";
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
                    var condition = $"{nameof(BasicDataModel.InternalId)} = \"{internalId}\"";
                    var fieldNames = pkProps.Select(p => p.Name).ToArray();
                    var headerData = (await DoQueryListAsync(prop, fieldNames, condition,default, 0, 0)).ToDynamicList().FirstOrDefault();
                    if (headerData == null) return resultCondition;
                    foreach (var pk in pkProps) resultCondition = LibData.Merge(" And ", false, resultCondition, $"{pk.Name} = \"{PropertyAccessorCache.Get(headerData, pk.Name)}\"");
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
        /// <summary>
        /// 
        /// </summary>
        /// <param name="modelType"></param>
        /// <returns></returns>
        private object GetRepoByType(Type modelType)
        {
            if (RepoDict.TryGetValue(modelType.Name, out var repo)) return repo;
            return RepoMapProvider.EnsureRepo<TSet>(modelType);
        }
        private static int? TryGetRowId(object? obj)
        {
            if (obj == null) return null;
            var p = obj.GetType().GetProperty("RowId");
            if (p == null) return null;
            var v = p.GetValue(obj);
            if (v is int i) return i;
            return null;
        }
        /// <summary>
        /// 將搜尋的結果扁平化成TSet型
        /// </summary>
        /// <param name="headerProp"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        private static TSet BuildSetFromData(PropertyInfo headerProp, object data)
        {
            // 建 TSet 實例 + 先塞回 header（data1）
            var set = PropertyAccessorCache.CreateInstance<TSet>();
            PropertyAccessorCache.Set(set, headerProp.Name, data);
            // 快取 TSet 的屬性字典（O(1) 查找）
            var setProps = PropertyAccessorCache.GetProperties<TSet>();
            var setPropDict = setProps.ToDictionary(p => p.Name, p => p, StringComparer.Ordinal);
            // 迭代 DFS：避免深層遞迴與 StackOverflow
            var visited = new HashSet<int>();
            var stack = new Stack<object>();
            stack.Push(data);
            while (stack.Count > 0)
            {
                var node = stack.Pop();
                if (node == null) continue;

                // 參考等值去重
                var id = RuntimeHelpers.GetHashCode(node);
                if (!visited.Add(id)) continue;

                var nodeType = node.GetType();
                var nodeProps = PropertyAccessorCache.GetProperties(nodeType);

                foreach (var p in nodeProps)
                {
                    if (IsListPropertyType(p))
                    {
                        var raw = PropertyAccessorCache.Get(node, p.Name) as IEnumerable;
                        if (raw == null) continue;

                        // 把清單中的子項推進 stack（讓下一層的清單也能被處理）
                        foreach (var item in raw)
                        {
                            if (item != null) stack.Push(item);
                        }

                        // 規則 1：用屬性名（去底線）直配 TSet
                        var targetName = p.Name.Trim('_');
                        if (!AssignToSet(targetName, raw))
                        {
                            // 規則 2：用元素型別名或型別名+List
                            var elemType = GetEnumerableElementType(p.PropertyType);
                            if (elemType != null)
                            {
                                if (!AssignToSet(elemType.Name, raw))
                                {
                                    AssignToSet(elemType.Name + "List", raw);
                                }
                            }
                        }
                    }
                    else if (ShouldDescendInto(p))
                    {
                        var child = PropertyAccessorCache.Get(node, p.Name);
                        if (child != null) stack.Push(child);
                    }
                }
            }
            return set;
            // ====== local functions ======
            bool AssignToSet(string name, IEnumerable raw)
            {
                if (!setPropDict.TryGetValue(name, out var dstProp)) return false;

                var targetType = dstProp.PropertyType;
                var elemType = GetEnumerableElementType(targetType) ?? typeof(object);

                // 1) 先拿現在 TSet 上的清單（若沒有就新建一個 List<T>）
                var currentObj = PropertyAccessorCache.Get(set!, dstProp.Name);
                IList targetList;

                if (currentObj is IList existingList
                    && existingList.GetType().IsGenericType
                    && existingList.GetType().GetGenericArguments()[0].IsAssignableFrom(elemType))
                {
                    // 已有同型別/相容清單 → 直接累加
                    targetList = existingList;
                }
                else
                {
                    // 沒有或型別不相容 → 建新的 List<TElem>
                    var listType = typeof(List<>).MakeGenericType(elemType);
                    targetList = (IList)Activator.CreateInstance(listType)!;
                }

                // 2) 累加來源（必要時做元素型別轉換）
                foreach (var item in raw)
                {
                    targetList.Add(ChangeIfNeeded(item, elemType));
                }

                // 3) 若是新建的清單或原本為 null，指回 TSet
                if (!ReferenceEquals(targetList, currentObj))
                {
                    PropertyAccessorCache.Set(set!, dstProp.Name, targetList);
                }

                return true;
            }
            static object? ChangeIfNeeded(object? item, Type targetElem)
            {
                if (item == null) return null;
                var t = item.GetType();
                if (targetElem.IsAssignableFrom(t)) return item;

                try { return Convert.ChangeType(item, targetElem); }
                catch { return item; }
            }
            static bool IsListPropertyType(PropertyInfo p)
            {
                if (p.PropertyType == typeof(string)) return false;
                return typeof(IEnumerable).IsAssignableFrom(p.PropertyType);
            }
            static bool ShouldDescendInto(PropertyInfo p)
            {
                var t = p.PropertyType;
                if (t == typeof(string)) return false;
                if (typeof(IEnumerable).IsAssignableFrom(t)) return false; // 清單在上面處理
                return !t.IsValueType && !t.IsPrimitive;
            }
            static Type? GetEnumerableElementType(Type t)
            {
                if (t.IsGenericType)
                {
                    var g = t.GetGenericTypeDefinition();
                    if (g == typeof(IEnumerable<>) || g == typeof(IList<>) ||
                        g == typeof(ICollection<>) || g == typeof(IReadOnlyList<>) ||
                        g == typeof(List<>))
                    {
                        return t.GetGenericArguments()[0];
                    }
                }
                var i = t.GetInterfaces().FirstOrDefault(x => x.IsGenericType && x.GetGenericTypeDefinition() == typeof(IEnumerable<>));
                return i?.GetGenericArguments()[0];
            }
            static object? ConvertEnumerableToTarget(IEnumerable src, Type targetType)
            {
                var elemType = GetEnumerableElementType(targetType) ?? typeof(object);
                var listType = typeof(List<>).MakeGenericType(elemType);
                var list = (IList)Activator.CreateInstance(listType)!;
                foreach (var item in src) list.Add(item);
                if (targetType.IsAssignableFrom(listType)) return list;
                var ctor = targetType.GetConstructor([listType]);
                if (ctor != null) return ctor.Invoke([list]);
                return null;
            }
        }
        #endregion
    }
}
