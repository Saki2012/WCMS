namespace WCMS.SysCore.FeatureDriver.Api;

/// <summary>
/// 報表型 API 基底，僅約束查詢 DTO 與回傳 DTO，不綁定表單資料模型。
/// </summary>
/// <typeparam name="TRequest_DTO">報表查詢條件 DTO 型別。</typeparam>
/// <typeparam name="TResult_DTO">報表結果 DTO 型別。</typeparam>
public abstract class ApiRptController<TRequest_DTO, TResult_DTO> : ApiBaseController where TRequest_DTO : class where TResult_DTO : class
{
}
