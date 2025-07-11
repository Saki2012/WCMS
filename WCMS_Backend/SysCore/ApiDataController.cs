using Microsoft.AspNetCore.Mvc;
using System.Collections;
using System.Runtime.CompilerServices;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.SysCore
{
    /// <summary>
    /// 表單API入口
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public abstract class ApiDataController<TSet>(IBizService<TSet> service) : ControllerBase, BaseDataController<TSet> where TSet : class
    {
        #region Property
        protected readonly IBizService<TSet> _service = service;
        #endregion

        #region Public
        /// <summary>
        /// 新增
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        [HttpPost(nameof(Create))]
        public async Task<ActionResult> Create(TSet set)
        {
            return Ok(await _service.CreateSetAsync(set));
        }
        /// <summary>
        /// 修改
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="set"></param>
        /// <returns></returns>
        [HttpPut(nameof(Update))]
        public async Task<ActionResult> Update(ApiRequest<TSet> set)
        {
            return Ok(await _service.UpdateSetAsync(LibData.ConvertJsonElement(set.PK),set.Set));
        }
        /// <summary>
        /// 作廢
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="isInvalid"></param>
        /// <returns></returns>
        [HttpPatch($"{nameof(Invalid)}/{{pk}}")]
        public async Task<ActionResult> Invalid(object[] pk, bool isInvalid)
        {
            return Ok(await _service.InvalidSetAsync(LibData.ConvertJsonElement(pk), isInvalid));
        }
        /// <summary>
        /// 批次作廢
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        [HttpPatch(nameof(BatchInvalid))]
        public async Task<ActionResult> BatchInvalid(object[][] pks, bool isInvalid) => throw new NotImplementedException();
        /// <summary>
        /// 刪除
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        [HttpDelete(nameof(Delete))]
        public async Task<ActionResult> Delete(object[] pk)
        {
            return Ok(await _service.DeleteSetAsync(LibData.ConvertJsonElement(pk)));
        }

        /// <summary>
        /// 批次刪除
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        [HttpDelete(nameof(BatchDelete))]
        public Task<ActionResult> BatchDelete(object[][] pks) => throw new NotImplementedException();
        /// <summary>
        /// 查看表單
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        [HttpGet($"{nameof(QueryData)}")]
        public async Task<ActionResult<TSet>> QueryData([FromQuery] string[] pk)
        {
            return Ok(await _service.QuerySetAsync(pk));
        }
        /// <summary>
        /// 查詢清單
        /// </summary>
        /// <returns></returns>
        [HttpPost(nameof(QueryList))]
        public async Task<ActionResult<IEnumerable<IList>>> QueryList([FromBody] QueryListParam queryCondition)
        {
            return Ok(await _service.QueryListAsync(queryCondition.fields, queryCondition.condition, queryCondition.pageCt, queryCondition.takeCt));
        }
        /// <summary>
        /// 獲取功能的欄位顯示名稱
        /// </summary>
        /// <returns></returns>
        [HttpGet(nameof(GetModelDisplayName))]
        public async Task<ActionResult> GetModelDisplayName()
        {
            return Ok(await _service.CreateSetAsync(null));
        }
        #endregion
    }
    /// <summary>
    /// 報表API入口
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public abstract class ApiReportController<TSet>(IBizService<TSet> service) : ControllerBase, BaseReportController<TSet> where TSet : class
    {
        #region Property
        protected readonly IBizService<TSet> _service = service;
        #endregion
        [HttpPost(nameof(GetReport))]
        public Task<IActionResult> GetReport() => throw new NotImplementedException();
        /// <summary>
        /// 獲取功能的欄位顯示名稱
        /// </summary>
        /// <returns></returns>
        [HttpGet(nameof(GetModelDisplayName))]
        public async Task<ActionResult> GetModelDisplayName()
        {
            return Ok(await _service.CreateSetAsync(null));
        }
    }
    /// <summary>
    /// 
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public class ApiRequest<TSet> : IApiRequest<TSet>
    {
        public object[] PK { get; set; }
        public TSet Set { get; set; }
    }

    /// <summary>
    /// 
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class ApiResponse<T>:IApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T? Data { get; set; }
    }

    public class QueryListParam
    {
       public string[] fields { get; set; }
       public string condition { get; set; }
       public int pageCt { get; set; }
       public int takeCt { get; set; } 
    }
}
