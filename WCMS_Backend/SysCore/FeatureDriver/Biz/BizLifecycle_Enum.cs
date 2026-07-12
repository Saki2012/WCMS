using WCMS.SysCore.I18n.Metadata;

namespace WCMS.SysCore.FeatureDriver.Biz;

/// <summary>
/// 過帳狀態
/// </summary>
[LibDesc] public enum TransStatus : byte
{
    /// <summary>
    /// 無
    /// </summary>
    [LibDesc] None = 0,
    /// <summary>
    /// 正過帳
    /// </summary>
    [LibDesc] Increase = 1,
    /// <summary>
    /// 差異過帳
    /// </summary>
    [LibDesc] Difference = 2,
    /// <summary>
    /// 反過帳
    /// </summary>
    [LibDesc] Invert = 3,
}