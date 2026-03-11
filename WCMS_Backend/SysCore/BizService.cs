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
            bool ownsTx = false;
            try
            {
                ownsTx = await TryBeginTransactionAsync();
                GetModelType(set, out BasicDataModel header, out Dictionary<string, IList> details);
                SetCreateInfo(header);
                await AutoGenerateId(header, details);
                await BeforeUpdate(set, FuncAction.Create);
                if(Message.HasError) return set;
                await DoCreateAsync(set);
                await AfterUpdate(default, set, FuncAction.Create, TransStatus.Increase);
                if (Message.HasError) return set;
                await DataAccess.SaveChangesAsync();
                await TryCommitAsync(ownsTx);
                AfterSaveChanges(FuncAction.Create);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00002);
                return set;
            }
            catch
            {
                await TryRollbackAsync(ownsTx);
                throw;
            }
        }
        public async Task<TSet> BizUpdateSetAsync(string internalId, TSet newSet)
        {
            bool ownsTx = false;
            try
            {
                ownsTx = await TryBeginTransactionAsync();
                GetModelType(newSet, out BasicDataModel header, out Dictionary<string, IList> details);
                SetModifyInfo(header);
                await AutoGenerateId(header, details);
                await BeforeUpdate(newSet, FuncAction.Update);
                if (Message.HasError) return newSet;
                TSet oldSet = await DoQuerySetAsync(internalId);
                TSet oldSet_Cache = oldSet.Snapshot();
                await DoUpdateAsync(oldSet, newSet);
                await AfterUpdate(oldSet_Cache, oldSet, FuncAction.Update, TransStatus.Difference);//oldSet已經進入DataAccess，修改完會跟著修正至DB
                if (Message.HasError) return newSet;
                await TryCommitAsync(ownsTx);
                AfterSaveChanges(FuncAction.Update);
                Message.AddMessage(MessageStatus.Green,SysMessageCode.BECode00006);
                return oldSet;
            }
            catch
            {
                await TryRollbackAsync(ownsTx);
                throw;
            }
        }
        public async Task<TSet> BizDeleteSetAsync(string internalId)
        {
            bool ownsTx = false;
            try
            {
                ownsTx = await TryBeginTransactionAsync();
                CheckIsUsed();
                TSet oldSet = await DoQuerySetAsync(internalId);
                TSet oldSet_Cache = oldSet.Snapshot();
                await BeforeUpdate(oldSet, FuncAction.Delete);
                if (Message.HasError) return oldSet;
                await DoDeleteAsync(oldSet);
                await AfterUpdate(oldSet_Cache, oldSet, FuncAction.Delete, TransStatus.Difference);
                if (Message.HasError) return oldSet;
                await TryCommitAsync(ownsTx);
                AfterSaveChanges(FuncAction.Update);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00004);
                return oldSet;
            }
            catch
            {
                await TryRollbackAsync(ownsTx);
                throw;
            }
        }
        public async Task<TSet> BizInvalidSetAsync(string internalId, bool status)
        {
            bool ownsTx = false;
            try
            {
                ownsTx = await TryBeginTransactionAsync();
                TSet oldSet = await DoQuerySetAsync(internalId);
                TSet oldSet_Cache = oldSet.Snapshot();
                TSet newSet = oldSet.Snapshot();
                DoInvalidSet(newSet, status);
                await BeforeUpdate(oldSet, FuncAction.Invalid);
                if (Message.HasError) return newSet;
                await DoUpdateAsync(oldSet, newSet);
                await AfterUpdate(oldSet_Cache, oldSet, FuncAction.Invalid, TransStatus.Difference);//oldSet已經進入DataAccess，修改完會跟著修正至DB
                if (Message.HasError) return newSet;
                await TryCommitAsync(ownsTx);
                AfterSaveChanges(FuncAction.Update);
                Message.AddMessage(MessageStatus.Green, SysMessageCode.BECode00008);
                return oldSet;
            }
            catch
            {
                await TryRollbackAsync(ownsTx);
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
            return await BizQueryListAsync(param.Fields,param.Condition, param.OrderBy, param.RankGroups, param.PageNumber, param.PageSize);
        }
        public async Task<IList<TSet>> BizQueryListAsync(string[] selectFields, string condition, IReadOnlyList<OrderBySpec> OrderBy=null,IReadOnlyList<RankGroupsSpec> rankGroups=null, int pageNumber=0, int pageSize = 0)
        {
            // 宣告變數
            IList<TSet> result = [];
            var props = PropertyAccessorCache.GetProperties<TSet>();
            var headerProp = props.FirstOrDefault(p => !p.PropertyType.IsGenericType);

            // ✅ 無 RankGroups：沿用原本流程
            if (rankGroups == null || rankGroups.Count == 0)
            {
                var datas = (await DoQueryListAsync(headerProp, selectFields, condition, OrderBy, pageNumber, pageSize)).ToDynamicList();
                foreach (var data in datas)
                {
                    var srcData = BuildSetFromData(headerProp, data);
                    result.Add(srcData);
                }
                return result;
            }

            // ✅ 有 RankGroups：分段取資料（Group0、Group1...、Rest）
            var plan = BuildRankGroupPlan(condition, rankGroups);
            var segments = BuildRankSegments(plan, rankGroups, OrderBy);

            // 不分頁：依 segments 全部拉回
            if (pageNumber <= 0 || pageSize <= 0)
            {
                foreach (var seg in segments)
                {
                    var datas = (await DoQueryListAsync(headerProp, selectFields, seg.Where, seg.OrderBy, 0, 0)).ToDynamicList();
                    foreach (var data in datas)
                    {
                        var srcData = BuildSetFromData(headerProp, data);
                        result.Add(srcData);
                    }
                }
                return result;
            }

            // 分頁：跨 segments 精準切頁
            var globalSkip = (pageNumber - 1) * pageSize;
            var remaining = pageSize;

            foreach (var seg in segments)
            {
                if (remaining <= 0) break;

                var segCount = await DoQueryListCountAsync(headerProp.PropertyType, seg.Where);
                if (segCount <= 0) continue;

                if (globalSkip >= segCount)
                {
                    globalSkip -= segCount;
                    continue;
                }

                var take = Math.Min(remaining, segCount - globalSkip);
                var datas = (await DoQueryListAsync(headerProp, selectFields, seg.Where, seg.OrderBy, 0, take, globalSkip)).ToDynamicList();

                foreach (var data in datas)
                {
                    var srcData = BuildSetFromData(headerProp, data);
                    result.Add(srcData);
                }

                remaining -= take;
                globalSkip = 0;
            }

            return result;
        }
        public async Task<int> BizQueryTotalCounts(string condition)
        {
            int totalCount = 0;
            foreach (var prop in PropertyAccessorCache.GetProperties(typeof(TSet)))
            {
                if (!typeof(IEnumerable).IsAssignableFrom(prop.PropertyType) && typeof(BasicDataModel).IsAssignableFrom(prop.PropertyType))
                {
                    var count = await DoQueryListCountAsync(prop.PropertyType, condition);
                    totalCount = count;
                }
            }
            return totalCount;
        }
        /// <summary>
        /// 啟用交易控制(非同步)
        /// </summary>
        /// <returns></returns>
        public async Task<bool> TryBeginTransactionAsync()
        {
            // 已在交易中 → 交給外層負責 commit/rollback
            if (DataAccess.Database.CurrentTransaction != null) return false;

            await DataAccess.Database.BeginTransactionAsync();
            return true;
        }
        /// <summary>
        /// 回滾交易控制(非同步)
        /// </summary>
        /// <returns></returns>
        public async Task TryRollbackAsync(bool ownsTx)
        {
            if (!ownsTx) return;
            await DataAccess.Database.RollbackTransactionAsync();
        }
        /// <summary>
        /// 執行更新(非同步)
        /// </summary>
        /// <param name="action"></param>
        public async Task TryCommitAsync(bool ownsTx)
        {
            await DataAccess.SaveChangesAsync(); // 永遠需要寫入

            if (!ownsTx) return;                // 外層交易中 → 不 commit
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
        protected async Task<IList> DoQueryListAsync<TModel>(string[] selectFields, string condition, IReadOnlyList<OrderBySpec>? orderBy, int pageCt, int takeCt, int skipCt = 0)
        {
            return await DoQueryListAsync(typeof(TModel), selectFields, condition, orderBy, pageCt, takeCt, skipCt);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        protected async Task<IList> DoQueryListAsync(PropertyInfo prop, string[] selectFields, string condition, IReadOnlyList<OrderBySpec>? orderBy, int pageCt, int takeCt, int skipCt = 0)
        {
            return await DoQueryListAsync(prop.PropertyType, selectFields, condition, orderBy, pageCt, takeCt, skipCt);
        }
        protected async Task<IList> DoQueryListAsync(Type type, string[] selectFields, string condition, IReadOnlyList<OrderBySpec>? orderBy, int pageCt, int takeCt, int skipCt = 0)
        {
            // ✅ 1) 先建立 whereExpr（已支援括號/and/or）
            var whereExpr = GetConditionExpr(type, condition);
            // ✅ 2) Step 3：從 whereExpr 抽出「各集合導航」的 predicate（支援 xxx and (xxx or xxx)）
            var detailPredMap = ExtractDetailPredicateMap(type, whereExpr);
            // ✅ 3) projection：集合明細套用 Where(predicate)
            var selectExpr = GetSelectFieldsExpr(type, selectFields, detailPredMap);
            var repo = (dynamic)GetRepoByType(type);
            var data = await repo.QueryListAsync(selectExpr, whereExpr, orderBy, pageCt, takeCt, skipCt);
            return data;
        }
        protected async Task<int> DoQueryListCountAsync<TModel>(string condition)
        {
            return await DoQueryListCountAsync(typeof(TModel), condition);
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
        protected async Task<int> DoQueryListCountAsync(Type type, string condition)
        {
            var whereExpr = GetConditionExpr(type, condition);
            var repo = (dynamic)GetRepoByType(type);
            var data = await repo.QueryListCountAsync(whereExpr);
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
        private LambdaExpression GetSelectFieldsExpr(Type modelType, string[] selectFields, Dictionary<string, LambdaExpression>? detailPredMap = null)
        {
            if (selectFields == null || selectFields.Length == 0) return null;
            var param = Expression.Parameter(modelType, "x");
            var newModel = Expression.New(modelType);
            var bindings = new List<MemberBinding>();
            // 依最外層屬性分組：e.g. ["CreateUser.UserName", "CreateUser.Email", "CreateTime"]
            var groups = selectFields.Select(f => f.Split('.', StringSplitOptions.RemoveEmptyEntries)).GroupBy(parts => parts[0]);
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
                var childFields = g.Where(p => p.Length > 1).Select(p => string.Join('.', p.Skip(1))).ToArray();
                var childType = propInfo.PropertyType;
                // 是否為集合（排除 string）
                bool isEnumerable = typeof(IEnumerable).IsAssignableFrom(childType) && childType != typeof(string);
                // 取得集合元素型別或子物件型別
                Type itemType;
                if (isEnumerable)
                {
                    if (childType.IsArray) itemType = childType.GetElementType()!;
                    else itemType = childType.GenericTypeArguments.FirstOrDefault() ?? typeof(object);
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
                    var collExpr = Expression.Property(param, propName);
                    var asQueryable = typeof(Queryable).GetMethods().First(m => m.Name == "AsQueryable" && m.IsGenericMethodDefinition).MakeGenericMethod(itemType);
                    var select = typeof(Queryable).GetMethods().First(m => m.Name == "Select" && m.GetParameters().Length == 2).MakeGenericMethod(itemType, ((LambdaExpression)innerSelector).ReturnType);
                    var toList = typeof(Enumerable).GetMethods().First(m => m.Name == "ToList" && m.GetParameters().Length == 1).MakeGenericMethod(((LambdaExpression)innerSelector).ReturnType);
                    var q = Expression.Call(asQueryable, collExpr);
                    if (detailPredMap != null && detailPredMap.TryGetValue(propName, out var predLambda) && predLambda != null)
                    {
                        var where = typeof(Queryable).GetMethods().First(m => m.Name == "Where" && m.GetParameters().Length == 2).MakeGenericMethod(itemType);
                        q = Expression.Call(where, q, predLambda); // predLambda: Expression<Func<itemType,bool>>
                    }
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
        /// Step 3：從 whereExpr 抽出「集合導航」的 predicate：
        /// 來源是 whereExpr 裡的：Nav.Any(d => ...)
        /// 並且保留 and/or/括號（Expression Tree）
        /// </summary>
        private static Dictionary<string, LambdaExpression> ExtractDetailPredicateMap(Type rootType, LambdaExpression whereExpr)
        {
            var map = new Dictionary<string, LambdaExpression>(StringComparer.Ordinal);
            if (whereExpr == null || whereExpr.Parameters.Count == 0) return map;

            var rootParam = whereExpr.Parameters[0];

            // 遞迴抽取：回傳每個 nav 的「predicate expression」(帶同一個 detail param)
            var infoMap = ExtractFromNode(whereExpr.Body, rootParam);

            foreach (var kv in infoMap)
            {
                var navName = kv.Key;
                var info = kv.Value;

                if (info.IsUnsafe || info.Param == null || info.Body == null) continue;

                // 組成 Expression<Func<TDetail,bool>>
                var lambdaType = typeof(Func<,>).MakeGenericType(info.Param.Type, typeof(bool));
                map[navName] = Expression.Lambda(lambdaType, info.Body, info.Param);
            }

            return map;
        }

        private sealed record DetailPredInfo(ParameterExpression? Param, Expression? Body, bool IsUnsafe);

        private static Dictionary<string, DetailPredInfo> ExtractFromNode(Expression node, ParameterExpression rootParam)
        {
            node = StripQuotesAndConverts(node);

            // ✅ match: root.Nav.Any(d => predicate)
            if (TryMatchAnyOnRootNav(node, rootParam, out var navName, out var detailParam, out var detailBody))
            {
                return new Dictionary<string, DetailPredInfo>(StringComparer.Ordinal)
                {
                    [navName] = new DetailPredInfo(detailParam, detailBody, IsUnsafe: false)
                };
            }

            // ✅ (A && B) / (A || B)
            if (node is BinaryExpression be &&
                (be.NodeType == ExpressionType.AndAlso || be.NodeType == ExpressionType.OrElse))
            {
                var left = ExtractFromNode(be.Left, rootParam);
                var right = ExtractFromNode(be.Right, rootParam);
                return MergeByBoolean(left, right, be.NodeType);
            }

            // ✅ !(...)
            if (node is UnaryExpression ue && ue.NodeType == ExpressionType.Not)
            {
                var inner = ExtractFromNode(ue.Operand, rootParam);
                foreach (var k in inner.Keys.ToList())
                {
                    var info = inner[k];
                    if (info.IsUnsafe || info.Body == null)
                    {
                        inner[k] = info with { IsUnsafe = true };
                        continue;
                    }
                    inner[k] = info with { Body = Expression.Not(info.Body) };
                }
                return inner;
            }

            // 其他：不屬於明細 Any(...) 條件
            return new Dictionary<string, DetailPredInfo>(StringComparer.Ordinal);
        }

        private static Dictionary<string, DetailPredInfo> MergeByBoolean(Dictionary<string, DetailPredInfo> left,Dictionary<string, DetailPredInfo> right,ExpressionType op)
        {
            var result = new Dictionary<string, DetailPredInfo>(StringComparer.Ordinal);
            var keys = left.Keys.Union(right.Keys).ToList();

            foreach (var k in keys)
            {
                left.TryGetValue(k, out var l);
                right.TryGetValue(k, out var r);

                // 只在其中一邊出現：
                if (l == null && r != null)
                {
                    // AND：缺邊視為 true → 保留 r
                    // OR ：缺邊等同「主表條件 OR 明細條件」→ 不安全，避免錯殺
                    result[k] = op == ExpressionType.AndAlso ? r : r with { IsUnsafe = true };
                    continue;
                }
                if (r == null && l != null)
                {
                    result[k] = op == ExpressionType.AndAlso ? l : l with { IsUnsafe = true };
                    continue;
                }
                if (l == null || r == null) continue;

                // 任一不安全就不安全
                if (l.IsUnsafe || r.IsUnsafe)
                {
                    result[k] = new DetailPredInfo(l.Param ?? r.Param, l.Body ?? r.Body, IsUnsafe: true);
                    continue;
                }

                if (l.Param == null || r.Param == null || l.Body == null || r.Body == null)
                {
                    result[k] = new DetailPredInfo(l.Param ?? r.Param, l.Body ?? r.Body, IsUnsafe: true);
                    continue;
                }

                // 統一 parameter：右邊換成左邊的 param
                var unifiedParam = l.Param;
                var rightBody = ReplaceParam(r.Body, r.Param, unifiedParam);

                var mergedBody = op == ExpressionType.AndAlso
                    ? Expression.AndAlso(l.Body, rightBody)
                    : Expression.OrElse(l.Body, rightBody);

                result[k] = new DetailPredInfo(unifiedParam, mergedBody, IsUnsafe: false);
            }

            return result;
        }

        private static Expression ReplaceParam(Expression body, ParameterExpression from, ParameterExpression to)
            => new ParamSwapVisitor(from, to).Visit(body)!;

        private sealed class ParamSwapVisitor : ExpressionVisitor
        {
            private readonly ParameterExpression _from;
            private readonly ParameterExpression _to;
            public ParamSwapVisitor(ParameterExpression from, ParameterExpression to) { _from = from; _to = to; }
            protected override Expression VisitParameter(ParameterExpression node) => node == _from ? _to : base.VisitParameter(node);
        }

        private static Expression StripQuotesAndConverts(Expression e)
        {
            while (true)
            {
                if (e is UnaryExpression ue &&
                    (ue.NodeType == ExpressionType.Quote || ue.NodeType == ExpressionType.Convert))
                {
                    e = ue.Operand;
                    continue;
                }
                return e;
            }
        }

        /// <summary>
        /// 匹配：x.Nav.Any(d => ...)
        /// 支援 Enumerable.Any / Queryable.Any
        /// </summary>
        private static bool TryMatchAnyOnRootNav(Expression node,ParameterExpression rootParam,out string navName,out ParameterExpression detailParam,out Expression detailBody)
        {
            navName = "";
            detailParam = null!;
            detailBody = null!;

            if (node is not MethodCallExpression mc) return false;
            if (!string.Equals(mc.Method.Name, "Any", StringComparison.Ordinal)) return false;
            if (mc.Arguments.Count != 2) return false;

            // arg0: source（允許 Queryable.AsQueryable(x.Nav) 或直接 x.Nav）
            var source = StripQuotesAndConverts(mc.Arguments[0]);

            if (source is MethodCallExpression aq &&
                aq.Method.Name == "AsQueryable" &&
                aq.Arguments.Count == 1)
            {
                source = StripQuotesAndConverts(aq.Arguments[0]);
            }

            if (source is not MemberExpression navExpr) return false;
            if (navExpr.Expression is not ParameterExpression pe || pe != rootParam) return false;

            var pred = StripQuotesAndConverts(mc.Arguments[1]) as LambdaExpression;
            if (pred == null || pred.Parameters.Count != 1) return false;

            navName = navExpr.Member.Name;
            detailParam = pred.Parameters[0];
            detailBody = pred.Body;
            return true;
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

            int i = 0;
            while (i < chunks.Count)
            {
                string seg = chunks[i].Trim();
                if (string.IsNullOrEmpty(seg))
                {
                    i++;
                    continue;
                }

                var s0 = seg.TrimStart();
                var isNot =
                    s0.StartsWith("not ", StringComparison.OrdinalIgnoreCase) ||
                    s0.StartsWith("not(", StringComparison.OrdinalIgnoreCase) ||
                    s0.StartsWith("!", StringComparison.Ordinal);

                if (isNot)
                {
                    // 取出 not/! 後面的 operand
                    var operand = s0.StartsWith("!", StringComparison.Ordinal)
                        ? s0.Substring(1).Trim()
                        : s0.Substring(3).Trim(); // "not"

                    // 若是 not(...) 形式，去掉外層括號
                    if (operand.StartsWith("(") && operand.EndsWith(")") && IsBalanced(operand))
                        operand = operand.Substring(1, operand.Length - 2);

                    // 先把 operand 正規化成 bool expr
                    string innerNorm;

                    if (TryParseSimpleClause(operand, out var p, out var opx, out var vx))
                    {
                        innerNorm = BuildNestedClause(modelType, p, opx, vx, ref args) ?? "true";
                    }
                    else
                    {
                        // 若 operand 本身還含 and/or/括號，就遞迴處理
                        innerNorm = NormalizeRec(modelType, operand, args);
                    }

                    pieces.Add($"!({innerNorm})");

                    // 正常補 connector（未合併的情況）
                    if (i < connectors.Count) pieces.Add(connectors[i]);
                    i++;
                    continue;
                }

                // ( ... ) → 遞迴處理後再包回括號（括號群組不做合併）
                if (seg.StartsWith("(") && seg.EndsWith(")") && IsBalanced(seg))
                {
                    string inner = seg.Substring(1, seg.Length - 2);
                    string innerNorm = NormalizeRec(modelType, inner, args);
                    pieces.Add("(" + innerNorm + ")");
                }
                else
                {
                    // 嘗試：同 collection nav + AND 連續子句合併
                    if (TryParseSimpleClause(seg, out var p0, out var op0, out var v0)
                        && p0.Length >= 2
                        && TryGetEnumerableElementType(modelType, p0[0], out var elementType))
                    {
                        var nav = p0[0];

                        // 收集連續 AND 同 nav 的子句
                        var group = new List<(string[] RestPath, string Op, string? Val)>
                {
                    (p0.Skip(1).ToArray(), op0, v0)
                };

                        int j = i;
                        while (j < connectors.Count
                               && connectors[j].Equals("and", StringComparison.OrdinalIgnoreCase))
                        {
                            var nextSeg = chunks[j + 1].Trim();

                            // 不跨括號合併
                            if (nextSeg.StartsWith("(")) break;

                            if (!TryParseSimpleClause(nextSeg, out var pn, out var opn, out var vn)) break;
                            if (pn.Length < 2) break;
                            if (!pn[0].Equals(nav, StringComparison.OrdinalIgnoreCase)) break;

                            group.Add((pn.Skip(1).ToArray(), opn, vn));
                            j++;
                        }

                        if (group.Count >= 2)
                        {
                            // ✅ 合併成單一 Any
                            var merged = BuildMergedAnyClause(modelType, nav, elementType, group, ref args);
                            if (!string.IsNullOrEmpty(merged)) pieces.Add(merged);

                            // group 吃掉了 chunks[i..j]，下一個 connector 是 connectors[j]
                            i = j + 1;

                            // 補回 group 後面那個 connector（如果還有）
                            if (j < connectors.Count) pieces.Add(connectors[j]);
                            continue;
                        }
                    }

                    // fallback：沿用你原本單子句 BuildNestedClause
                    if (TryParseSimpleClause(seg, out var pathParts, out var op, out var val))
                    {
                        string? clause = BuildNestedClause(modelType, pathParts, op, val, ref args);
                        if (!string.IsNullOrEmpty(clause)) pieces.Add(clause);
                    }
                }

                // 正常補 connector（未合併的情況）
                if (i < connectors.Count) pieces.Add(connectors[i]);
                i++;
            }

            return string.Join(" ", pieces);
        }
        // 3) 只在「括號深度為 0」時，辨識 and / or 作為分隔
        private static (List<string> chunks, List<string> connectors) SplitTopLevelByAndOr(string s)
        {
            // 宣告變數
            var chunks = new List<string>();
            var connectors = new List<string>();
            var sb = new System.Text.StringBuilder();
            int depth = 0;
            bool inSingleQuote = false;
            bool inDoubleQuote = false;

            // 執行 function
            for (int i = 0; i < s.Length;)
            {
                char ch = s[i];

                // 單引號字串：支援 SQL 風格 '' 跳脫
                if (ch == '\'' && !inDoubleQuote)
                {
                    if (inSingleQuote && i + 1 < s.Length && s[i + 1] == '\'')
                    {
                        sb.Append("''");
                        i += 2;
                        continue;
                    }

                    if (IsUnescapedQuote(s, i))
                    {
                        inSingleQuote = !inSingleQuote;
                        sb.Append(ch);
                        i++;
                        continue;
                    }
                }

                // 雙引號字串：支援 "" 跳脫
                if (ch == '"' && !inSingleQuote)
                {
                    if (inDoubleQuote && i + 1 < s.Length && s[i + 1] == '"')
                    {
                        sb.Append("\"\"");
                        i += 2;
                        continue;
                    }

                    if (IsUnescapedQuote(s, i))
                    {
                        inDoubleQuote = !inDoubleQuote;
                        sb.Append(ch);
                        i++;
                        continue;
                    }
                }

                // 只有在不在引號內時，才處理括號與 connector
                if (!inSingleQuote && !inDoubleQuote)
                {
                    if (ch == '(')
                    {
                        depth++;
                        sb.Append(ch);
                        i++;
                        continue;
                    }

                    if (ch == ')')
                    {
                        depth = Math.Max(0, depth - 1);
                        sb.Append(ch);
                        i++;
                        continue;
                    }

                    if (depth == 0 && TryReadConnector(s, i, out string? conn, out int adv))
                    {
                        chunks.Add(sb.ToString());
                        sb.Clear();
                        connectors.Add(conn!);
                        i += adv;
                        continue;
                    }
                }

                sb.Append(ch);
                i++;
            }

            chunks.Add(sb.ToString());

            // return
            return (chunks, connectors);
        }
        // 4) 辨識 and / or（允許左右空白）
        private static bool TryReadConnector(string s, int index, out string? conn, out int advance)
        {
            // 宣告變數
            int i = index;

            // 執行 function
            while (i < s.Length && char.IsWhiteSpace(s[i])) i++;

            bool Match(string word)
            {
                if (i + word.Length > s.Length) return false;
                if (!s.AsSpan(i, word.Length).Equals(word, StringComparison.OrdinalIgnoreCase)) return false;
                if (!IsConnectorBoundary(s, i - 1)) return false;
                if (!IsConnectorBoundary(s, i + word.Length)) return false;
                return true;
            }

            if (Match("and"))
            {
                int j = i + 3;
                while (j < s.Length && char.IsWhiteSpace(s[j])) j++;

                conn = "and";
                advance = j - index;
                return true;
            }

            if (Match("or"))
            {
                int j = i + 2;
                while (j < s.Length && char.IsWhiteSpace(s[j])) j++;

                conn = "or";
                advance = j - index;
                return true;
            }

            conn = null;
            advance = 0;

            // return
            return false;
        }
        // 5) 檢查括號是否平衡
        private static bool IsBalanced(string s)
        {
            // 宣告變數
            int depth = 0;
            bool inSingleQuote = false;
            bool inDoubleQuote = false;

            // 執行 function
            for (int i = 0; i < s.Length; i++)
            {
                char ch = s[i];

                if (ch == '\'' && !inDoubleQuote)
                {
                    if (inSingleQuote && i + 1 < s.Length && s[i + 1] == '\'')
                    {
                        i++;
                        continue;
                    }

                    if (IsUnescapedQuote(s, i))
                    {
                        inSingleQuote = !inSingleQuote;
                        continue;
                    }
                }

                if (ch == '"' && !inSingleQuote)
                {
                    if (inDoubleQuote && i + 1 < s.Length && s[i + 1] == '"')
                    {
                        i++;
                        continue;
                    }

                    if (IsUnescapedQuote(s, i))
                    {
                        inDoubleQuote = !inDoubleQuote;
                        continue;
                    }
                }

                if (inSingleQuote || inDoubleQuote) continue;

                if (ch == '(') depth++;
                else if (ch == ')')
                {
                    depth--;
                    if (depth < 0) return false;
                }
            }

            // return
            return depth == 0;
        }
        private static string? UnescapeQuotedValue(string? raw)
        {
            // 宣告變數
            bool isEmpty = string.IsNullOrEmpty(raw);

            // 執行 function
            if (isEmpty) return raw;

            // return
            return raw!
                .Replace("''", "'")
                .Replace("\"\"", "\"");
        }
        private static bool IsUnescapedQuote(string s, int index)
        {
            // 宣告變數
            int slashCount = 0;
            int i = index - 1;

            // 執行 function
            while (i >= 0 && s[i] == '\\')
            {
                slashCount++;
                i--;
            }

            // return
            return slashCount % 2 == 0;
        }
        private static bool IsConnectorBoundary(string s, int index)
        {
            // 宣告變數
            bool isEdge = index < 0 || index >= s.Length;

            // 執行 function
            if (isEdge) return true;

            char ch = s[index];

            // return
            return char.IsWhiteSpace(ch) || ch == '(' || ch == ')';
        }
        private string? BuildNestedClause(Type type, string[] pathParts, string op, string? val, ref List<object> args, int index = 0)
        {
            // 宣告變數
            if (index >= pathParts.Length) return null;

            string current = pathParts[index];
            var prop = PropertyAccessorCache.GetProperty(type, current);
            if (prop == null) return null;

            Type nextType = prop.PropertyType;
            bool isEnumerable = typeof(IEnumerable).IsAssignableFrom(nextType) && nextType != typeof(string);
            if (isEnumerable) nextType = nextType.IsGenericType ? nextType.GetGenericArguments()[0] : nextType.GetElementType();

            // 執行 function
            if (index == pathParts.Length - 1)
            {
                string fieldExpr = current;
                string expr = null;

                switch (op.ToLowerInvariant())
                {
                    case "is null":
                        expr = $"{fieldExpr} == null";
                        break;

                    case "is not null":
                        expr = $"{fieldExpr} != null";
                        break;

                    case "in":
                    case "not in":
                        {
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
                            else
                            {
                                convertedArray = valuesArray.Select(v => Convert.ChangeType(v, targetType)).ToArray();
                            }

                            int paramIndex = args.Count;
                            args.Add(convertedArray);

                            expr = op == "in"
                                ? $"@{paramIndex}.Contains({fieldExpr})"
                                : $"!@{paramIndex}.Contains({fieldExpr})";

                            break;
                        }

                    case "like":
                        {
                            int pIndex = args.Count;
                            args.Add(val ?? string.Empty);
                            expr = $"{fieldExpr} != null && {fieldExpr}.Contains(@{pIndex})";
                            break;
                        }

                    case "hasany":
                        {
                            var raw = (val ?? string.Empty).Trim();

                            if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                                raw = raw.Substring(1, raw.Length - 2);

                            var tokens = raw
                                .Split(',')
                                .Select(s => s.Trim().Trim('"', '\''))
                                .Where(s => !string.IsNullOrWhiteSpace(s))
                                .ToArray();

                            if (tokens.Length == 0) return null;

                            int pIndex = args.Count;
                            args.Add(tokens);
                            expr = $"ApplicationDbContext.SplitToStringTable({fieldExpr}).Any(@{pIndex}.Contains(Id.ToUpper()))";
                            break;
                        }

                    case "hasall":
                        {
                            var raw = (val ?? string.Empty).Trim();

                            if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                                raw = raw.Substring(1, raw.Length - 2);

                            var tokens = raw
                                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(s => s.Trim().Trim('"', '\''))
                                .Where(s => !string.IsNullOrWhiteSpace(s))
                                .Select(s => s.ToUpperInvariant())
                                .ToArray();

                            if (tokens.Length == 0) return null;

                            int pIndex = args.Count;
                            args.Add(tokens);

                            var split = $"ApplicationDbContext.SplitToStringTable({fieldExpr})";
                            expr =
                                $"{split}.Count(@{pIndex}.Contains(Id.ToUpper())) == @{pIndex}.Length && " +
                                $"{split}.Count() == @{pIndex}.Length";

                            break;
                        }

                    case "hasallof":
                        {
                            var raw = (val ?? string.Empty).Trim();

                            if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                                raw = raw.Substring(1, raw.Length - 2);

                            var tokens = raw
                                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(s => s.Trim().Trim('"', '\''))
                                .Where(s => !string.IsNullOrWhiteSpace(s))
                                .Select(s => s.ToUpperInvariant())
                                .ToArray();

                            if (tokens.Length == 0) return null;

                            int pIndex = args.Count;
                            args.Add(tokens);

                            var split = $"ApplicationDbContext.SplitToStringTable({fieldExpr})";
                            expr = $"{split}.Count(@{pIndex}.Contains(Id.ToUpper())) == @{pIndex}.Length";

                            break;
                        }

                    case "&":
                    case "!&":
                        {
                            var raw = (val ?? string.Empty).Trim();
                            if ((raw.StartsWith("(") && raw.EndsWith(")")) || (raw.StartsWith("[") && raw.EndsWith("]")))
                                raw = raw.Substring(1, raw.Length - 2);

                            var propInfo = PropertyAccessorCache.GetProperty(type, fieldExpr);
                            var propType = propInfo.PropertyType;
                            var isNullable = Nullable.GetUnderlyingType(propType) != null;
                            var nonNullType = Nullable.GetUnderlyingType(propType) ?? propType;

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
                                Convert.ChangeType(acc, underlying);

                            var pIndex = args.Count;
                            args.Add(flagVal);

                            var left = isNullable ? $"({fieldExpr} ?? 0)" : fieldExpr;
                            var cmp = op == "&" ? "!= 0" : "== 0";
                            expr = $"(({left} & @{pIndex}) {cmp})";
                            break;
                        }

                    default:
                        {
                            var pi = PropertyAccessorCache.GetProperty(type, fieldExpr);
                            var propType = pi?.PropertyType ?? typeof(string);
                            var nonNullType = Nullable.GetUnderlyingType(propType) ?? propType;
                            var dynOp = op == "=" ? "==" : op;

                            object? converted = val;
                            if (nonNullType.IsEnum) converted = ParseEnumFromString(nonNullType, val ?? "");

                            int pIndex = args.Count;
                            args.Add(converted!);
                            expr = $"{fieldExpr} {dynOp} @{pIndex}";
                            break;
                        }
                }

                return expr;
            }

            string inner = BuildNestedClause(nextType, pathParts, op, val, ref args, index + 1);
            if (string.IsNullOrEmpty(inner)) return null;

            string thisLevel = current;

            // return
            return isEnumerable ? $"{thisLevel}.Any({inner})" : $"{thisLevel}.{inner}";
        }
        /// <summary>
        /// 從 rawCondition 抽出「集合導航」的條件：
        /// e.g. "_Detail.PublishStatus == 1 and _Detail.Year >= 2024"
        ///  ->  { "_Detail": "PublishStatus == 1 and Year >= 2024" }
        /// 限制：目前只處理頂層 AND（先不處理 OR/巢狀括號）
        /// </summary>
        private static Dictionary<string, string> ExtractDetailConditionMap(Type modelType, string rawCondition)
        {
            var map = new Dictionary<string, string>(StringComparer.Ordinal);
            if (string.IsNullOrWhiteSpace(rawCondition)) return map;
            var (chunks, connectors) = SplitTopLevelByAndOr(rawCondition);
            for (int i = 0; i < chunks.Count; i++)
            {
                var seg = chunks[i].Trim();
                if (string.IsNullOrEmpty(seg)) continue;
                // 只做 AND；遇到 OR 先跳過（避免行為錯）
                if (i < connectors.Count && connectors[i].Equals("or", StringComparison.OrdinalIgnoreCase)) continue;
                var m = Regex.Match(seg, @"^(?<fullPath>[\w.]+)\s*(?<op>=|&|!&|==|!=|>=|<=|>|<|in|not in|like|is null|is not null|hasany|hasallof|hasall)\s*(?<val>.+)?$",RegexOptions.IgnoreCase);
                if (!m.Success) continue;
                var fullPath = m.Groups["fullPath"].Value;
                var op = m.Groups["op"].Value;
                var val = m.Groups["val"].Success ? m.Groups["val"].Value.Trim() : null;
                var parts = fullPath.Split('.', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 2) continue;
                var first = parts[0];
                var p = PropertyAccessorCache.GetProperty(modelType, first);
                if (p == null) continue;
                var isEnumerable = typeof(IEnumerable).IsAssignableFrom(p.PropertyType) && p.PropertyType != typeof(string);
                if (!isEnumerable) continue;
                // 去掉集合前綴：_Detail.PublishStatus -> PublishStatus
                var restPath = string.Join('.', parts.Skip(1));
                var rebuilt = string.IsNullOrWhiteSpace(val)? $"{restPath} {op}": $"{restPath} {op} {val}";
                // 同集合多條件以 AND 合併
                map[first] = map.TryGetValue(first, out var exist)? $"{exist} and {rebuilt}": rebuilt;
            }
            return map;
        }
        private static readonly Dictionary<Type, Func<string, object>> EnumStringMappers = new()
        {
            [typeof(LangCode)] = s => LangCodeExt.Normalize(s),
        };
        private static object ParseEnumFromString(Type enumType, string raw)
        {
            raw ??= string.Empty;
            // 1) 專用 mapping（LangCode: zh-tw/en...）
            if (EnumStringMappers.TryGetValue(enumType, out var map)) return map(raw);
            // 2) 通用：把 zh-tw -> zhtw 這種格式轉成 enum name 嘗試 parse
            var normalized = raw.Trim().Replace("-", "").Replace("_", "");
            try { return System.Enum.Parse(enumType, normalized, ignoreCase: true); } catch { }
            // 3) 通用：數字（若你有些 enum 仍用數值傳入）
            if (long.TryParse(raw.Trim(), out var n)) return System.Enum.ToObject(enumType, n);
            throw new FormatException($"Cannot parse '{raw}' to enum '{enumType.Name}'.");
        }

        // 解析單一子句：AnnouncementDetail.Lang = en
        private static bool TryParseSimpleClause(string seg, out string[] pathParts, out string op, out string? val)
        {
            // 宣告變數
            var m = Regex.Match(
                seg,
                @"^(?<fullPath>[\w.]+)\s*(?<op>=|&|!&|==|!=|>=|<=|>|<|in|not in|like|is null|is not null|hasany|hasallof|hasall)\s*(?<val>.+)?$",
                RegexOptions.IgnoreCase);

            pathParts = Array.Empty<string>();
            op = "";
            val = null;

            // 執行 function
            if (!m.Success) return false;

            var fullPath = m.Groups["fullPath"].Value;
            op = m.Groups["op"].Value;

            if (m.Groups["val"].Success)
            {
                var rawVal = m.Groups["val"].Value.Trim().Trim('\'', '"');
                val = UnescapeQuotedValue(rawVal);
            }

            pathParts = fullPath.Split('.');

            // return
            return pathParts.Length > 0;
        }
        // 判斷 modelType.nav 是否為 IEnumerable（非 string），並取 elementType
        private static bool TryGetEnumerableElementType(Type modelType,string navName,out Type elementType)
        {
            elementType = typeof(object);
            var prop = PropertyAccessorCache.GetProperty(modelType, navName);
            if (prop == null) return false;
            var t = prop.PropertyType;
            var isEnumerable = typeof(IEnumerable).IsAssignableFrom(t) && t != typeof(string);
            if (!isEnumerable) return false;
            if (t.IsArray)
            {
                elementType = t.GetElementType() ?? typeof(object);
                return true;
            }
            if (t.IsGenericType)
            {
                elementType = t.GetGenericArguments()[0];
                return true;
            }
            // fallback（很少見）
            elementType = typeof(object);
            return true;
        }

        // 合併：AnnouncementDetail.Any(Lang == @0 and Title != @1)
        private string? BuildMergedAnyClause(Type modelType,string navName,Type elementType,List<(string[] RestPath, string Op, string? Val)> clauses,ref List<object> args)
        {
            // 逐條在 elementType 上 BuildNestedClause，避免每條都各自 Any()
            var innerParts = new List<string>();
            foreach (var c in clauses)
            {
                var inner = BuildNestedClause(elementType, c.RestPath, c.Op, c.Val, ref args, 0);
                if (!string.IsNullOrEmpty(inner)) innerParts.Add(inner);
            }
            if (innerParts.Count == 0) return null;
            // 多條用 and 串（同一筆明細必須同時成立）
            var innerExpr = string.Join(" and ", innerParts);
            return $"{navName}.Any({innerExpr})";
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



        // 產生 RankGroups 的最終 where condition（FirstMatchWins + Rest）
        private sealed record RankGroupPlan(IReadOnlyList<string> GroupWhereList,string RestWhere,string BaseWhere);

        // 將 base condition + rankGroups 組成：
        // group0 = Base AND (G0)
        // group1 = Base AND NOT(G0) AND (G1)
        // ...
        // rest  = Base AND NOT(G0 OR G1 OR ...)
        private static RankGroupPlan BuildRankGroupPlan(string baseCond, IReadOnlyList<RankGroupsSpec> groups)
        {
            // 宣告變數
            var groupWhereList = new List<string>();
            var groupOrList = new List<string>();

            // 執行 function
            for (int i = 0; i < groups.Count; i++)
            {
                var g = groups[i];
                if (string.IsNullOrWhiteSpace(g.Condition)) continue;

                // 1) 先做 base AND group
                var where = MergeAnd(baseCond, g.Condition);

                // 2) 後續 group 要排除前面的 group（優先排序）
                if (groupOrList.Count > 0)
                {
                    var prevOr = string.Join(" or ", groupOrList.Select(x => $"({x})"));
                    where = MergeAnd(where, NotExpr(prevOr)); // ✅ 不用 not(...)
                }

                groupWhereList.Add(where);
                groupOrList.Add(g.Condition);
            }

            // 3) Rest = base AND NOT(any group)
            var restWhere = baseCond;
            if (groupOrList.Count > 0)
            {
                var allOr = string.Join(" or ", groupOrList.Select(x => $"({x})"));
                restWhere = MergeAnd(baseCond, NotExpr(allOr)); // ✅ 不用 not(...)
            }
            var baseWhere = NormalizeBaseWhere(baseCond);


            // return
            return new RankGroupPlan(groupWhereList, restWhere, baseWhere);
        }

        // 將 base condition 轉成可安全串接的片段
        private static string NormalizeBaseWhere(string baseCondition)
        {
            // 宣告變數
            var trimmed = (baseCondition ?? string.Empty).Trim();
            // 執行 function
            if (string.IsNullOrWhiteSpace(trimmed)) trimmed = "true";
            // return
            return trimmed;
        }
        private sealed record RankSegment(string Where, IReadOnlyList<OrderBySpec>? OrderBy);

        private static List<RankSegment> BuildRankSegments(RankGroupPlan plan,IReadOnlyList<RankGroupsSpec>? rankGroups,IReadOnlyList<OrderBySpec>? baseOrderBy)
        {
            // 宣告變數
            var result = new List<RankSegment>();
            var groups = rankGroups?.Where(g => !string.IsNullOrWhiteSpace(g.Condition)).ToList() ?? new List<RankGroupsSpec>();

            // 執行 function：每個 group 用自己的 orderBy（若沒給就 fallback baseOrderBy）
            for (int i = 0; i < plan.GroupWhereList.Count; i++)
            {
                var gOrderBy = groups[i].OrderBy ?? baseOrderBy;
                result.Add(new RankSegment(plan.GroupWhereList[i], gOrderBy));
            }

            // Rest 段：用 baseOrderBy
            result.Add(new RankSegment(plan.RestWhere, baseOrderBy));

            // return
            return result;
        }

        private static string MergeAnd(string a, string b)
        {
            // 宣告變數
            var aa = (a ?? "").Trim();
            var bb = (b ?? "").Trim();

            // 執行 function
            if (string.IsNullOrWhiteSpace(aa)) return bb;
            if (string.IsNullOrWhiteSpace(bb)) return aa;

            // return
            return $"({aa}) and ({bb})";
        }
        private static string NotExpr(string expr)
        {
            // 宣告變數
            var e = (expr ?? "").Trim();

            // 執行 function
            if (string.IsNullOrWhiteSpace(e)) return "true";

            // return（交給 NormalizeRec 去把裡面的子句轉成 bool）
            return $"not ({e})";
        }
        // 過濾掉空的 group condition，並保持順序
        private static List<RankGroupsSpec> NormalizeRankGroups(IReadOnlyList<RankGroupsSpec>? rankGroups)
        {
            // 宣告變數
            var result = new List<RankGroupsSpec>();
            // 執行 function
            if (rankGroups == null) return result;
            foreach (var g in rankGroups)
            {
                if (string.IsNullOrWhiteSpace(g.Condition)) continue;
                result.Add(g);
            }
            // return
            return result;
        }

        // 產出每個 group 的 where（含前序 NOT）
        private static List<string> BuildGroupWhereList(string baseWhere, List<RankGroupsSpec> groups)
        {
            // 宣告變數
            var list = new List<string>();
            // 執行 function
            for (int i = 0; i < groups.Count; i++)
            {
                var gWhere = Wrap(groups[i].Condition);
                var prevNot = BuildPrevNot(groups, i); // NOT(G0 OR ... OR G(i-1))
                var full = string.IsNullOrWhiteSpace(prevNot) ? $"{Wrap(baseWhere)} and {gWhere}" : $"{Wrap(baseWhere)} and {prevNot} and {gWhere}";
                list.Add(full);
            }
            // return
            return list;
        }

        // rest = Base AND NOT(G0 OR G1 OR ...)
        private static string BuildRestWhere(string baseWhere, List<RankGroupsSpec> groups)
        {
            // 宣告變數
            var any = BuildAnyOr(groups);
            // 執行 function
            if (string.IsNullOrWhiteSpace(any)) return baseWhere;
            // return
            return $"{Wrap(baseWhere)} and not {any}";
        }

        // 產生 NOT( G0 OR ... OR G(i-1) )
        private static string BuildPrevNot(List<RankGroupsSpec> groups, int endExclusive)
        {
            // 宣告變數
            if (endExclusive <= 0) return string.Empty;
            // 執行 function
            var any = BuildAnyOr(groups.Take(endExclusive).ToList());
            if (string.IsNullOrWhiteSpace(any)) return string.Empty;
            // return
            return $"not {any}";
        }

        // 產生 (G0) OR (G1) OR ...
        private static string BuildAnyOr(List<RankGroupsSpec> groups)
        {
            // 宣告變數
            var parts = groups.Select(g => g.Condition?.Trim()).Where(s => !string.IsNullOrWhiteSpace(s)).Select(Wrap).ToArray();
            // 執行 function
            if (parts.Length == 0) return string.Empty;
            // return
            return "(" + string.Join(" or ", parts) + ")";
        }

        // 確保子條件都有括號（避免 and/or precedence 出事）
        private static string Wrap(string s)
        {
            // 宣告變數
            var t = (s ?? string.Empty).Trim();
            // 執行 function
            if (string.IsNullOrWhiteSpace(t)) return "(true)";
            if (t.StartsWith("(") && t.EndsWith(")")) return t;
            // return
            return "(" + t + ")";
        }

        #endregion
    }
}
