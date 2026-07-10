using WCMS.SysCore;
using WCMS.SysCore.FeatureDriver.Model;

namespace WCMS.SysCore.Interface;

/// <summary>
/// 表單 Graph 底層 CUD 會用到的 Repository 範圍。
/// </summary>
public interface IFormGraphRepoScope<TFormModel> where TFormModel : class
{
    #region Property
    /// <summary>
    /// 表單 Root DbModel 型別。
    /// </summary>
    Type RootDbModelType { get; }
    /// <summary>
    /// 表單 Root DbModel 的 Repository。
    /// </summary>
    object RootRepo { get; }
    /// <summary>
    /// Root Repository 使用的 DbContext。
    /// </summary>
    ApplicationDbContext DataAccess { get; }
    /// <summary>
    /// 表單 Graph 內 Root / Detail / SubDetail Repository 對照。
    /// </summary>
    IReadOnlyDictionary<string, object> GraphRepos { get; }
    #endregion

    #region Public
    /// <summary>
    /// 判斷 DB Model 是否屬於目前表單 Graph。
    /// </summary>
    bool ContainsRepo(Type dbModelType);
    /// <summary>
    /// 取得目前表單 Graph 內指定 DB Model 的 Repository。
    /// </summary>
    object GetRepo(Type dbModelType);
    /// <summary>
    /// 取得目前表單 Graph 內指定 DB Model 的 Repository。
    /// </summary>
    IBasicRepository<TDbModel> GetRepo<TDbModel>() where TDbModel : DbModel;
    #endregion
}
