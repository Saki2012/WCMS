using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using WCMS.SysCore.Model;
namespace WCMS.SysCore.Interface
{
    /// <summary>
    /// 資料
    /// </summary>
    public interface IBaseDataController<TSet,TSet_DTO>where TSet : ITSet where TSet_DTO : ITSet_DTO
    {
        /// <summary>
        /// 新增
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        public Task<IActionResult> Create(TSet_DTO set, CancellationToken ct);
        /// <summary>
        /// 修改
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="set"></param>
        /// <returns></returns>
        public Task<IActionResult> Update(ApiRequest<TSet_DTO> set, CancellationToken ct);
        /// <summary>
        /// 作廢
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="isInvalid"></param>
        /// <returns></returns>
        public Task<IActionResult> Invalid(string internalId, bool isInvalid, CancellationToken ct);
        /// <summary>
        /// 批次作廢
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        public Task<IActionResult> BatchInvalid(string[] internalIds, bool isInvalid, CancellationToken ct);
        /// <summary>
        /// 刪除
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        public Task<IActionResult> Delete(string internalIds, CancellationToken ct);
        /// <summary>
        /// 批次刪除
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        public Task<IActionResult> BatchDelete(string[] internalIds, CancellationToken ct);
        /// <summary>
        /// 查看表單
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        public Task<IActionResult> QueryData([FromQuery]string internalId, CancellationToken ct);
        /// <summary>
        /// 查詢清單
        /// </summary>
        /// <returns></returns>
        public Task<IActionResult> QueryList([FromBody] QueryListParam queryCondition, CancellationToken ct);
        /// <summary>
        /// 查詢清單總數
        /// </summary>
        /// <param name="queryCondition"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        public Task<IActionResult> GetTotalCounts([FromBody] QueryListParam? queryCondition, CancellationToken ct);
        /// <summary>
        /// 獲取功能的欄位模型顯示名稱
        /// </summary>
        /// <returns></returns>
        public Task<IActionResult> GetModelDisplayName();
    }
    /// <summary>
    /// 報表
    /// </summary>
    public interface IBaseReportController<TSet,TSet_DTO>
    {
        /// <summary>
        /// 查看報表
        /// </summary>
        /// <returns></returns>
        public Task<IActionResult> GetReport(CancellationToken ct);
        /// <summary>
        /// 獲取功能的欄位模型顯示名稱
        /// </summary>
        /// <returns></returns>
        public Task<IActionResult> GetModelDisplayName();
    }
    /// <summary>
    /// 回傳結果
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public interface IApiResponse<T>
    {
        public bool IsSuccess { get; }
        public IList<SysMessageModel> SysMessage { get; set; }
        public IList<T>? Data { get; set; }
    }
    /// <summary>
    /// 更新資料請求
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public interface IApiRequest<TSet_DTO>
    {
        public string InternalId { get; set; }
        public TSet_DTO? Data { get; set; }
    }
    /// <summary>
    /// 查詢條件請求
    /// </summary>
    public interface IQueryListParam
    {
        public string[] Fields { get; set; }
        public string Condition { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
}
