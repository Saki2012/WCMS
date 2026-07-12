using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.Features.WEB.SiteViewCount;

/// <summary>
/// 前台瀏覽次數統計的行為類型
/// </summary>
[LibDesc(DisplayName.Enum_ViewCountActionType)]
public enum ViewCountActionType
{
    /// <summary>
    /// 頁面瀏覽
    /// </summary>
    [LibDesc(DisplayName.Enum_ViewCountActionType_PageView)] PageView = 1,
    /// <summary>
    /// 檔案預覽 (如PDF、圖片等，直接在瀏覽器開啟的檔案)
    /// </summary>
    [LibDesc(DisplayName.Enum_ViewCountActionType_FilePreview)] FilePreview = 2,
    /// <summary>
    /// 檔案下載
    /// </summary>
    [LibDesc(DisplayName.Enum_ViewCountActionType_FileDownload)] FileDownload = 3,
    /// <summary>
    /// 點擊連結
    /// </summary>
    [LibDesc(DisplayName.Enum_ViewCountActionType_LinkClick)] LinkClick = 4,
}