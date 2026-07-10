using WCMS.SysCore.FeatureDriver.Model;

namespace WCMS.SysCore.Interface
{
    /// <summary>
    /// 依 DB Model 型別取得 Repository 的共用提供者。
    /// </summary>
    public interface IDbRepositoryProvider
    {
        #region Public
        /// <summary>
        /// 取得指定 DB Model 的 Repository。
        /// </summary>
        IBasicRepository<TDbModel> GetRepo<TDbModel>() where TDbModel : DbModel;
        /// <summary>
        /// 依型別取得指定 DB Model 的 Repository。
        /// </summary>
        object GetRepo(Type dbModelType);
        #endregion
    }
}
