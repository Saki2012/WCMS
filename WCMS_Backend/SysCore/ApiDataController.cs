using Microsoft.AspNetCore.Mvc;
using System.Collections;
using System.Diagnostics;
using System.Reflection;
using System.Runtime.CompilerServices;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.SysCore
{
    /// <summary>
    /// 表單API入口
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public abstract class ApiDataController<TSet>(IBizService<TSet> service) : ControllerBase, IBaseDataController<TSet> where TSet : class
    {
        #region Property

        private ModelDisplay<TSet>.ModelMetadata _modelDisplayName;

        public ModelDisplay<TSet>.ModelMetadata ModelDescription 
        {
            get 
            { 
                _modelDisplayName??= new ModelDisplay<TSet>().Model;
                return _modelDisplayName; 
            }
        }

        protected readonly IBizService<TSet> _service = service;
        #endregion

        #region Public
        /// <summary>
        /// 新增
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        [HttpPost(nameof(Create))]
        public async Task<IActionResult> Create(TSet set)
        {
            return Ok(await _service.CreateSetAsync(set));
        }
        [HttpPost(nameof(InitialCreateData))]
        public async Task<IActionResult> InitialCreateData(TSet[] sets)
        {
            await _service.BeginTransactionAsync();
            try
            {
                int i = 1;
                foreach (var set in sets) 
                {
                    Debug.WriteLine($"執行第{i}筆資料");
                    Console.WriteLine($"執行第{i}筆資料");
                    await _service.CreateSetAsync(set);
                    Debug.WriteLine($"第{i}筆資料保存成功");
                    Console.WriteLine($"第{i}筆資料保存成功");
                    i++;
                }
                await _service.CommitDataAsync();
                return Ok();
            }
            catch(Exception ex)
            {
                await _service.RollbackTransactionAsync();
                return BadRequest($"初始化失敗：{ex.Message}");
            }
        }

        /// <summary>
        /// 修改
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="set"></param>
        /// <returns></returns>
        [HttpPut(nameof(Update))]
        public async Task<IActionResult> Update(ApiRequest<TSet> set)
        {
            return Ok(await _service.UpdateSetAsync(set.UID,set.Set));
        }
        /// <summary>
        /// 作廢
        /// </summary>
        /// <param name="pk"></param>
        /// <param name="isInvalid"></param>
        /// <returns></returns>
        [HttpPatch($"{nameof(Invalid)}/{{pk}}")]
        public async Task<IActionResult> Invalid(string uid, bool isInvalid)
        {
            return Ok(await _service.InvalidSetAsync(uid, isInvalid));
        }
        /// <summary>
        /// 批次作廢
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        [HttpPatch(nameof(BatchInvalid))]
        public async Task<IActionResult> BatchInvalid(string[] uids, bool isInvalid) => throw new NotImplementedException();
        /// <summary>
        /// 刪除
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        [HttpDelete(nameof(Delete))]
        public async Task<IActionResult> Delete(string internalId)
        {
            return Ok(await _service.DeleteSetAsync(internalId));
        }
        /// <summary>
        /// 批次刪除
        /// </summary>
        /// <param name="pks"></param>
        /// <returns></returns>
        [HttpDelete(nameof(BatchDelete))]
        public Task<IActionResult> BatchDelete(string[] uids) => throw new NotImplementedException();
        /// <summary>
        /// 查看表單
        /// </summary>
        /// <param name="pk"></param>
        /// <returns></returns>
        [HttpGet($"{nameof(QueryData)}")]
        public async Task<IActionResult> QueryData([FromQuery] string internalId)
        {
            return Ok(await _service.QuerySetAsync(internalId));
        }
        /// <summary>
        /// 查詢清單
        /// </summary>
        /// <returns></returns>
        [HttpPost(nameof(QueryList))]
        public async Task<IActionResult> QueryList([FromBody] QueryListParam? queryCondition)
        {
            return Ok(await _service.QueryListAsync(queryCondition.Fields, queryCondition.Condition, queryCondition.PageNumber, queryCondition.PageSize));
        }
        /// <summary>
        /// 獲取功能的欄位顯示名稱
        /// </summary>
        /// <returns></returns>
        [HttpGet(nameof(GetModelDisplayName))]

        public async Task<IActionResult> GetModelDisplayName()
        {
            return Ok(await Task.Run(() => ModelDescription));
        }
        #endregion

        #region Private
        
        #endregion
    }
    /// <summary>
    /// 報表API入口
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public abstract class ApiReportController<TSet>(IBizService<TSet> service) : ControllerBase, IBaseReportController<TSet> where TSet : class
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
        public async Task<IActionResult> GetModelDisplayName()
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
        public string UID { get; set; }
        public TSet Set { get; set; }
    }

    /// <summary>
    /// 查詢條件
    /// </summary>
    public class QueryListParam
    {
        public string[] Fields { get; set; }
        public string Condition { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
    /// <summary>
    /// 模型顯示名稱
    /// </summary>
    /// <typeparam name="TSet"></typeparam>
    public class ModelDisplay<TSet>
    {
        #region Property
        public ModelMetadata Model
        { get {
                var result = new ModelMetadata
                {
                    ModelId = typeof(TSet).Name,
                    ModelDisplayName = I18nCache.GetLabel<TSet>(),
                    Tables = []
                };
                foreach (var tbProp in PropertyAccessorCache.GetProperties(typeof(TSet)))
                {
                    var tb = new TableMetadata() { Columns = [] };
                    result.Tables.Add(tb);
                    tb.TableId = tbProp.Name;
                    tb.TableDisplayName = I18nCache.GetLabel(tbProp);
                    if (tbProp.PropertyType.IsGenericType && tbProp.PropertyType.GetGenericTypeDefinition() == typeof(List<>))
                    {
                        var tbType = tbProp.PropertyType.GetGenericArguments().First();
                        foreach (var colProp in PropertyAccessorCache.GetProperties(tbType))
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
                        foreach (var colProp in PropertyAccessorCache.GetProperties(tbProp.PropertyType))
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
