using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.Features.WEB.Content;

/// 內文項目狀態
/// 目前提供至 公告/檔案室/網路資源/相簿 功能用到
/// </summary>
[Flags]
public enum ContentStatus : byte
{
    /// <summary>
    /// 無
    /// </summary>
    None = 0,
    /// <summary>
    /// 置頂
    /// </summary>
    [LibDesc(DisplayName.Enum_Top)] Top = 1 << 0,
    /// <summary>
    /// 熱門
    /// </summary>
    [LibDesc(DisplayName.Enum_Hot)] Hot = 1 << 1,
    /// <summary>
    /// 隱藏
    /// </summary>
    [LibDesc(DisplayName.Enum_Hidden)] Hidden = 1 << 2
}
/// <summary>
/// 
/// </summary>
public enum WindowTarget : byte
{
    [LibDesc(DisplayName.Enum_WindowTarget_Self)] Self = 0,   // _self (當前頁面)
    [LibDesc(DisplayName.Enum_WindowTarget_Blank)] Blank = 1,  // _blank (新開分頁/視窗)
                                                               //Parent = 2, // _parent (父層框架)
                                                               //Top = 3,    // _top (最上層框架)
                                                               //Named = 4   // 自訂視窗名稱
}