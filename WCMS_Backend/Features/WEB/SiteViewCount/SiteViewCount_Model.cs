using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
namespace WCMS.Features.WEB.SiteViewCount;

/// 站台瀏覽次數
/// </summary>
public class SiteViewCountHeaderModel : HeaderModel
{
    /// <summary>
    /// 站台代碼(主站可為空字串)
    /// </summary>
    [ForeignKey(nameof(SiteIndex))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SiteMenu_IndexModel? SiteMenu_Index { get; set; }
    [Key, StringLength(DbStrLen.ID)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// 前台正式瀏覽次數
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int PublicViewCount { get; set; } = 0;

    #region 主子表關聯
    /// <summary>
    /// 該站台底下所有 Detail 統計資料
    /// </summary>
    [InverseProperty(nameof(SiteViewCountDetailModel._SiteViewCountHeader))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SiteViewCountDetailModel> _SiteViewCountDetail { get; set; } = [];
    #endregion
}
/// <summary>
/// 頁面/公告/功能內容瀏覽次數
/// </summary>
public class SiteViewCountDetailModel : DetailModel
{
    /// <summary>
    /// 站台代碼(主站可為空字串)
    /// </summary>
    [ForeignKey(nameof(SiteIndex))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SiteMenu_IndexModel? SiteMenu_Index { get; set; }
    [Key, Required, StringLength(DbStrLen.ID)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// 功能代碼(Announcement/PageManagement...)
    /// </summary>
    [Key, Required, StringLength(DbStrLen.ProgId)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string ProgId { get; set; } = string.Empty;
    /// <summary>
    /// 目標資料 InternalId
    /// </summary>
    [Key, Required, StringLength(DbStrLen.InternalId)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string TargetInternalId { get; set; } = string.Empty;
    /// <summary>
    /// 前台頁面瀏覽次數
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int PageViewCount { get; set; } = 0;
    /// <summary>
    /// 檔案預覽次數(PDF/Office檔等內嵌預覽的次數)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int FilePreviewCount { get; set; } = 0;
    /// <summary>
    /// 檔案下載次數
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int FileDownloadCount { get; set; } = 0;
    /// <summary>
    /// 連結點擊次數
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public int LinkClickCount { get; set; } = 0;

    #region 主子表關聯
    /// <summary>
    /// 對應站台 Header
    /// </summary>
    [ForeignKey(nameof(SiteIndex))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SiteViewCountHeaderModel _SiteViewCountHeader { get; set; } = null!;
    #endregion
}
/// <summary>
/// 最近計次紀錄(去重用)
/// 注: 因 Header 跟 Detail 都有得紀錄，所以不做關聯，
/// 直接獨立一張表來記錄最近的計次紀錄，定期清理過期紀錄即可
/// </summary>
[Index(nameof(LastViewTime), Name = "IX_ViewCountRecently_LastViewTime")]
public class SiteViewCountRecentlyModel : DetailModel
{
    /// <summary>
    /// 站台代碼(主站可為空字串)
    /// </summary>
    [ForeignKey(nameof(SiteIndex))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SiteMenu_IndexModel? SiteMenu_Index { get; set; }
    [Key, Required, StringLength(DbStrLen.ID)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string SiteIndex { get; set; } = string.Empty;
    /// <summary>
    /// 功能代碼(Header 可為空字串)
    /// </summary>
    [Key, Required, StringLength(DbStrLen.ProgId)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string ProgId { get; set; } = string.Empty;
    /// <summary>
    /// 目標資料 InternalId(Header 可為空字串)
    /// </summary>
    [Key, Required, StringLength(DbStrLen.InternalId)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string TargetInternalId { get; set; } = string.Empty;
    /// <summary>
    /// 統計目標類型(Header/Detail)
    /// </summary>
    [Key, Required, StringLength(DbStrLen.Info)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string TargetType { get; set; } = string.Empty;
    /// <summary>
    /// 計次事件類型(PageView/FilePreview/FileDownload/LinkClick)
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly)]
    public ViewCountActionType ActionType { get; set; }
    /// <summary>
    /// 訪客識別碼(建議放 hash 後結果)
    /// </summary>
    [Key, Required, StringLength(DbStrLen.FileSHA256)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string VisitorKey { get; set; } = string.Empty;
    /// <summary>
    /// 最後一次成功計次時間
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public DateTime LastViewTime { get; set; }
    /// <summary>
    /// 來源頁面網址(除錯/追蹤用)
    /// </summary>
    [StringLength(DbStrLen.Url)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string RefererUrl { get; set; } = string.Empty;
}
