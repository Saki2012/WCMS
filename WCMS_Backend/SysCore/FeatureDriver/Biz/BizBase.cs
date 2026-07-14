using WCMS.Features.IAM.Auth;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.FeatureDriver.Model.MetaData;
using WCMS.SysCore.FeatureDriver.Repo;
using WCMS.SysCore.Interface;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
namespace WCMS.SysCore.FeatureDriver.Biz;

/// <summary>
/// Biz服務所需注入參數
/// </summary>
/// <param name="dbRepositoryProvider">全 DB Model Repository 提供者。</param>
/// <param name="formGraphRepoProvider">表單 Graph Repository Scope 提供者。</param>
/// <param name="message">系統訊息容器。</param>
/// <param name="currentUser">目前使用者存取器。</param>
/// <param name="propertyAccessorCache">動態物件存取 Cache。</param>
/// <param name="modelMetadataCache">Model Reflection Metadata Cache。</param>
/// <param name="i18nCache">多語系顯示文字 Cache。</param>
public sealed record BizDeps(DbRepositoryProvider dbRepositoryProvider, FormGraphRepoProvider formGraphRepoProvider, IErrorHelper message, ICurrentUserAccessor currentUser, PropertyAccessorCache propertyAccessorCache, ModelTypeMetadataCache modelMetadataCache, I18nCache i18nCache);

/// <summary>
/// Biz 最底層基底，提供不綁定資料模型的共用服務。
/// </summary>
public abstract class BizBase(BizDeps bizDeps)
{
    #region Property
    /// <summary>
    /// 全 DB Model Repository 提供者。
    /// </summary>
    protected DbRepositoryProvider DbRepositoryProvider { get; } = bizDeps.dbRepositoryProvider;
    /// <summary>
    /// 表單 Graph Repository Scope 提供者。
    /// </summary>
    protected FormGraphRepoProvider FormGraphRepoProvider { get; } = bizDeps.formGraphRepoProvider;
    /// <summary>
    /// 系統訊息容器。
    /// </summary>
    protected IErrorHelper Message { get; } = bizDeps.message;
    /// <summary>
    /// 目前使用者存取器。
    /// </summary>
    protected ICurrentUserAccessor Current { get; } = bizDeps.currentUser;
    /// <summary>
    /// 動態物件存取 Cache。
    /// </summary>
    protected PropertyAccessorCache PropertyAccessor { get; } = bizDeps.propertyAccessorCache;
    /// <summary>
    /// Model Reflection Metadata Cache。
    /// </summary>
    protected ModelTypeMetadataCache ModelMetadata { get; } = bizDeps.modelMetadataCache;
    /// <summary>
    /// 多語系顯示文字 Cache。
    /// </summary>
    protected I18nCache I18n { get; } = bizDeps.i18nCache;
    /// <summary>
    /// 目前操作使用者。
    /// </summary>
    public User_DTO OperateUser { get; set; } = bizDeps.currentUser.User;
    #endregion
}
