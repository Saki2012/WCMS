using System.Collections;
using System.ComponentModel.DataAnnotations;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
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

        private string? _ProgId = null;

        /// <summary>
        /// 功能Id
        /// </summary>
        public string ProgId { get {
                if (_ProgId == null) _ProgId = GetType().GetCustomAttribute<ProgIdAttribute>(inherit: true)?.Value;
                return _ProgId;
            } }
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
                //await BeginTransactionAsync();
                GetModelType(set, out BasicDataModel header, out Dictionary<string, IList> details);
                SetCreateInfo(header);
                await AutoGenerateId(header, details);
                BeforeUpdate(set, FuncAction.Create);
                Response.ThrowIfFailed();
                await DoCreateAsync(set);
                AfterUpdate(default, set, FuncAction.Create, TransStatus.Increase);
                Response.ThrowIfFailed();
                //await CommitDataAsync();
                await DataAccess.SaveChangesAsync();      //先寫看看
                AfterSaveChanges(FuncAction.Create);
                Response.AddMessage(MessageStatus.Green, SysMessageCode.BECode00002);
                Response.Data.Add(set);
                return Response;
            }
            catch
            {
                //await RollbackTransactionAsync();
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
            IList<TSet> result = [];
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && typeof(BasicDataModel).IsAssignableFrom(prop.PropertyType))
                {
                    var datas = (await DoQueryListAsync(prop, selectFields, condition, pageNumber, pageSize)).ToDynamicList();
                    foreach(var data in datas) 
                    { 
                        TSet srcData = PropertyAccessorCache.CreateInstance(typeof(TSet)) as TSet;
                        PropertyAccessorCache.Set(srcData, prop.Name, data);
                        result.Add(srcData);
                    }
                }
            }
            Response.ThrowIfFailed();
            Response.AddMessage(MessageStatus.Green, SysMessageCode.BECode00010);
            Response.Data = result;
            return Response;
        }
        public async Task<IApiResponse<int>> QueryListTotalPages(string[] selectFields, string condition, int pageSize)
        {
            ApiResponse<int> res = new();
            int totalCount = 1;
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && typeof(BasicDataModel).IsAssignableFrom(prop.PropertyType))
                {
                    var count = await DoQueryListCountAsync(prop.PropertyType, selectFields, condition);
                    totalCount = count;
                }
            }
            int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            res.ThrowIfFailed();
            res.AddMessage(MessageStatus.Green, SysMessageCode.BECode00010);
            res.Data = [totalPages];
            return res;
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
                else if (typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && prop.PropertyType != typeof(string))
                {
                    var repo = (dynamic)RepoDict[prop.Name];
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
                        if(nonKeyProps.Any(p =>{
                            var oldVal = PropertyAccessorCache.Get(oldDict[key], p.Name);
                            var newVal = PropertyAccessorCache.Get(newDict[key], p.Name);
                            return !object.Equals(oldVal, newVal);}))
                            await repo.UpdateAsync(oldDict[key], newDict[key]);
                    }

                    // 刪除（old 有，new 沒有）
                    foreach (var key in oldDict.Keys.Except(newDict.Keys))
                    {
                        await repo.DeleteAsync(oldDict[key]);
                    }

                    //這邊要獲取最大int值，但是是為了應急處理，之後要改演算法
                    var allItems = oldDict.Values.Concat(newDict.Values);
                    int maxRowId = allItems.Select(item => PropertyAccessorCache.Get(item, "RowId")).OfType<int>().DefaultIfEmpty(1).Max()+1;
                    foreach (var key in newDict.Keys.Except(oldDict.Keys))
                    {
                        await repo.CreateAsync(newDict[key],maxRowId);
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
            for(int i=props.Length-1; i>=0; i--)
            {
                var prop = props[i];
                dynamic oldModel = PropertyAccessorCache.Get(oldSet, prop.Name);
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType))
                    await ((dynamic)RepoDict[prop.Name]).DeleteAsync(oldModel);
                else
                    foreach(var oldDt in oldModel)
                        await ((dynamic)RepoDict[prop.Name]).DeleteAsync(oldDt);

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
            var data = await ((dynamic)RepoDict[type.Name]).QueryListCountAsync(selectExpr, whereExpr);
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
        private async Task AutoGenerateId(BasicDataModel header,Dictionary<string, IList> details)
        {
            var keyProp = PropertyAccessorCache.GetProperties(header.GetType()).Where(p => p.IsDefined(typeof(KeyAttribute), inherit: true)).LastOrDefault();
            if (keyProp == null) return;
            var idSelector = BuildIdSelectorLambda(header.GetType(),keyProp);
            string id = PropertyAccessorCache.Get(header, keyProp.Name).ToString();
            id = !string.IsNullOrEmpty(id) ? id : await ((Task<string>)((dynamic)RepoDict[header.GetType().Name]).GenerateIdAsync(idSelector, PrefixId));
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
            if (selectFields == null || selectFields.Length == 0) return null;
            var param = Expression.Parameter(modelType, "x");
            var groupMap = selectFields.Select(field => field.Split('.')).GroupBy(parts => parts[0]);
            var bindings = new List<MemberBinding>();
            foreach (var group in groupMap)
            {
                var propName = group.Key;
                var propInfo = PropertyAccessorCache.GetProperty(modelType, propName);
                if (propInfo == null) continue;
                // 單層屬性
                if (group.All(parts => parts.Length == 1)) bindings.Add(Expression.Bind(propInfo, Expression.Property(param, propName)));
                // 多層屬性 (巢狀物件或集合)
                else
                {
                    var childFields = group.Where(p => p.Length > 1).Select(p => string.Join('.', p.Skip(1))).ToArray();
                    var childType = propInfo.PropertyType;
                    var isEnumerable = typeof(IEnumerable).IsAssignableFrom(childType) && childType != typeof(string);
                    var itemType = isEnumerable ? childType.GenericTypeArguments.FirstOrDefault() ?? childType.GetElementType() : childType;
                    var innerSelector = GetSelectFieldsExpr(itemType, childFields);
                    if (innerSelector == null) continue;
                    if (isEnumerable)
                    {
                        // x.ChildCollection.Select(...)
                        var selectMethod = typeof(Queryable).GetMethods().First(m => m.Name == "Select" && m.GetParameters().Length == 2 && m.GetParameters()[1].ParameterType.GetGenericTypeDefinition() == typeof(Expression<>)).MakeGenericMethod(itemType, ((LambdaExpression)innerSelector).ReturnType);
                        var toListMethod = typeof(Enumerable).GetMethods().First(m => m.Name == "ToList" && m.GetParameters().Length == 1).MakeGenericMethod(((LambdaExpression)innerSelector).ReturnType);
                        var collectionExpr = Expression.Property(param, propName);
                        var asQueryableMethod = typeof(Queryable).GetMethods().First(m => m.Name == "AsQueryable" && m.IsGenericMethodDefinition).MakeGenericMethod(itemType);
                        var queryableExpr = Expression.Call(asQueryableMethod, collectionExpr);
                        var selectCall = Expression.Call(selectMethod, queryableExpr, innerSelector);
                        var toListCall = Expression.Call(toListMethod, selectCall);
                        bindings.Add(Expression.Bind(propInfo, toListCall));
                    }
                    else
                    {
                        var nestedExpr = Expression.Property(param, propName);
                        var innerInit = Expression.Invoke(innerSelector, nestedExpr);
                        bindings.Add(Expression.Bind(propInfo, innerInit));
                    }
                }
            }

            var body = Expression.MemberInit(Expression.New(modelType), bindings);
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
            string normalized = NormalizeCondition(modelType, condition);
            if (string.IsNullOrWhiteSpace(normalized)) return Expression.Lambda(Expression.Constant(true), param);
            var config = new ParsingConfig{ ResolveTypesBySimpleName = true, AllowNewToEvaluateAnyType = true, UseParameterizedNamesInDynamicQuery = true };
            var lambda = DynamicExpressionParser.ParseLambda(config, [param], typeof(bool), normalized);
            return lambda;
        }

        private string NormalizeCondition(Type modelType, string rawCondition)
        {
            // 預處理：補齊空白讓正則能順利解析運算子
            rawCondition = Regex.Replace(rawCondition, @"(?<=[^\s<>!=])=(?=[^=])", " == ");
            rawCondition = Regex.Replace(rawCondition, @"(?<=[^\s])(?<op>==|!=|>=|<=|>|<)(?=[^\s])", " ${op} ");


            var tokens = Regex.Split(rawCondition, @"\s+(and|or)\s+", RegexOptions.IgnoreCase);
            var result = new List<string>();
            for (int i = 0; i < tokens.Length; i += 2)
            {
                string clause = tokens[i].Trim();
                string? connector = (i > 0 && i - 1 < tokens.Length) ? tokens[i - 1].Trim().ToLower() : null;
                var match = Regex.Match(clause, @"^(?<fullPath>[\w.]+)\s*(?<op>=|==|!=|>=|<=|>|<|in|not in|like|is null|is not null)\s*(?<val>.+)?$", RegexOptions.IgnoreCase);
                if (!match.Success) continue;
                string fullPath = match.Groups["fullPath"].Value;
                string op = match.Groups["op"].Value.ToLower();
                string? val = match.Groups["val"].Success ? match.Groups["val"].Value.Trim().Trim('\'', '"') : null;

                var parts = fullPath.Split('.');
                if (parts.Length == 0) continue;

                string? clauseStr = BuildNestedClause(modelType, parts, op, val);
                if (string.IsNullOrEmpty(clauseStr)) continue;

                if (!string.IsNullOrEmpty(connector) && result.Count > 0)
                    result.Add(connector);

                result.Add(clauseStr);
            }

            return string.Join(" ", result);
        }

        private string? BuildNestedClause(Type type, string[] pathParts, string op, string? val, int index = 0)
        {
            if (index >= pathParts.Length) return null;

            string current = pathParts[index];
            var prop = PropertyAccessorCache.GetProperty(type, current);
            if (prop == null) return null;

            Type nextType = prop.PropertyType;
            bool isEnumerable = typeof(IEnumerable).IsAssignableFrom(nextType) && nextType != typeof(string);

            if (isEnumerable)
                nextType = nextType.IsGenericType ? nextType.GetGenericArguments()[0] : nextType.GetElementType();

            if (index == pathParts.Length - 1)
            {
                // 最後一層：實際條件欄位
                string fieldExpr = current;
                string expr = op switch
                {
                    "is null" => $"{fieldExpr} == null",
                    "is not null" => $"{fieldExpr} != null",
                    "in" => $"@0.Contains({fieldExpr})",
                    "not in" => $"!@0.Contains({fieldExpr})",
                    "like" => $"{fieldExpr}.Contains(\"{val}\")",
                    _ => $"{fieldExpr} {op} \"{val}\""
                };
                return expr;
            }

            // 還沒到底，繼續往下巢狀
            string inner = BuildNestedClause(nextType, pathParts, op, val, index + 1);
            if (string.IsNullOrEmpty(inner)) return null;

            string thisLevel = current;
            return isEnumerable
                ? $"{thisLevel}.Any({inner})"
                : $"{thisLevel}.{inner}";
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
