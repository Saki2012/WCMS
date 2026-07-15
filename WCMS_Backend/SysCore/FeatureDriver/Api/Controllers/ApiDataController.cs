using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using WCMS.Features.COMM.Category;
using WCMS.Features.COMM.Tag;
using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.Banner;
using WCMS.Features.WEB.FileArchive;
using WCMS.Features.WEB.Gallery;
using WCMS.Features.WEB.PageManagement;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.Features.WEB.WebResource;
using WCMS.SysCore.Auditing.OperateLog;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Api.Contracts;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.FeatureDriver.Model.Form;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.I18n;
using WCMS.SysCore.PlatformServices.FileManagement;
using WCMS.SysCore.Security.Hardening.AccessControl;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SysCore.FeatureDriver.Api.Controllers;

/// <summary>
/// 資料查詢型 API 基底，直接以 Form Model 聚合模型作為外部與 Biz 契約。
/// </summary>
/// <typeparam name="TFormModel">表單模型聚合根型別。</typeparam>
public abstract class ApiDataQueryController<TFormModel> : ApiBaseController where TFormModel : class
{
    #region Property
    private IBizService<TFormModel>? _service;
    private IOutputCacheFeature? _Ocf;
    private IBizService<FileManageModel>? _fileService;
    private ModelTypeMetadataCache? _modelMetadata;
    private I18nCache? _i18n;

    /// <summary>
    /// Form Model Biz 服務。
    /// </summary>
    protected IBizService<TFormModel> Service => _service ??= HttpContext.RequestServices.GetRequiredService<IBizService<TFormModel>>();
    /// <summary>
    /// 目前輸出快取 Feature。
    /// </summary>
    private IOutputCacheFeature? Ocf => _Ocf ??= HttpContext.Features.Get<IOutputCacheFeature>();
    /// <summary>
    /// 檔案管理服務。
    /// </summary>
    protected FileManagementBiz FileService => (FileManagementBiz)(_fileService ??= HttpContext.RequestServices.GetRequiredService<IBizService<FileManageModel>>());
    /// <summary>
    /// Model Reflection Metadata Cache。
    /// </summary>
    protected ModelTypeMetadataCache ModelMetadata => _modelMetadata ??= HttpContext.RequestServices.GetRequiredService<ModelTypeMetadataCache>();
    /// <summary>
    /// 多語系顯示文字 Cache。
    /// </summary>
    protected I18nCache I18n => _i18n ??= HttpContext.RequestServices.GetRequiredService<I18nCache>();
    /// <summary>
    /// Form Model 欄位顯示名稱。
    /// </summary>
    protected ModelDisplay<TFormModel>.ModelMetadata ModelDescription { get { return new ModelDisplay<TFormModel>(ModelMetadata, I18n).Model; } }
    #endregion

    #region Public
    /// <summary>
    /// 查詢清單。
    /// </summary>
    [HttpPost(nameof(QueryList)), OutputCache(PolicyName = SysParam.OutputCachePolicies.ListCache), AllowAnonymous, IgnoreAntiforgeryToken]
    public virtual async Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition, CancellationToken ct)
    {
        if (!LibApiFieldPolicyHelper.CheckQueryParam<TFormModel>(queryCondition, ModelMetadata)) return BadRequest("查詢參數錯誤");
        AddListTags();
        SpecSetQueryParam(queryCondition, null);
        IList<TFormModel> result = await Service.BizQueryListAsync(queryCondition.Fields, queryCondition.Condition, queryCondition.OrderBy, queryCondition.RankGroups, queryCondition.PageNumber, queryCondition.PageSize, ct);
        var response = new ApiResponse<TFormModel>() { Data = result, SysMessage = Message.Messages };
        return Ok(response);
    }
    /// <summary>
    /// 獲取清單總頁數。
    /// </summary>
    [HttpPost(nameof(GetTotalCounts)), OutputCache(PolicyName = SysParam.OutputCachePolicies.ListCache), AllowAnonymous, IgnoreAntiforgeryToken]
    public virtual async Task<IActionResult> GetTotalCounts([FromBody] QueryListParam? queryCondition, CancellationToken ct)
    {
        if (!LibApiFieldPolicyHelper.CheckQueryParam<TFormModel>(queryCondition, ModelMetadata)) return BadRequest("查詢參數錯誤");
        AddListTags();
        SpecSetQueryParam(queryCondition, null);
        int result = await Service.BizQueryTotalCounts(queryCondition.Condition, ct);
        var response = new ApiResponse<int>() { Data = [result], SysMessage = Message.Messages };
        return Ok(response);
    }
    /// <summary>
    /// 獲取功能的欄位顯示名稱。
    /// </summary>
    [HttpGet(nameof(GetModelDisplayName)), OutputCache(PolicyName = SysParam.OutputCachePolicies.PermanentCache), AllowAnonymous, IgnoreAntiforgeryToken]
    public async Task<IActionResult> GetModelDisplayName()
    {
        var result = await Task.Run(() => ModelDescription);
        var response = new ApiResponse<ModelDisplay<TFormModel>.ModelMetadata>() { Data = [result], SysMessage = Message.Messages };
        return Ok(response);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 轉換查詢條件欄位名稱。
    /// </summary>
    protected virtual void SpecSetQueryParam(QueryListParam queryCondition, Dictionary<string, string>? newFieldNameDic)
    {
        if (newFieldNameDic == null || newFieldNameDic.Count == 0) return;
        queryCondition.Fields = [.. queryCondition.Fields.Select(p => ReplaceQueryFieldName(p, newFieldNameDic))];
        queryCondition.Condition = ReplaceQueryFieldName(queryCondition.Condition, newFieldNameDic);
        queryCondition.OrderBy = queryCondition.OrderBy?.Select(p => p with { Col = ReplaceQueryFieldName(p.Col, newFieldNameDic) }).ToArray();
        queryCondition.RankGroups = queryCondition.RankGroups?.Select(p => p with
        {
            Condition = ReplaceQueryFieldName(p.Condition, newFieldNameDic),
            OrderBy = p.OrderBy?.Select(o => o with { Col = ReplaceQueryFieldName(o.Col, newFieldNameDic) }).ToArray()
        }).ToArray();
    }
    /// <summary>
    /// API 寫入前的客製補值時機。
    /// </summary>
    protected virtual void SpecBeforeWrite(TFormModel data) { }
    /// <summary>
    /// API 讀出後的客製補值時機。
    /// </summary>
    protected virtual void SpecAfterRead(TFormModel data) { }
    #endregion

    #region Private
    /// <summary>
    /// 將查詢欄位名稱替換成實際 Model 欄位名稱。
    /// </summary>
    private static string ReplaceQueryFieldName(string value, IReadOnlyDictionary<string, string> fieldNameMap)
    {
        if (string.IsNullOrWhiteSpace(value)) return value;
        foreach (var item in fieldNameMap) value = value.Replace(item.Key, item.Value, StringComparison.Ordinal);
        return value;
    }
    #endregion

    #region Tag helpers
    private static string ListTag => $"{SysParam.OutputCacheTags.DataList}:{typeof(TFormModel).Name}";
    private static string DetailTag => $"{SysParam.OutputCacheTags.DataDetail}:{typeof(TFormModel).Name}";
    private static string DetailItemTag(string id) => $"{SysParam.OutputCacheTags.DataDetail}:{typeof(TFormModel).Name}:{id}";
    /// <summary>
    /// 加入清單快取標籤。
    /// </summary>
    protected void AddListTags()
    {
        Ocf?.Context.Tags.Add(SysParam.OutputCacheTags.DataList);
        Ocf?.Context.Tags.Add(ListTag);
    }
    /// <summary>
    /// 加入明細快取標籤。
    /// </summary>
    protected void AddDetailTags(string id)
    {
        Ocf?.Context.Tags.Add(SysParam.OutputCacheTags.DataDetail);
        Ocf?.Context.Tags.Add(DetailTag);
        Ocf?.Context.Tags.Add(DetailItemTag(id));
    }
    /// <summary>
    /// 清除 Form Model 快取。
    /// </summary>
    protected async Task EvictForDataAsync(CancellationToken ct, string? id = null)
    {
        await CacheStore.EvictByTagAsync(ListTag, ct);
        await CacheStore.EvictByTagAsync(SysParam.OutputCacheTags.DataList, ct);
        if (!string.IsNullOrWhiteSpace(id)) await CacheStore.EvictByTagAsync(DetailItemTag(id), ct);
        await CacheStore.EvictByTagAsync(DetailTag, ct);
        await CacheStore.EvictByTagAsync(SysParam.OutputCacheTags.DataDetail, ct);
    }
    #endregion
}
/// <summary>
/// 表單 API 入口，直接使用 Form Model 聚合模型。
/// </summary>
/// <typeparam name="TFormModel">表單模型聚合根型別。</typeparam>
public abstract class ApiDataController<TFormModel> : ApiDataQueryController<TFormModel> where TFormModel : class
{
    #region Public
    /// <summary>
    /// 新增。
    /// </summary>
    [HttpPost(nameof(Create)), LibRequireFuncAct(FuncAction.Create)]
    public virtual async Task<IActionResult> Create(TFormModel data, CancellationToken ct)
    {
        OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Create)}", OperateUser.UserId, JsonConvert.SerializeObject(data), Request.Headers[SysParam.HttpHeaders.ClientIp].ToString());
        SpecBeforeWrite(data);
        TFormModel result = await Service.BizCreateDataAsync(data, ct);
        await EvictForDataAsync(ct);
        SpecAfterRead(result);
        var response = new ApiResponse<TFormModel>() { Data = [result], SysMessage = Message.Messages };
        followInfo.ExcStatus = response.IsSuccess ? ExcStatus.OK : ExcStatus.Fail;
        return Ok(response);
    }
    /// <summary>
    /// 初始資料建立匯入。
    /// </summary>
    [HttpPost(nameof(InitialCreateData))]
    public virtual async Task<IActionResult> InitialCreateData(TFormModel[] datas, CancellationToken ct)
    {
        OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(InitialCreateData)}", OperateUser.UserId, JsonConvert.SerializeObject(datas), Request.Headers[SysParam.HttpHeaders.ClientIp].ToString());
        bool ownsTx = await Service.TryBeginTransactionAsync();
        try
        {
            foreach (var data in datas) SpecBeforeWrite(data);
            await Service.BizInitCreateDatasAsync(datas, ct);
            await Service.TryCommitAsync(ownsTx);
            return Ok();
        }
        catch (Exception ex)
        {
            await Service.TryRollbackAsync(ownsTx);
            return BadRequest($"初始化失敗：{ex.Message}");
        }
    }
    /// <summary>
    /// 修改。
    /// </summary>
    [HttpPut(nameof(Update)), LibRequireFuncAct(FuncAction.Update)]
    public virtual async Task<IActionResult> Update(ApiRequest<TFormModel> request, CancellationToken ct)
    {
        OperateLogModel followInfo = OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Update)}", OperateUser.UserId, JsonConvert.SerializeObject(request), Request.Headers[SysParam.HttpHeaders.ClientIp].ToString());
        if (request.Data != null) SpecBeforeWrite(request.Data);
        TFormModel result = await Service.BizUpdateDataAsync(request.InternalId, request.Data!, ct);
        await EvictForDataAsync(ct, request.InternalId);
        SpecAfterRead(result);
        var response = new ApiResponse<TFormModel>() { Data = [result], SysMessage = Message.Messages };
        followInfo.ExcStatus = response.IsSuccess ? ExcStatus.OK : ExcStatus.Fail;
        return Ok(response);
    }
    /// <summary>
    /// 作廢。
    /// </summary>
    [HttpPatch($"{nameof(Invalid)}/{{pk}}"), LibRequireFuncAct(FuncAction.Invalid)]
    public virtual async Task<IActionResult> Invalid(string internalId, bool isInvalid, CancellationToken ct)
    {
        OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Invalid)}", OperateUser.UserId, JsonConvert.SerializeObject(internalId), Request.Headers[SysParam.HttpHeaders.ClientIp].ToString());
        if (!Guid.TryParse(internalId, out _)) return BadRequest("Invalid internalId format.");
        TFormModel result = await Service.BizInvalidDataAsync(internalId, isInvalid, ct);
        await EvictForDataAsync(ct, internalId);
        SpecAfterRead(result);
        var response = new ApiResponse<TFormModel>() { Data = [result], SysMessage = Message.Messages };
        return Ok(response);
    }
    /// <summary>
    /// 批次作廢。
    /// </summary>
    [HttpPatch(nameof(BatchInvalid)), LibRequireFuncAct(FuncAction.Invalid)] public virtual async Task<IActionResult> BatchInvalid(string[] internalIds, bool isInvalid, CancellationToken ct) => throw new NotImplementedException();
    /// <summary>
    /// 刪除。
    /// </summary>
    [HttpDelete(nameof(Delete)), LibRequireFuncAct(FuncAction.Delete)]
    public virtual async Task<IActionResult> Delete(string internalId, CancellationToken ct)
    {
        OperateLog.AddOperateLog($"{Service.ProgId}/{nameof(Delete)}", OperateUser.UserId, JsonConvert.SerializeObject(internalId), Request.Headers[SysParam.HttpHeaders.ClientIp].ToString());
        if (!Guid.TryParse(internalId, out _)) return BadRequest("Invalid internalId format.");
        TFormModel result = await Service.BizDeleteDataAsync(internalId, ct);
        await EvictForDataAsync(ct, internalId);
        SpecAfterRead(result);
        var response = new ApiResponse<TFormModel>() { Data = [result], SysMessage = Message.Messages };
        return Ok(response);
    }
    /// <summary>
    /// 批次刪除。
    /// </summary>
    [HttpDelete(nameof(BatchDelete)), LibRequireFuncAct(FuncAction.Delete)] public virtual Task<IActionResult> BatchDelete(string[] internalIds, CancellationToken ct) => throw new NotImplementedException();
    /// <summary>
    /// 查看表單。
    /// </summary>
    [HttpGet(nameof(QueryData)), OutputCache(PolicyName = SysParam.OutputCachePolicies.DetailCache), AllowAnonymous, IgnoreAntiforgeryToken]
    public virtual async Task<IActionResult> QueryData([FromQuery] string internalId, CancellationToken ct)
    {
        if (!Guid.TryParse(internalId, out _)) return BadRequest("Invalid internalId format.");
        AddDetailTags(internalId);
        TFormModel result = await Service.BizQueryDataAsync(internalId, ct);
        SpecAfterRead(result);
        var response = new ApiResponse<TFormModel>() { Data = [result], SysMessage = Message.Messages };
        return Ok(response);
    }
    #endregion
}
/// <summary>
/// 系統功能API
/// </summary>
[ApiController, Route(SysParam.ApiRoutes.Service)]
public class SystemAPIController(IAntiforgery anti, SystemVersion systemVersionBiz, I18nCache i18n) : ControllerBase
{
    #region Property
    private readonly IAntiforgery _anti = anti;
    private readonly SystemVersion _systemVersionBiz = systemVersionBiz;
    private readonly I18nCache _i18n = i18n;

    protected IOperateLog OperateLog => _OperateLog ??= HttpContext.RequestServices.GetRequiredService<IOperateLog>();
    private IOperateLog? _OperateLog;
    #endregion

    #region Public
    /// <summary>
    /// 發出/更新 XSRF Token，寫入可讀 Cookie：XSRF-TOKEN
    /// </summary>
    [HttpGet(nameof(GetXsrfToken)), AllowAnonymous, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None), IgnoreAntiforgeryToken]
    public IActionResult GetXsrfToken()
    {
        var tokens = _anti.GetAndStoreTokens(HttpContext);
        Response.Cookies.Append(SysParam.CookieNames.XsrfToken, tokens.RequestToken!, new CookieOptions
        {
            HttpOnly = false,                 // 讓前端可讀，axios 才能送到 header
            Secure = true,                  // 只在 HTTPS 傳送
            SameSite = SameSiteMode.Strict,      // 同站情境會自動帶上
            Path = SysParam.CookiePaths.Root
        });
        return NoContent();
    }
    /// <summary>
    /// 獲取EnumOption
    /// </summary>
    /// <param name="enumName"></param>
    /// <returns></returns>
    [HttpGet(nameof(GetEnumOptions)), OutputCache(PolicyName = SysParam.OutputCachePolicies.PermanentCache)]
    public IActionResult GetEnumOptions([FromQuery, Required] string enumName)
    {
        try
        {
            List<EnumOption> result = _i18n.GetEnumOptions(enumName);
            var response = new ApiResponse<EnumOption>() { Data = result };
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
    /// <summary>
    /// 取得後端版本號。
    /// </summary>
    [HttpGet(nameof(GetBackendVersion)), AllowAnonymous, ResponseCache(NoStore = true, Location = ResponseCacheLocation.None), IgnoreAntiforgeryToken]
    public IActionResult GetBackendVersion()
    {
        string result = _systemVersionBiz.GetBackendVersion();
        var response = new ApiResponse<string>() { Data = [result] };
        return Ok(response);
    }
    /// <summary>
    /// 轉移舊資料
    /// </summary>
    /// <param name="labelTag"></param>
    /// <returns></returns>
    [HttpPost(nameof(Migration)), LocalhostOnly]
    public async Task<IActionResult> Migration(string labelTag = "1810")
    {
        FileManagementBiz fileManagement = HttpContext.RequestServices.GetRequiredService<IBizService<FileManageModel>>() as FileManagementBiz;
        OperateLogModel followInfo = new OperateLogModel();
        followInfo.APIName = $"{"SystemAPI"}/{nameof(Migration)}";
        followInfo.UserId = "SysOperator";
        followInfo.IP = Request.Headers[SysParam.HttpHeaders.ClientIp].ToString();
        OperateLog.AddOperateLog(followInfo);
        await fileManagement.ImportZip(labelTag);
        QueryListParam p = new() { Fields = [nameof(FileManageModel.InternalId)], Condition = $"{nameof(FileManageModel.ImportLabel)} = {labelTag}" };
        IList<FileManageModel> fileInternalIds = await fileManagement.BizQueryListAsync(p);
        IList<FileManageModel> srcFiles = [];
        foreach (var file in fileInternalIds)
        {
            var f = await fileManagement.BizQueryDataAsync(file.InternalId);
            if (f != null) srcFiles.Add(f);
        }
        AnnouncementBiz announcement = HttpContext.RequestServices.GetRequiredService<IBizService<Announcement>>() as AnnouncementBiz;
        await announcement.Migrate(labelTag, srcFiles);

        BannerBiz banner = HttpContext.RequestServices.GetRequiredService<IBizService<Banner>>() as BannerBiz;
        await banner.Migrate(labelTag, srcFiles);

        CategoryBiz category = HttpContext.RequestServices.GetRequiredService<IBizService<Category>>() as CategoryBiz;
        await category.Migrate();

        FileArchiveBiz fileArchive = HttpContext.RequestServices.GetRequiredService<IBizService<FileArchive>>() as FileArchiveBiz;
        await fileArchive.Migrate(labelTag, srcFiles);

        GalleryBiz gallery = HttpContext.RequestServices.GetRequiredService<IBizService<Gallery>>() as GalleryBiz;
        await gallery.Migrate(labelTag, srcFiles);

        PageManagementBiz pageManagement = HttpContext.RequestServices.GetRequiredService<IBizService<PageManagement>>() as PageManagementBiz;
        await pageManagement.Migrate(labelTag, srcFiles);

        TagBiz tagBiz = HttpContext.RequestServices.GetRequiredService<IBizService<TagData>>() as TagBiz;
        await tagBiz.Migrate();

        WebResourceBiz webResourceBiz = HttpContext.RequestServices.GetRequiredService<IBizService<WebResource>>() as WebResourceBiz;
        await webResourceBiz.Migrate(labelTag, srcFiles);

        SiteMenuBiz siteMenuBiz = HttpContext.RequestServices.GetRequiredService<IBizService<SiteMenu_IndexModel>>() as SiteMenuBiz;
        await siteMenuBiz.Migrate(pageManagement);

        return Ok();
    }
    #endregion
    #region Private

    #endregion
}


