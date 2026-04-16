using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.SiteViewCount
{
    /// <summary>
    /// 網站瀏覽次數統計主集合
    /// </summary>
    public class SiteViewCountSet : ITSet
    {
        /// <summary>
        /// 站台瀏覽次數
        /// </summary>
        public SiteViewCountHeaderModel SiteViewCountHeader { get; set; }
        /// <summary>
        /// 單頁/單筆內容瀏覽次數
        /// </summary>
        public List<SiteViewCountDetailModel> SiteViewCountDetail { get; set; } = [];
        /// <summary>
        /// 最近計次紀錄(去重用)
        /// </summary>
        public List<SiteViewCountRecentlyModel> SiteViewCountRecently { get; set; } = [];
    }

    /// <summary>
    /// 站台瀏覽次數
    /// </summary>
    public class SiteViewCountHeaderModel : MasterDataModel
    {
        /// <summary>
        /// 站台代碼(主站可為空字串)
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string SiteIndex { get; set; } = string.Empty;
        /// <summary>
        /// 前台正式瀏覽次數
        /// </summary>
        public int PublicViewCount { get; set; } = 0;

        #region 主子表關聯
        /// <summary>
        /// 該站台底下所有 Detail 統計資料
        /// </summary>
        [InverseProperty(nameof(SiteViewCountDetailModel._SiteViewCountHeader))] public List<SiteViewCountDetailModel> _SiteViewCountDetail { get; set; } = [];
        #endregion
    }

    /// <summary>
    /// 頁面/公告/功能內容瀏覽次數
    /// </summary>
    public class SiteViewCountDetailModel : DetailRowModel
    {
        /// <summary>
        /// 站台代碼(主站可為空字串)
        /// </summary>
        [ForeignKey(nameof(SiteIndex))] public SiteMenu_IndexModel? SiteMenu_Index { get; set; }
        [Key, Required, StringLength(SysLengthParam.ID)] public string SiteIndex { get; set; } = string.Empty;
        /// <summary>
        /// 功能代碼(Announcement/PageManagement...)
        /// </summary>
        [Key, Required, StringLength(SysLengthParam.ProgId)] public string ProgId { get; set; } = string.Empty;
        /// <summary>
        /// 目標資料 InternalId
        /// </summary>
        [Key, Required, StringLength(SysLengthParam.InternalId)] public string TargetInternalId { get; set; } = string.Empty;
        /// <summary>
        /// 前台頁面瀏覽次數
        /// </summary>
        public int PageViewCount { get; set; } = 0;
        /// <summary>
        /// 檔案預覽次數(PDF/Office檔等內嵌預覽的次數)
        /// </summary>
        public int FilePreviewCount { get; set; } = 0;
        /// <summary>
        /// 檔案下載次數
        /// </summary>
        public int FileDownloadCount { get; set; } = 0;
        /// <summary>
        /// 連結點擊次數
        /// </summary>
        public int LinkClickCount { get; set; } = 0;

        #region 主子表關聯
        /// <summary>
        /// 對應站台 Header
        /// </summary>
        [ForeignKey(nameof(SiteIndex))] public SiteViewCountHeaderModel _SiteViewCountHeader { get; set; } = null!;
        #endregion
    }

    /// <summary>
    /// 最近計次紀錄(去重用)
    /// 注: 因 Header 跟 Detail 都有得紀錄，所以不做關聯，
    /// 直接獨立一張表來記錄最近的計次紀錄，定期清理過期紀錄即可
    /// </summary>
    [Index(nameof(LastViewTime), Name = "IX_ViewCountRecently_LastViewTime")]
    public class SiteViewCountRecentlyModel : DetailRowModel
    {
        /// <summary>
        /// 站台代碼(主站可為空字串)
        /// </summary>
        [ForeignKey(nameof(SiteIndex))] public SiteMenu_IndexModel? SiteMenu_Index { get; set; }
        [Key, Required, StringLength(SysLengthParam.ID)] public string SiteIndex { get; set; } = string.Empty;
        /// <summary>
        /// 功能代碼(Header 可為空字串)
        /// </summary>
        [Key, Required, StringLength(SysLengthParam.ProgId)] public string ProgId { get; set; } = string.Empty;
        /// <summary>
        /// 目標資料 InternalId(Header 可為空字串)
        /// </summary>
        [Key, Required, StringLength(SysLengthParam.InternalId)] public string TargetInternalId { get; set; } = string.Empty;
        /// <summary>
        /// 統計目標類型(Header/Detail)
        /// </summary>
        [Key, Required, StringLength(SysLengthParam.Info)] public string TargetType { get; set; } = string.Empty;
        /// <summary>
        /// 計次事件類型(PageView/FilePreview/FileDownload/LinkClick)
        /// </summary>
        [Key]public ViewCountActionType ActionType { get; set; }
        /// <summary>
        /// 訪客識別碼(建議放 hash 後結果)
        /// </summary>
        [Key, Required, StringLength(SysLengthParam.FileSHA256)] public string VisitorKey { get; set; } = string.Empty;
        /// <summary>
        /// 最後一次成功計次時間
        /// </summary>
        public DateTime LastViewTime { get; set; }
        /// <summary>
        /// 來源頁面網址(除錯/追蹤用)
        /// </summary>
        [StringLength(SysLengthParam.Url)] public string RefererUrl { get; set; } = string.Empty;
    }
}