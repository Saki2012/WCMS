using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.SystemSetting.SiteInfo.SiteMenuSetting;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SystemSetting.SiteInfo.SiteViewCount
{
    /// <summary>
    /// 網站瀏覽次數統計主集合
    /// </summary>
    public class SiteViewCountSet_DTO : ITSet_DTO
    {
        /// <summary>
        /// 站台瀏覽次數
        /// </summary>
        public SiteViewCountHeaderModel_DTO SiteViewCountHeader { get; set; }
        /// <summary>
        /// 單頁/單筆內容瀏覽次數
        /// </summary>
        public List<SiteViewCountDetailModel_DTO> SiteViewCountDetail { get; set; } = [];
        /// <summary>
        /// 最近計次紀錄(去重用)
        /// </summary>
        public List<SiteViewCountRecentlyModel_DTO> SiteViewCountRecently { get; set; } = [];
    }

    /// <summary>
    /// 站台瀏覽次數
    /// </summary>
    public class SiteViewCountHeaderModel_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 站台代碼(主站可為空字串)
        /// </summary>
        [ForeignKey(nameof(SiteIndex))] public SiteMenu_Index_DTO? SiteMenu_Index { get; set; }
        [Key, StringLength(SysLengthParam.ID)] public string SiteIndex { get; set; } = string.Empty;
        /// <summary>
        /// 前台正式瀏覽次數
        /// </summary>
        public int PublicViewCount { get; set; } = 0;

        #region 主子表關聯
        /// <summary>
        /// 該站台底下所有 Detail 統計資料
        /// </summary>
        [InverseProperty(nameof(SiteViewCountDetailModel_DTO._SiteViewCountHeader))] public List<SiteViewCountDetailModel_DTO> _SiteViewCountDetail { get; set; } = [];
        #endregion
    }

    /// <summary>
    /// 頁面/公告/功能內容瀏覽次數
    /// </summary>
    public class SiteViewCountDetailModel_DTO : DetailRowModel
    {
        /// <summary>
        /// 站台代碼(主站可為空字串)
        /// </summary>
        [ForeignKey(nameof(SiteIndex))] public SiteMenu_Index_DTO? SiteMenu_Index { get; set; }
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
        [ForeignKey(nameof(SiteIndex))] public SiteViewCountHeaderModel_DTO _SiteViewCountHeader { get; set; } = null!;
        #endregion
    }

    /// <summary>
    /// 最近計次紀錄(去重用)
    /// 注: 因 Header 跟 Detail 都有得紀錄，所以不做關聯，
    /// 直接獨立一張表來記錄最近的計次紀錄，定期清理過期紀錄即可
    /// </summary>
    [Index(nameof(LastViewTime), Name = "IX_ViewCountRecently_LastViewTime")]
    public class SiteViewCountRecentlyModel_DTO : DetailRowModel
    {
        /// <summary>
        /// 站台代碼(主站可為空字串)
        /// </summary>
        [ForeignKey(nameof(SiteIndex))] public SiteMenu_Index_DTO? SiteMenu_Index { get; set; }
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
        [Key] public ViewCountActionType ActionType { get; set; }
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



    #region API 請求/回應 DTO
    /// <summary>
    /// 主站瀏覽次數請求
    /// </summary>
    public class TryCountSiteViewRequest_DTO
    {
        /// <summary>
        /// 站台代碼(主站可為空字串)
        /// </summary>
        public string SiteIndex { get; set; } = string.Empty;
    }
    /// <summary>
    /// 功能/頁面計次請求
    /// </summary>
    public class TryCountDetailViewRequest_DTO
    {
        /// <summary>
        /// 站台代碼(主站可為空字串)
        /// </summary>
        public string SiteIndex { get; set; } = string.Empty;
        /// <summary>
        /// 功能代碼
        /// </summary>
        public string ProgId { get; set; } = string.Empty;
        /// <summary>
        /// 目標資料 InternalId
        /// </summary>
        public string InternalId { get; set; } = string.Empty;
    }
    /// <summary>
    /// 回應嘗試累加瀏覽次數結果的 DTO
    /// </summary>
    public class TryCountResult_DTO
    {
        /// <summary>
        /// 本次是否實際累加
        /// </summary>
        public bool IsCounted { get; set; }
        /// <summary>
        /// 最新總數
        /// </summary>
        public int CurrentCount { get; set; }
    }
    #endregion
}
