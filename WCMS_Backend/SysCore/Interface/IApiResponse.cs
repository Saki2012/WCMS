using Microsoft.AspNetCore.Mvc;
using System.Collections;

namespace WCMS.SysCore.Interface
{

    /// <summary>
    /// 資料
    /// </summary>
    public interface BaseDataController<TSet>
    {
        /// <summary>
        /// 新增
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        public Task<ActionResult> Create(TSet set);
        /// <summary>
        /// 修改
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="set"></param>
        /// <returns></returns>
        public Task<ActionResult> Update(ApiRequest<TSet> set);
        /// <summary>
        /// 作廢
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="isInvalid"></param>
        /// <returns></returns>
        public Task<ActionResult> Invalid(object[] pk, bool isInvalid);
        /// <summary>
        /// 批次作廢
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        public Task<ActionResult> BatchInvalid(object[][] pks, bool isInvalid);
        /// <summary>
        /// 刪除
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        public Task<ActionResult> Delete(object[] pk);
        /// <summary>
        /// 批次刪除
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        public Task<ActionResult> BatchDelete(object[][] pks);
        /// <summary>
        /// 查看表單
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        public Task<ActionResult<TSet>> QueryData([FromQuery]string[] internalId);
        /// <summary>
        /// 查詢清單
        /// </summary>
        /// <returns></returns>
        public Task<ActionResult<IList<TSet>>> QueryList([FromBody] QueryListParam queryCondition);
        /// <summary>
        /// 獲取功能的欄位模型顯示名稱
        /// </summary>
        /// <returns></returns>
        public Task<ActionResult> GetModelDisplayName();
    }
    /// <summary>
    /// 報表
    /// </summary>
    public interface BaseReportController<TSet>
    {
        /// <summary>
        /// 查看報表
        /// </summary>
        /// <returns></returns>
        public Task<IActionResult> GetReport();
        /// <summary>
        /// 獲取功能的欄位模型顯示名稱
        /// </summary>
        /// <returns></returns>
        public Task<ActionResult> GetModelDisplayName();
    }
    /// <summary>
    /// 
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public interface IApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T? Data { get; set; }
    }
    /// <summary>
    /// 
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public interface IApiRequest<TSet>
    {
        public object[] PK { get; set; }
        public TSet Set { get; set; }
    }
}
