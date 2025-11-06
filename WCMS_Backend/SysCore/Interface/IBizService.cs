using WCMS.Features.Member.Account;
using WCMS.Features.SystemSetting.Auth;
using static WCMS.SysCore.QueryListParam;

namespace WCMS.SysCore.Interface
{
    public interface IBizService<TSet>
    {
        #region Property
        /// <summary>
        /// 操作人員
        /// </summary>
        public User_DTO OperateUser { get; set; }
        /// <summary>
        /// 資料異動及操作日誌系統
        /// </summary>
        //public SysChangeLog? SysChangeLog { get; }
        /// <summary>
        /// 功能Id
        /// </summary>
        public string ProgId { get; }
        #endregion

        #region Func
        /// <summary>
        /// 新增
        /// </summary>
        /// <param name="set"></param>
        /// <returns></returns>
        public Task<TSet> BizCreateSetAsync(TSet set);
        /// <summary>
        /// 初始化資料(多筆)
        /// </summary>
        /// <param name="sets"></param>
        /// <returns></returns>
        public Task BizInitCreateSetsAsync(TSet[] sets);
        /// <summary>
        /// 修改
        /// </summary>
        /// <param name="key"></param>
        /// <param name="set"></param>
        /// <returns></returns>
        public Task<TSet> BizUpdateSetAsync(string internalId, TSet set);
        /// <summary>
        /// 刪除
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        public Task<TSet> BizDeleteSetAsync(string internalId);
        /// <summary>
        /// 作廢
        /// </summary>
        /// <param name="key"></param>
        /// <param name="status"></param>
        /// <returns></returns>
        public Task<TSet> BizInvalidSetAsync(string internalId, bool status);
        /// <summary>
        /// 查詢表單
        /// </summary>
        /// <param name="InternalId">內部唯一標示號</param>
        /// <returns></returns>
        public Task<TSet> BizQuerySetAsync(string internalId);
        /// <summary>
        /// 查詢清單
        /// </summary>
        /// <param name="param"></param>
        /// <returns></returns>
        public Task<IList<TSet>> BizQueryListAsync(QueryListParam param);

        /// <summary>
        /// 查詢清單
        /// </summary>
        /// <param name="selectFields"></param>
        /// <param name="condition"></param>
        /// <param name="pageCt"></param>
        /// <param name="takeCt"></param>
        /// <returns></returns>
        public Task<IList<TSet>> BizQueryListAsync(string[] selectFields, string condition,IReadOnlyList<OrderBySpec> orderBy, int pageNumber, int pageSize);
        /// <summary>
        /// 獲取清單總頁數
        /// </summary>
        /// <param name="condition"></param>
        /// <param name="pageNumber"></param>
        /// <param name="pageSize"></param>
        /// <returns></returns>
        public Task<int> BizQueryTotalCounts(string[] selectFields, string condition);

        /// <summary>
        /// 啟用交易控制(非同步)
        /// </summary>
        /// <returns></returns>
        public Task BeginTransactionAsync();
        /// <summary>
        /// 回滾交易控制(非同步)
        /// </summary>
        /// <returns></returns>
        public Task RollbackTransactionAsync();
        /// <summary>
        /// 執行更新(非同步)
        /// </summary>
        /// <param name="action"></param>
        public Task CommitDataAsync();
        #endregion
    }

}
