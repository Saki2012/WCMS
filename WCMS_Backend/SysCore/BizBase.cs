using WCMS.Features.IAM.Auth;
using WCMS.SysCore.Interface;

namespace WCMS.SysCore;

/// <summary>
/// Biz 最底層基底，提供不綁定資料模型的共用服務。
/// </summary>
public abstract class BizBase(BizDeps bizDeps)
{
    #region Property
    /// <summary>
    /// Repository 對映提供者。
    /// </summary>
    protected IRepositoryMapProvider RepoMapProvider { get; } = bizDeps.repoMapProvider;

    /// <summary>
    /// 系統訊息容器。
    /// </summary>
    protected IErrorHelper Message { get; } = bizDeps.message;

    /// <summary>
    /// 目前使用者存取器。
    /// </summary>
    protected ICurrentUserAccessor Current { get; } = bizDeps.currentUser;

    /// <summary>
    /// 目前操作使用者。
    /// </summary>
    public User_DTO OperateUser { get; set; } = bizDeps.currentUser.User;
    #endregion
}
