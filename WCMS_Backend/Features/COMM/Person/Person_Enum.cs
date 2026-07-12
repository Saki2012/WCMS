using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;

namespace WCMS.Features.COMM.Person;

/// <summary>
/// 性別
/// </summary>
[LibDesc(DisplayName.Enum_Gender)]
public enum Gender : byte
{
    /// <summary>
    /// 未知
    /// </summary>
    [LibDesc(DisplayName.Enum_Gender_NotKnown)] NotKnown = 0,
    /// <summary>
    /// 男性
    /// </summary>
    [LibDesc(DisplayName.Enum_Gender_Male)] Male = 1,
    /// <summary>
    /// 女性
    /// </summary>
    [LibDesc(DisplayName.Enum_Gender_Female)] Female = 2,
}
