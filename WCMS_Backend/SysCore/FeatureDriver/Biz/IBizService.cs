using WCMS.Features.IAM.Auth;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using static WCMS.SysCore.FeatureDriver.Model.Contracts.QueryListParam;
namespace WCMS.SysCore.FeatureDriver.Biz;

/// <summary>
/// Form Model 聚合模型的 Biz 服務契約。
/// </summary>
/// <typeparam name="TFormModel">表單模型聚合根型別。</typeparam>
public interface IBizService<TFormModel> where TFormModel : class
{
    #region Property
    /// <summary>
    /// 操作人員。
    /// </summary>
    public User_DTO OperateUser { get; set; }
    /// <summary>
    /// 功能Id。
    /// </summary>
    public string ProgId { get; }
    #endregion

    #region Public
    /// <summary>
    /// 新增 Form Model。
    /// </summary>
    public Task<TFormModel> BizCreateDataAsync(TFormModel data, CancellationToken ct = default);
    /// <summary>
    /// 初始化多筆 Form Model。
    /// </summary>
    public Task BizInitCreateDatasAsync(TFormModel[] datas, CancellationToken ct = default);
    /// <summary>
    /// 修改 Form Model。
    /// </summary>
    public Task<TFormModel> BizUpdateDataAsync(string internalId, TFormModel data, CancellationToken ct = default);
    /// <summary>
    /// 刪除 Form Model。
    /// </summary>
    public Task<TFormModel> BizDeleteDataAsync(string internalId, CancellationToken ct = default);
    /// <summary>
    /// 作廢 Form Model。
    /// </summary>
    public Task<TFormModel> BizInvalidDataAsync(string internalId, bool status, CancellationToken ct = default);
    /// <summary>
    /// 查詢單筆 Form Model。
    /// </summary>
    public Task<TFormModel> BizQueryDataAsync(string internalId, CancellationToken ct = default);
    /// <summary>
    /// 查詢 Form Model 清單。
    /// </summary>
    public Task<IList<TFormModel>> BizQueryListAsync(QueryListParam param, CancellationToken ct = default);
    /// <summary>
    /// 查詢 Form Model 清單。
    /// </summary>
    public Task<IList<TFormModel>> BizQueryListAsync(string[] selectFields, string condition, IReadOnlyList<OrderBySpec> orderBy, IReadOnlyList<RankGroupsSpec> rankGroups, int pageNumber, int pageSize, CancellationToken ct = default);
    /// <summary>
    /// 獲取清單總頁數。
    /// </summary>
    public Task<int> BizQueryTotalCounts(string condition, CancellationToken ct = default);
    /// <summary>
    /// 啟用交易控制。
    /// </summary>
    public Task<bool> TryBeginTransactionAsync();
    /// <summary>
    /// 回滾交易控制。
    /// </summary>
    public Task TryRollbackAsync(bool ownsTx);
    /// <summary>
    /// 提交交易控制。
    /// </summary>
    public Task TryCommitAsync(bool ownsTx);
    #endregion
}
