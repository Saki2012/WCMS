using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.Model;
using static WCMS.SysCore.FeatureDriver.Api.QueryListParam;
namespace WCMS.SysCore.Interface
{
    /// <summary>
    /// Form Model 表單 API 契約。
    /// </summary>
    public interface IBaseDataController<TFormModel> where TFormModel : class
    {
        /// <summary>
        /// 新增 Form Model。
        /// </summary>
        public Task<IActionResult> Create(TFormModel data, CancellationToken ct);
        /// <summary>
        /// 修改 Form Model。
        /// </summary>
        public Task<IActionResult> Update(ApiRequest<TFormModel> request, CancellationToken ct);
        /// <summary>
        /// 作廢 Form Model。
        /// </summary>
        public Task<IActionResult> Invalid(string internalId, bool isInvalid, CancellationToken ct);
        /// <summary>
        /// 批次作廢 Form Model。
        /// </summary>
        public Task<IActionResult> BatchInvalid(string[] internalIds, bool isInvalid, CancellationToken ct);
        /// <summary>
        /// 刪除 Form Model。
        /// </summary>
        public Task<IActionResult> Delete(string internalIds, CancellationToken ct);
        /// <summary>
        /// 批次刪除 Form Model。
        /// </summary>
        public Task<IActionResult> BatchDelete(string[] internalIds, CancellationToken ct);
        /// <summary>
        /// 查看 Form Model 表單。
        /// </summary>
        public Task<IActionResult> QueryData([FromQuery]string internalId, CancellationToken ct);
        /// <summary>
        /// 查詢 Form Model 清單。
        /// </summary>
        public Task<IActionResult> QueryList([FromBody] QueryListParam queryCondition, CancellationToken ct);
        /// <summary>
        /// 查詢 Form Model 清單總數。
        /// </summary>
        public Task<IActionResult> GetTotalCounts([FromBody] QueryListParam? queryCondition, CancellationToken ct);
        /// <summary>
        /// 獲取功能的欄位模型顯示名稱。
        /// </summary>
        public Task<IActionResult> GetModelDisplayName();
    }
    /// <summary>
    /// 回傳結果
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public interface IApiResponse
    {
        public bool IsSuccess { get; }
        public IList<SysMessageModel> SysMessage { get; set; }
    }
    /// <summary>
    /// 回傳結果
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public interface IApiResponse<T>: IApiResponse
    {
        public IList<T>? Data { get; set; }
    }
    /// <summary>
    /// 更新資料請求
    /// </summary>
    /// <typeparam name="TFormModel"></typeparam>
    public interface IApiRequest<TFormModel>
    {
        public string InternalId { get; set; }
        public TFormModel? Data { get; set; }
    }
    /// <summary>
    /// 查詢條件請求
    /// </summary>
    public interface IQueryListParam
    {
        public string[] Fields { get; set; }
        public string Condition { get; set; }
        public IReadOnlyList<OrderBySpec> OrderBy { get; set; }
        public IReadOnlyList<RankGroupsSpec> RankGroups { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
    
}
