namespace WCMS.SysCore.Interface;

/// <summary>
/// 建立表單 Graph Repository Scope 的提供者。
/// </summary>
public interface IFormGraphRepoProvider
{
    #region Public
    /// <summary>
    /// 取得指定 Form Model 的 Graph Repository Scope。
    /// </summary>
    IFormGraphRepoScope<TFormModel> GetScope<TFormModel>() where TFormModel : class;
    #endregion
}
