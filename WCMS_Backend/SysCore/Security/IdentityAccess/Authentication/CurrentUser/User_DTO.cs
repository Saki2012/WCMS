using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;

/// <summary>
/// 保存目前登入或系統操作使用者的最小必要資訊。
/// </summary>
public sealed class User_DTO
{
    #region Property
    /// <summary>
    /// 使用者編號。
    /// </summary>
    [LibDesc(DisplayName.User_UserID)]
    public string UserId { get; set; } = string.Empty;
    /// <summary>
    /// 使用者名稱。
    /// </summary>
    [LibDesc(DisplayName.User_UserName)]
    public string UserName { get; set; } = string.Empty;
    /// <summary>
    /// 帳號資料內部識別碼。
    /// </summary>
    [LibDesc(DisplayName.Common_InternalId)]
    public string InternalId { get; set; } = string.Empty;
    /// <summary>
    /// 帳戶目前啟用狀態。
    /// </summary>
    [LibDesc(DisplayName.Enum_AccountStatus)]
    public AccountStatus AccountStatus { get; set; }
    #endregion
}
