using WCMS.SysCore.FeatureDriver.Model.Base;
namespace WCMS.SysCore.FeatureDriver.Model.Form;

/// <summary>
/// 組合式 Form Model 的 Root DbModel 存取契約。
/// </summary>
public interface IFormModel
{
    #region Public
    /// <summary>
    /// 取得目前表單的 Root DbModel。
    /// </summary>
    DbModel GetRootModel();
    /// <summary>
    /// 設定目前表單的 Root DbModel。
    /// </summary>
    void SetRootModel(DbModel rootModel);
    #endregion
}
/// <summary>
/// 指定 Root DbModel 型別的組合式 Form Model 契約。
/// </summary>
/// <typeparam name="TRootDbModel">Root DbModel 型別。</typeparam>
public interface IFormModel<TRootDbModel> : IFormModel where TRootDbModel : DbModel
{
    #region Public
    /// <summary>
    /// 取得強型別 Root DbModel。
    /// </summary>
    TRootDbModel GetRoot();
    /// <summary>
    /// 設定強型別 Root DbModel。
    /// </summary>
    void SetRoot(TRootDbModel rootModel);
    /// <summary>
    /// 取得目前表單的 Root DbModel。
    /// </summary>
    DbModel IFormModel.GetRootModel() => GetRoot();
    /// <summary>
    /// 設定目前表單的 Root DbModel。
    /// </summary>
    void IFormModel.SetRootModel(DbModel rootModel) => SetRoot((TRootDbModel)rootModel);
    #endregion
}
