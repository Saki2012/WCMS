using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.SysCore
{
    public abstract class ApiBaseController<TSet, TSet_DTO> : ControllerBase where TSet : ITSet where TSet_DTO : ITSet_DTO
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
        private ModelDisplay<TSet_DTO>.ModelMetadata _modelDisplayName;
        protected ModelDisplay<TSet_DTO>.ModelMetadata ModelDescription
        {
            get
            {
                _modelDisplayName ??= new ModelDisplay<TSet_DTO>().Model;
                return _modelDisplayName;
            }
        }
        protected IOperateLog OperateLog => _OperateLog ??= HttpContext.RequestServices.GetRequiredService<IOperateLog>();
        private IOperateLog? _OperateLog;
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
        protected async Task EvictForSetAsync(CancellationToken ct, string? id = null)
        {
            await CacheStore.EvictByTagAsync(ListTag, ct);
            await CacheStore.EvictByTagAsync("set:list", ct);
            if (!string.IsNullOrWhiteSpace(id))
                await CacheStore.EvictByTagAsync(DetailItemTag(id), ct);
            await CacheStore.EvictByTagAsync(DetailTag, ct);
            await CacheStore.EvictByTagAsync("set:detail", ct);
        }
        #endregion
        /// <summary>
        /// 獲取功能的欄位顯示名稱
        /// </summary>
        /// <returns></returns>
        [HttpGet(nameof(GetModelDisplayName)), OutputCache(PolicyName = "PermanentJson")]
        public async Task<IActionResult> GetModelDisplayName()
        {
            return Ok(await Task.Run(() => ModelDescription));
        }
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
        [HttpPost(nameof(Create))]
        public virtual async Task<IActionResult> Create(TSet_DTO set, CancellationToken ct)
        {
            TSet entity = DTOHelper.MapToSet<TSet, TSet_DTO>(set);
            var createResult = await Service.BizCreateSetAsync(entity);
            await EvictForSetAsync(ct);

            //TODO:操作日誌記錄 By Peter
            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(Create)}";
            followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(set);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            TSet_DTO result = DTOHelper.MapToDTO<TSet, TSet_DTO>(createResult);
            var response = new ApiResponse<TSet_DTO>() { Data = [result] };

            if (ct == CancellationToken.None) { followInfo.ExcStatus = ExcStatus.CancelExc; }
            if(!response.IsSuccess) followInfo.ExcStatus = ExcStatus.Fail;
            else followInfo.ExcStatus = ExcStatus.OK;
             
            return Ok(response);
        }
        [HttpPost(nameof(InitialCreateData))]
        public virtual async Task<IActionResult> InitialCreateData(TSet_DTO[] sets, CancellationToken ct)
        {
            await Service.BeginTransactionAsync();

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(InitialCreateData)}";
            followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(sets);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            try
            {
                int i = 1;
                foreach (var set in sets)
                {
                    TSet entity = DTOHelper.MapToSet<TSet, TSet_DTO>(set);
                    PropertyInfo headerProp = PropertyAccessorCache.GetProperties<TSet>().Where(p => !p.IsListPropertyType()).FirstOrDefault();
                    var header = PropertyAccessorCache.Get(entity, headerProp.Name);
                    PropertyAccessorCache.Set(header, nameof(BasicDataModel.IsIniData), true);
                    await Service.BizCreateSetAsync(entity);
                    i++;
                }
                await Service.CommitDataAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                await Service.RollbackTransactionAsync();
                return BadRequest($"初始化失敗：{ex.Message}");
            }
        }
        /// <summary>
        /// 修改
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPut(nameof(Update))]
        public virtual async Task<IActionResult> Update(ApiRequest<TSet_DTO> data, CancellationToken ct)
        {
            TSet entity = DTOHelper.MapToSet<TSet, TSet_DTO>(data.Data);
            var updateResult = await Service.BizUpdateSetAsync(data.InternalId, entity);
            await EvictForSetAsync(ct, data.InternalId);

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(Update)}";
            followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(data);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            TSet_DTO result = DTOHelper.MapToDTO<TSet, TSet_DTO>(updateResult);
            var response = new ApiResponse<TSet_DTO>() { Data = [result] };
            return Ok(response);
        }
        /// <summary>
        /// 作廢
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="isInvalid"></param>
        /// <returns></returns>
        [HttpPatch($"{nameof(Invalid)}/{{pk}}")]
        public virtual async Task<IActionResult> Invalid(string internalId, bool isInvalid, CancellationToken ct)
        {
            if (!Guid.TryParse(internalId, out var guid)) { return BadRequest("Invalid internalId format."); }
            var invalidResult = await Service.BizInvalidSetAsync(internalId, isInvalid);
            var result = DTOHelper.MapToDTO<TSet, TSet_DTO>(invalidResult);
            await EvictForSetAsync(ct, internalId);

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(Invalid)}";
            followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(result);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            var response = new ApiResponse<TSet_DTO>() { Data = [result], };
            return Ok(response);
        }
        /// <summary>
        /// 批次作廢
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        [HttpPatch(nameof(BatchInvalid))] public virtual async Task<IActionResult> BatchInvalid(string[] internalIds, bool isInvalid, CancellationToken ct) => throw new NotImplementedException();
        /// <summary>
        /// 刪除
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        [HttpDelete(nameof(Delete))]
        public virtual async Task<IActionResult> Delete(string internalId, CancellationToken ct)
        {
            if (!Guid.TryParse(internalId, out var guid)) { return BadRequest("Invalid internalId format."); }
            var deleteResult = await Service.BizDeleteSetAsync(internalId);
            var result = DTOHelper.MapToDTO<TSet, TSet_DTO>(deleteResult);
            await EvictForSetAsync(ct, internalId);

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(Delete)}";
            followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(result);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            var response = new ApiResponse<TSet_DTO>() { Data = [result] };
            return Ok(response);
        }
        /// <summary>
        /// 批次刪除
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        [HttpDelete(nameof(BatchDelete))] public virtual Task<IActionResult> BatchDelete(string[] internalIds, CancellationToken ct) => throw new NotImplementedException();
        /// <summary>
        /// 查看表單
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        [HttpGet(nameof(QueryData)), OutputCache(PolicyName = "DetailJson"), AllowAnonymous, IgnoreAntiforgeryToken]
        public virtual async Task<IActionResult> QueryData([FromQuery] string internalId, CancellationToken ct)
        {
            if (!Guid.TryParse(internalId, out var guid)) { return BadRequest("Invalid internalId format."); }
            AddDetailTags(internalId);
            var queryResult = await Service.BizQuerySetAsync(internalId);
            var result = DTOHelper.MapToDTO<TSet, TSet_DTO>(queryResult);

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(QueryData)}";
            followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(result);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            var response = new ApiResponse<TSet_DTO>() { Data = [result] };
            return Ok(response);
        }
        /// <summary>
        /// 查詢清單
        /// </summary>
        /// <returns></returns>
        [HttpPost(nameof(QueryList)), OutputCache(PolicyName = "ListJson"), AllowAnonymous, IgnoreAntiforgeryToken]
        public virtual async Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition, CancellationToken ct)
        {
            if (!DTOHelper.CheckQueryParam<TSet_DTO>(queryCondition)) return BadRequest("查詢參數錯誤");
            AddListTags();
            var queryResult = await Service.BizQueryListAsync(queryCondition.Fields, queryCondition.Condition,queryCondition.OrderBy, queryCondition.PageNumber, queryCondition.PageSize);
            List<TSet_DTO> result = [];
            foreach (var item in queryResult) result.Add(DTOHelper.MapToDTO<TSet, TSet_DTO>(item));

            OperateLogModel followInfo = new OperateLogModel();
            followInfo.APIName = $"{Service.ProgId}/{nameof(QueryList)}";
            //followInfo.UserId = "SysOperator";
            followInfo.followingDT = JsonConvert.SerializeObject(result);
            followInfo.IP = Request.Headers["HTTP_CLIENT_IP"].ToString();
            OperateLog.AddMoveFollow(followInfo);

            var response = new ApiResponse<TSet_DTO>() { Data = result };
            return Ok(response);
        }
        /// <summary>
        /// 獲取清單總頁數
        /// </summary>
        /// <param name="queryCondition"></param>
        /// <returns></returns>
        [HttpPost(nameof(GetTotalCounts)), OutputCache(PolicyName = "ListJson"), AllowAnonymous, IgnoreAntiforgeryToken]
        public virtual async Task<IActionResult> GetTotalCounts([FromBody] QueryListParam? queryCondition, CancellationToken ct)
        {
            if (!DTOHelper.CheckQueryParam<TSet_DTO>(queryCondition)) return BadRequest("查詢參數錯誤");
            AddListTags();
            var result = await Service.BizQueryTotalCounts(queryCondition.Fields, queryCondition.Condition);
            var response = new ApiResponse<int>() {SysMessage=Message.Messages, Data = [result] };
            return Ok(response);
        }
        #endregion

        #region Private

        #endregion
    }
    /// <summary>
    /// 系統功能API
    /// </summary>
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SystemAPIController(IAntiforgery anti) : ControllerBase
    {
        private readonly IAntiforgery _anti = anti;
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
        [HttpGet(nameof(GetEnumOptions)), OutputCache(PolicyName = "PermanentJson")]
        public IActionResult GetEnumOptions([FromQuery, Required] string enumName)
        {
            try
            {
                var options = EnumHelper.GetEnumOptions(enumName);
                return Ok(options);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        //public IActionResult Migration(string labelTag = "1810")
        //{

        //    return Ok;
        //}
    }
    /// <summary>
    /// 回應結果
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class ApiResponse<T> : IApiResponse<T>
    {
        public bool IsSuccess { get { foreach (var msg in SysMessage) if (msg.Status == MessageStatus.Error) return false; return true; } }
        public IList<SysMessageModel> SysMessage { get; set; } = [];
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
        public string[] Fields { get; set; }
        public string Condition { get; set; }
        public IReadOnlyList<OrderBySpec>? OrderBy { get; set; }
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