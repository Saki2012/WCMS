using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.SysCore.Security.IdentityAccess;

/// <summary>
/// 表示 WCMS 帳戶是否允許登入。
/// </summary>
[LibDesc(DisplayName.Enum_AccountStatus)]
public enum AccountStatus : byte
{
    /// <summary>
    /// 停用帳戶。
    /// </summary>
    [LibDesc(DisplayName.Enum_AccountStatus_Unable)]
    Unable = 0,
    /// <summary>
    /// 啟用帳戶。
    /// </summary>
    [LibDesc(DisplayName.Enum_AccountStatus_Enable)]
    Enable = 1,
}
