using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;

namespace WCMS.Features.IAM.Account;

/// <summary>
/// 帳戶狀態
/// </summary>
[LibDesc(DisplayName.Enum_AccountStatus)]
public enum AccountStatus : byte
{
    /// <summary>
    /// 停用
    /// </summary>
    [LibDesc(DisplayName.Enum_AccountStatus_Unable)] Unable = 0,
    /// <summary>
    /// 啟用
    /// </summary>
    [LibDesc(DisplayName.Enum_AccountStatus_Enable)] Enable = 1,
}
