using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.OutputCaching;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.Features.COMM.Tag;
using WCMS.Features.IAM.Auth;
using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.Banner;
using WCMS.Features.WEB.FileArchive;
using WCMS.Features.WEB.Gallery;
using WCMS.Features.WEB.PageManagement;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.Features.WEB.WebResource;
using WCMS.SpecFeatures.Spec1810.WEB.SpecCategory;
using WCMS.SpecFeatures.Spec1810.WEB.SpecResearch;
using WCMS.SpecFeatures.Spec1810.WEB.SpecUSR;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.SysCore
{
    /// <summary>
    /// API基礎入口
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    /// <typeparam name="TSet_DTO"></typeparam>
    [Authorize] public abstract class ApiBaseController<TSet, TSet_DTO> : ControllerBase, IAsyncActionFilter where TSet : ITSet where TSet_DTO : ITSet_DTO
    {
        #region Property
        private IBizService<TSet>? _service;
        protected IErrorHelper Message => _Message ??= HttpContext.RequestServices.GetRequiredService<IErrorHelper>();
        private IErrorHelper? _Message;
        protected IBizService<TSet> Service => _service ??= HttpContext.RequestServices.GetRequiredService<IBizService<TSet>>();
        private IOutputCacheStore? _cacheStore;
        protected IOutputCacheStore CacheStore => _cacheStore ??= HttpContext.RequestServices.GetRequiredService<IOutputCacheStore>();
        private IOutputCacheFeature? _Ocf;
        private IOutputCacheFeature? Ocf => _Ocf ??= HttpContext.Features.Get<IOutputCacheFeature>();
        private IBizService<FileManageSet> _fileService;
        protected FileManagementBiz FileService => (FileManagementBiz)(_fileService ??= HttpContext.RequestServices.GetRequiredService<IBizService<FileManageSet>>());
        protected ModelDisplay<TSet_DTO>.ModelMetadata ModelDescription{ get { return new ModelDisplay<TSet_DTO>().Model; } }
        protected IOperateLog OperateLog => _OperateLog ??= HttpContext.RequestServices.GetRequiredService<IOperateLog>();
        private IOperateLog? _OperateLog;
        private ICurrentUserAccessor _Current;
        protected ICurrentUserAccessor Current => _Current ??= HttpContext.RequestServices.GetRequiredService<ICurrentUserAccessor>();
        public User_DTO OperateUser { get { return Current.User; } }
        #endregion

        #region Public
        /// <summary>
        /// 查詢清單
        /// TODO:之後一定要拆分成前台跟後台用的API，後台會需要多一層權限管控
        /// </summary>
        /// <returns></returns>
        [HttpPost(nameof(QueryList)), OutputCache(PolicyName = SysParam.ListCache), AllowAnonymous, IgnoreAntiforgeryToken]
        public virtual async Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition, CancellationToken ct)
        {
            if (!DTOHelper.CheckQueryParam<TSet_DTO>(queryCondition)) return BadRequest("查詢參數錯誤");
            AddListTags();
            var queryResult = await Service.BizQueryListAsync(queryCondition.Fields, queryCondition.Condition, queryCondition.OrderBy, queryCondition.RankGroups, queryCondition.PageNumber, queryCondition.PageSize);
            List<TSet_DTO> result = [];
            foreach (var item in queryResult) result.Add(DTOHelper.MapToDTO<TSet, TSet_DTO>(item));
            var response = new ApiResponse<TSet_DTO>() { Data = result, SysMessage = Message.Messages };
            return Ok(response);
        }
        /// <summary>
        /// 獲取清單總頁數
        /// </summary>
        /// <param name="queryCondition"></param>
        /// <returns></returns>
        [HttpPost(nameof(GetTotalCounts)), OutputCache(PolicyName = SysParam.ListCache), AllowAnonymous, IgnoreAntiforgeryToken]
        public virtual async Task<IActionResult> GetTotalCounts([FromBody] QueryListParam? queryCondition, CancellationToken ct)
        {
            if (!DTOHelper.CheckQueryParam<TSet_DTO>(queryCondition)) return BadRequest("查詢參數錯誤");
            AddListTags();
            var result = await Service.BizQueryTotalCounts(queryCondition.Condition);
            var response = new ApiResponse<int>() { Data = [result], SysMessage = Message.Messages };
            return Ok(response);
        }
        /// <summary>
        /// 獲取功能的欄位顯示名稱
        /// </summary>
        /// <returns></returns>
        [HttpGet(nameof(GetModelDisplayName)), OutputCache(PolicyName = SysParam.PermanentCache), AllowAnonymous, IgnoreAntiforgeryToken]
        public async Task<IActionResult> GetModelDisplayName()
        {
            var result = await Task.Run(() => ModelDescription);
            var response = new ApiResponse<ModelDisplay<TSet_DTO>.ModelMetadata>() { Data = [result], SysMessage = Message.Messages };
            return Ok(response);
        }
        #endregion

        #region Tag helpers
        // 型別級（list/detail）tag
        private static string ListTag => $"set:list:{typeof(TSet).Name}";
        private static string DetailTag => $"set:detail:{typeof(TSet).Name}";
        // 逐筆 tag：型別 + internalId
        private static string DetailItemTag(string id) => $"set:detail:{typeof(TSet).Name}:{id}";
        protected void AddListTags()
        {
            Ocf?.Context.Tags.Add("set:list");
            Ocf?.Context.Tags.Add(ListTag);
        }
        protected void AddDetailTags(string id)
        {
            Ocf?.Context.Tags.Add("set:detail");
            Ocf?.Context.Tags.Add(DetailTag);
            Ocf?.Context.Tags.Add(DetailItemTag(id));
        }
        /// <summary>
        /// 清除快取
        /// </summary>
        /// <param name="ct"></param>
        /// <param name="id"></param>
        /// <returns></returns>
        protected async Task EvictForSetAsync(CancellationToken ct, string? id = null)
        {
            await CacheStore.EvictByTagAsync(ListTag, ct);
            await CacheStore.EvictByTagAsync("set:list", ct);
            if (!string.IsNullOrWhiteSpace(id)) await CacheStore.EvictByTagAsync(DetailItemTag(id), ct);
            await CacheStore.EvictByTagAsync(DetailTag, ct);
            await CacheStore.EvictByTagAsync("set:detail", ct);
        }
        #endregion

        #region 權限控制
        Task IAsyncActionFilter.OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // 顯式介面實作：避免 MVC 把它當 action endpoint
            return OnActionExecutionCoreAsync(context, next);
        }
        private async Task OnActionExecutionCoreAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var ok = await EnsurePermissionAsync(context);
            if (!ok) return;

            await next();
        }
        private async Task<bool> EnsurePermissionAsync(ActionExecutingContext context)
        {
            // 1) AllowAnonymous：不檢查權限
            if (context.Filters.Any(f => f is Microsoft.AspNetCore.Mvc.Authorization.IAllowAnonymousFilter))
                return true;
            // 2) 沒登入：交給 [Authorize] 處理（這裡不做 401）
            if (!Current.IsAuthenticated) return true;
            // 3) 取出 action 上的 RequiredAct
            var requiredAct = GetRequiredAct(context);
            if (requiredAct == FuncAction.None) return true; // 沒標就不管（你之後想改成強制也行）
            // 4) 取出 controller/action 上的 permission meta（你目前用 LibPermission / LibApiController 都可以）
            var meta = GetPermissionMeta(context);
            if (meta == null) return true;
            // 5) SupportMask 不支援：直接 403
            if ((meta.SupportFuncActMask & requiredAct) != requiredAct)
            {
                context.Result = Forbid();
                return false;
            }
            // 6) RBAC 檢查：查 user 是否有該動作
            var checker = HttpContext.RequestServices.GetRequiredService<ILibPermissionChecker>();
            var ok = await checker.HasPermissionAsync(Current.User.UserId, meta.ProgId, requiredAct, context.HttpContext.RequestAborted);
            if (!ok)
            {
                var actionName = EnumHelper.GetEnumDisplayName(requiredAct); 
                Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00029, actionName);
                context.Result = new JsonResult(Message.Messages.LastOrDefault().Message) { StatusCode = StatusCodes.Status403Forbidden };
                return false;
            }
            return true;
        }
        private static FuncAction GetRequiredAct(ActionExecutingContext context)
        {
            if (context.ActionDescriptor is not ControllerActionDescriptor cad) return FuncAction.None;
            var attr = cad.MethodInfo.GetCustomAttributes(typeof(LibRequireFuncActAttribute), true).OfType<LibRequireFuncActAttribute>().FirstOrDefault();
            return attr?.RequiredAct ?? FuncAction.None;
        }
        private static LibApiControllerAttribute? GetPermissionMeta(ActionExecutingContext context)
        {
            if (context.ActionDescriptor is not ControllerActionDescriptor cad) return null;
            // Action 優先，其次 Controller
            return cad.MethodInfo.GetCustomAttributes(typeof(LibApiControllerAttribute), true).OfType<LibApiControllerAttribute>().FirstOrDefault()
                ?? cad.ControllerTypeInfo.GetCustomAttributes(typeof(LibApiControllerAttribute), true).OfType<LibApiControllerAttribute>().FirstOrDefault();
        }
        #endregion
       
    }
    /// <summary>
    /// 表單API入口
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public abstract class ApiDataController<TSet, TSet_DTO> : ApiBaseController<TSet, TSet_DTO>, IBaseDataController<TSet, TSet_DTO> where TSet : ITSet where TSet_DTO : ITSet_DTO
    {
        #region Public
        /// <summary>
        /// 新增
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        [HttpPost(nameof(Create)), LibRequireFuncAct(FuncAction.Create)]
        public virtual async Task<IActionResult> Create(TSet_DTO set, CancellationToken ct)
        {
            OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Create)}", OperateUser.UserId,  JsonConvert.SerializeObject(set),Request.Headers["HTTP_CLIENT_IP"].ToString());
            TSet entity = DTOHelper.MapToSet<TSet, TSet_DTO>(set);
            SpecDoMapToSet(entity, set);
            var createResult = await Service.BizCreateSetAsync(entity, ct);
            await EvictForSetAsync(ct);
            TSet_DTO result = DTOHelper.MapToDTO<TSet, TSet_DTO>(createResult);
            SpecDoMapToDTO(createResult, result);
            var response = new ApiResponse<TSet_DTO>() { Data = [result],SysMessage = Message.Messages };
            if (ct == CancellationToken.None) { followInfo.ExcStatus = ExcStatus.CancelExc; }
            if (!response.IsSuccess) followInfo.ExcStatus = ExcStatus.Fail;
            else followInfo.ExcStatus = ExcStatus.OK;
            return Ok(response);
        }
        /// <summary>
        /// 初始資料建立匯入
        /// </summary>
        /// <param name="sets"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPost(nameof(InitialCreateData))]
        public virtual async Task<IActionResult> InitialCreateData(TSet_DTO[] sets, CancellationToken ct)
        {
            OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(InitialCreateData)}", OperateUser.UserId, JsonConvert.SerializeObject(sets),Request.Headers["HTTP_CLIENT_IP"].ToString() );

            bool ownsTx = false;
            ownsTx = await Service.TryBeginTransactionAsync();
            try
            {
                IList<TSet>entitySets = [];
                foreach (var set in sets)
                {
                    TSet entity = DTOHelper.MapToSet<TSet, TSet_DTO>(set);
                    entitySets.Add(entity);
                }
                await Service.BizInitCreateSetsAsync([.. entitySets]);
                return Ok();
            }
            catch (Exception ex)
            {
                await Service.TryRollbackAsync(ownsTx);
                return BadRequest($"初始化失敗：{ex.Message}");
            }
        }
        /// <summary>
        /// 修改
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPut(nameof(Update)), LibRequireFuncAct(FuncAction.Update)]
        public virtual async Task<IActionResult> Update(ApiRequest<TSet_DTO> data, CancellationToken ct)
        {
            OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Update)}", OperateUser.UserId, JsonConvert.SerializeObject(data), Request.Headers["HTTP_CLIENT_IP"].ToString());
            TSet entity = DTOHelper.MapToSet<TSet, TSet_DTO>(data.Data);
            SpecDoMapToSet(entity, data.Data);
            var updateResult = await Service.BizUpdateSetAsync(data.InternalId, entity);
            await EvictForSetAsync(ct, data.InternalId);
            if (ct == CancellationToken.None) { followInfo.ExcStatus = ExcStatus.CancelExc; }
            TSet_DTO result = DTOHelper.MapToDTO<TSet, TSet_DTO>(updateResult);
            SpecDoMapToDTO(updateResult, result);
            var response = new ApiResponse<TSet_DTO>() { Data = [result], SysMessage = Message.Messages };
            if (!response.IsSuccess) followInfo.ExcStatus = ExcStatus.Fail;
            else followInfo.ExcStatus = ExcStatus.OK;
            return Ok(response);
        }
        /// <summary>
        /// 作廢
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="isInvalid"></param>
        /// <returns></returns>
        [HttpPatch($"{nameof(Invalid)}/{{pk}}"), LibRequireFuncAct(FuncAction.Invalid)]
        public virtual async Task<IActionResult> Invalid(string internalId, bool isInvalid, CancellationToken ct)
        {
            OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Invalid)}", OperateUser.UserId, JsonConvert.SerializeObject(internalId), Request.Headers["HTTP_CLIENT_IP"].ToString());
            if (!Guid.TryParse(internalId, out var guid)) { return BadRequest("Invalid internalId format."); }
            var invalidResult = await Service.BizInvalidSetAsync(internalId, isInvalid);
            var result = DTOHelper.MapToDTO<TSet, TSet_DTO>(invalidResult);
            await EvictForSetAsync(ct, internalId);
            var response = new ApiResponse<TSet_DTO>() { Data = [result], SysMessage = Message.Messages };
            return Ok(response);
        }
        /// <summary>
        /// 批次作廢
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        [HttpPatch(nameof(BatchInvalid)), LibRequireFuncAct(FuncAction.Invalid)] public virtual async Task<IActionResult> BatchInvalid(string[] internalIds, bool isInvalid, CancellationToken ct) => throw new NotImplementedException();
        /// <summary>
        /// 刪除
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        [HttpDelete(nameof(Delete)), LibRequireFuncAct(FuncAction.Delete)]
        public virtual async Task<IActionResult> Delete(string internalId, CancellationToken ct)
        {
            OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Delete)}", OperateUser.UserId, JsonConvert.SerializeObject(internalId), Request.Headers["HTTP_CLIENT_IP"].ToString());
            if (!Guid.TryParse(internalId, out var guid)) { return BadRequest("Invalid internalId format."); }
            var deleteResult = await Service.BizDeleteSetAsync(internalId);
            var result = DTOHelper.MapToDTO<TSet, TSet_DTO>(deleteResult);
            await EvictForSetAsync(ct, internalId);
            var response = new ApiResponse<TSet_DTO>() { Data = [result],SysMessage = Message.Messages };
            return Ok(response);
        }
        /// <summary>
        /// 批次刪除
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        [HttpDelete(nameof(BatchDelete)), LibRequireFuncAct(FuncAction.Delete)] public virtual Task<IActionResult> BatchDelete(string[] internalIds, CancellationToken ct) => throw new NotImplementedException();
        /// <summary>
        /// 查看表單
        /// TODO:之後一定要拆分成前台跟後台用的API，後台會需要多一層權限管控
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        [HttpGet(nameof(QueryData)),OutputCache(PolicyName = SysParam.DetailCache), AllowAnonymous, IgnoreAntiforgeryToken]
        public virtual async Task<IActionResult> QueryData([FromQuery] string internalId, CancellationToken ct)
        {
            if (!Guid.TryParse(internalId, out var guid)) { return BadRequest("Invalid internalId format."); }
            AddDetailTags(internalId);
            var queryResult = await Service.BizQuerySetAsync(internalId);
            var result = DTOHelper.MapToDTO<TSet, TSet_DTO>(queryResult);
            var response = new ApiResponse<TSet_DTO>() { Data = [result], SysMessage = Message.Messages };
            return Ok(response);
        }
        #endregion

        #region Protected
        protected virtual void SpecDoMapToSet(TSet set,TSet_DTO dto){}
        protected virtual void SpecDoMapToDTO(TSet set, TSet_DTO dto) { }
        #endregion

        #region Private

        #endregion
    }
    /// <summary>
    /// 系統功能API
    /// </summary>
    [ApiController, Route(SysParam.ServiceRoute)] public class SystemAPIController(IAntiforgery anti) : ControllerBase
    {
        #region Property
        private readonly IAntiforgery _anti = anti;
        protected IOperateLog OperateLog => _OperateLog ??= HttpContext.RequestServices.GetRequiredService<IOperateLog>();
        private IOperateLog? _OperateLog;
        #endregion
        #region Public
        /// <summary>發出/更新 XSRF Token，寫入可讀 Cookie：XSRF-TOKEN</summary>
        [HttpGet(nameof(GetXsrfToken)), AllowAnonymous, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None), IgnoreAntiforgeryToken]
        public IActionResult GetXsrfToken()
        {
            var tokens = _anti.GetAndStoreTokens(HttpContext);

            Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new CookieOptions
            {
                HttpOnly = false,                 // 讓前端可讀，axios 才能送到 header
                Secure = true,                  // 只在 HTTPS 傳送
                SameSite = SameSiteMode.Strict,      // 同站情境會自動帶上
                Path = "/"
            });
            return NoContent();                   // 204
        }
        /// <summary>
        /// 獲取EnumOption
        /// </summary>
        /// <param name="enumName"></param>
        /// <returns></returns>
        [HttpGet(nameof(GetEnumOptions)), OutputCache(PolicyName = SysParam.PermanentCache)]
        public IActionResult GetEnumOptions([FromQuery, Required] string enumName)
        {
            try
            {
                var result = EnumHelper.GetEnumOptions(enumName);
                var response = new ApiResponse<EnumOption>() { Data = result };
                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        /// <summary>
        /// 轉移舊資料
        /// </summary>
        /// <param name="labelTag"></param>
        /// <returns></returns>
        [HttpPost(nameof(Migration)), LocalhostOnly] public async Task<IActionResult> Migration(string labelTag = "1810")
        {
            FileManagementBiz fileManagement = HttpContext.RequestServices.GetRequiredService<IBizService<FileManageSet>>() as FileManagementBiz;
            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{"SystemAPI"}/{nameof(Migration)}";
            followInfo.UserId = "SysOperator";
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddOperateLog(followInfo);
            await fileManagement.ImportZip(labelTag);
            QueryListParam p = new(){Fields=[nameof(FileManageModel.InternalId)], Condition = $"{nameof(FileManageModel.ImportLabel)} = {labelTag}"};
            IList<FileManageSet> fileInternalIds = await fileManagement.BizQueryListAsync(p);
            IList<FileManageSet> srcFiles = [];
            foreach(var file in fileInternalIds)
            {
                var f = await fileManagement.BizQuerySetAsync(file.FileManage.InternalId);
                if (f != null) srcFiles.Add(f);
            }
            AnnouncementBiz announcement = HttpContext.RequestServices.GetRequiredService<IBizService<AnnouncementSet>>() as AnnouncementBiz;
            await announcement.Migrate(labelTag, srcFiles);

            BannerBiz banner = HttpContext.RequestServices.GetRequiredService<IBizService<BannerSet>>() as BannerBiz;
            await banner.Migrate(labelTag, srcFiles);

            CategoryBiz category = HttpContext.RequestServices.GetRequiredService<IBizService<CategoryDataSet>>() as CategoryBiz;
            await category.Migrate();

            FileArchiveBiz fileArchive = HttpContext.RequestServices.GetRequiredService<IBizService<FileArchiveSet>>() as FileArchiveBiz;
            await fileArchive.Migrate(labelTag,srcFiles);

            GalleryBiz gallery = HttpContext.RequestServices.GetRequiredService<IBizService<GallerySet>>() as GalleryBiz;
            await gallery.Migrate(labelTag, srcFiles);

            PageManagementBiz pageManagement = HttpContext.RequestServices.GetRequiredService<IBizService<PageManagementSet>>() as PageManagementBiz;
            await pageManagement.Migrate(labelTag, srcFiles);

            TagBiz tagBiz = HttpContext.RequestServices.GetRequiredService<IBizService<TagSet>>() as TagBiz;
            await tagBiz.Migrate();

            WebResourceBiz webResourceBiz = HttpContext.RequestServices.GetRequiredService<IBizService<WebResourceSet>>() as WebResourceBiz;
            await webResourceBiz.Migrate(labelTag, srcFiles);

            SiteMenuBiz siteMenuBiz = HttpContext.RequestServices.GetRequiredService<IBizService<SiteMenuSet>>() as SiteMenuBiz;
            await siteMenuBiz.Migrate(pageManagement);

            SpecCategoryBiz specCategoryBiz = HttpContext.RequestServices.GetRequiredService<IBizService<SpecCategorySet>>() as SpecCategoryBiz;
            await specCategoryBiz.Migrate();

            SpecResearchBiz specResearchBiz = HttpContext.RequestServices.GetRequiredService<IBizService<SpecResearchSet>>() as SpecResearchBiz;
            await specResearchBiz.Migrate();

            SpecUSRBiz specUSRBiz = HttpContext.RequestServices.GetRequiredService<IBizService<SpecUSRSet>>() as SpecUSRBiz;
            await specUSRBiz.Migrate(labelTag, srcFiles);

            //foreach (var fileSet in srcFiles)
            //{
            //    var copy = System.Text.Json.JsonSerializer.Deserialize<FileManageSet>(System.Text.Json.JsonSerializer.Serialize(fileSet));
            //    await fileManagement.BizUpdateSetAsync(fileSet.FileManage.InternalId, copy);
            //}

            return Ok();
        }
        #endregion
        #region Private
        
        #endregion
    }
    public class ApiResponse : IApiResponse
    {
        public bool IsSuccess { get { foreach (var msg in SysMessage) if (msg.Status == MessageStatus.Error) return false; return true; } }
        public IList<SysMessageModel> SysMessage { get; set; } = [];
    }
    /// <summary>
    /// 回應結果
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class ApiResponse<T> :ApiResponse, IApiResponse<T>
    {
        public IList<T>? Data { get; set; } = [];
    }
    /// <summary>
    /// 
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public class ApiRequest<TSet> : IApiRequest<TSet>
    {
        public string InternalId { get; set; }
        public TSet? Data { get; set; }
    }
    /// <summary>
    /// 查詢條件
    /// </summary>
    public class QueryListParam : IQueryListParam
    {
        public readonly record struct OrderBySpec(string Col, bool Desc = false);
        public readonly record struct RankGroupsSpec(string Condition, IReadOnlyList<OrderBySpec>? OrderBy);
        public string[] Fields { get; set; } = [];
        public string Condition { get; set; } = string.Empty;
        public IReadOnlyList<OrderBySpec>? OrderBy { get; set; }
        public IReadOnlyList<RankGroupsSpec>? RankGroups { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
    /// <summary>
    /// 模型顯示名稱
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public class ModelDisplay<TSet_DTO>
    {
        #region Property
        public ModelMetadata Model
        {
            get
            {
                var result = new ModelMetadata
                {
                    ModelId = typeof(TSet_DTO).Name,
                    ModelDisplayName = I18nCache.GetLabel<TSet_DTO>(),
                    Tables = []
                };
                foreach (var tbProp in PropertyAccessorCache.GetProperties(typeof(TSet_DTO)))
                {
                    var tb = new TableMetadata() { Columns = [] };
                    result.Tables.Add(tb);
                    tb.TableId = tbProp.Name;
                    tb.TableDisplayName = I18nCache.GetLabel(tbProp);
                    if (!tbProp.IsListPropertyType())
                    {
                        foreach (var colProp in PropertyAccessorCache.GetProperties(tbProp.PropertyType))
                        {
                            tb.Columns.Add(new ColumnMetadata()
                            {
                                ColumnId = colProp.Name,
                                ColumnDisplayName = I18nCache.GetLabel(colProp),
                            });
                        }
                    }
                    else
                    {
                        var tbType = tbProp.PropertyType.GetGenericArguments().FirstOrDefault();
                        foreach (var colProp in PropertyAccessorCache.GetProperties(tbType))
                        {
                            tb.Columns.Add(new ColumnMetadata()
                            {
                                ColumnId = colProp.Name,
                                ColumnDisplayName = I18nCache.GetLabel(colProp),
                            });
                        }
                    }
                }
                return result;
            }
        }
        public class ModelMetadata
        {
            public string ModelId { get; set; }
            public string ModelDisplayName { get; set; }
            public List<TableMetadata> Tables { get; set; } = [];
        }
        public class TableMetadata
        {
            public string TableId { get; set; }
            public string TableDisplayName { get; set; }
            public List<ColumnMetadata> Columns { get; set; } = [];
        }
        public class ColumnMetadata
        {
            public string ColumnId { get; set; }
            public string ColumnDisplayName { get; set; }
        }
        #endregion
    }
}