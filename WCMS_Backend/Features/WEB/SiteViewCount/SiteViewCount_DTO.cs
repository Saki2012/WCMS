using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.SiteViewCount
{
    /// <summary>
    /// 網站瀏覽次數統計主集合
    /// </summary>
    [LibDesc(ModelDisplayName.SiteViewCountSet)]
    public class SiteViewCountSet_DTO : ITSet_DTO
    {
        public SiteViewCountHeaderModel_DTO SiteViewCountHeader { get; set; }
        public List<SiteViewCountDetailModel_DTO> SiteViewCountDetail { get; set; } = [];
        public List<SiteViewCountRecentlyModel_DTO> SiteViewCountRecently { get; set; } = [];
    }

    /// <summary>
    /// 站台瀏覽次數
    /// </summary>
    [LibDesc(ModelDisplayName.SiteViewCountHeader)]
    public class SiteViewCountHeaderModel_DTO : DTOBasicDataModel
    {
        [ForeignKey(nameof(SiteIndex))]
        public SiteMenu_Index_DTO? SiteMenu_Index { get; set; }

        [LibDesc(ModelDisplayName.SiteViewCount_SiteIndex)]
        [Key, StringLength(SysLengthParam.ID)]
        public string SiteIndex { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.SiteViewCount_PublicViewCount)]
        public int PublicViewCount { get; set; } = 0;

        #region 主子表關聯
        [InverseProperty(nameof(SiteViewCountDetailModel_DTO._SiteViewCountHeader))]
        public List<SiteViewCountDetailModel_DTO> _SiteViewCountDetail { get; set; } = [];
        #endregion
    }

    /// <summary>
    /// 頁面/公告/功能內容瀏覽次數
    /// </summary>
    [LibDesc(ModelDisplayName.SiteViewCountDetail)]
    public class SiteViewCountDetailModel_DTO : DetailRowModel
    {
        [ForeignKey(nameof(SiteIndex))]
        public SiteMenu_Index_DTO? SiteMenu_Index { get; set; }

        [LibDesc(ModelDisplayName.SiteViewCount_SiteIndex)]
        [Key, Required, StringLength(SysLengthParam.ID)]
        public string SiteIndex { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.SiteViewCount_ProgId)]
        [Key, Required, StringLength(SysLengthParam.ProgId)]
        public string ProgId { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.SiteViewCount_TargetInternalId)]
        [Key, Required, StringLength(SysLengthParam.InternalId)]
        public string TargetInternalId { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.SiteViewCount_PageViewCount)]
        public int PageViewCount { get; set; } = 0;

        [LibDesc(ModelDisplayName.SiteViewCount_FilePreviewCount)]
        public int FilePreviewCount { get; set; } = 0;

        [LibDesc(ModelDisplayName.SiteViewCount_FileDownloadCount)]
        public int FileDownloadCount { get; set; } = 0;

        [LibDesc(ModelDisplayName.SiteViewCount_LinkClickCount)]
        public int LinkClickCount { get; set; } = 0;

        #region 主子表關聯
        [ForeignKey(nameof(SiteIndex))]
        public SiteViewCountHeaderModel_DTO _SiteViewCountHeader { get; set; } = null!;
        #endregion
    }

    /// <summary>
    /// 最近計次紀錄(去重用)
    /// </summary>
    [LibDesc(ModelDisplayName.SiteViewCountRecently)]
    [Index(nameof(LastViewTime), Name = "IX_ViewCountRecently_LastViewTime")]
    public class SiteViewCountRecentlyModel_DTO : DetailRowModel
    {
        [ForeignKey(nameof(SiteIndex))]
        public SiteMenu_Index_DTO? SiteMenu_Index { get; set; }

        [LibDesc(ModelDisplayName.SiteViewCount_SiteIndex)]
        [Key, Required, StringLength(SysLengthParam.ID)]
        public string SiteIndex { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.SiteViewCount_ProgId)]
        [Key, Required, StringLength(SysLengthParam.ProgId)]
        public string ProgId { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.SiteViewCount_TargetInternalId)]
        [Key, Required, StringLength(SysLengthParam.InternalId)]
        public string TargetInternalId { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.SiteViewCount_TargetType)]
        [Key, Required, StringLength(SysLengthParam.Info)]
        public string TargetType { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.SiteViewCount_ActionType)]
        [Key]
        public ViewCountActionType ActionType { get; set; }

        [LibDesc(ModelDisplayName.SiteViewCount_VisitorKey)]
        [Key, Required, StringLength(SysLengthParam.FileSHA256)]
        public string VisitorKey { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.SiteViewCount_LastViewTime)]
        public DateTime LastViewTime { get; set; }

        [LibDesc(ModelDisplayName.SiteViewCount_RefererUrl)]
        [StringLength(SysLengthParam.Url)]
        public string RefererUrl { get; set; } = string.Empty;
    }

    #region API 請求/回應 DTO
    public class TryCountSiteViewRequest_DTO
    {
        public string SiteIndex { get; set; } = string.Empty;
    }

    public class TryCountDetailViewRequest_DTO
    {
        public string SiteIndex { get; set; } = string.Empty;
        public string ProgId { get; set; } = string.Empty;
        public string InternalId { get; set; } = string.Empty;
    }

    public class TryCountResult_DTO
    {
        public bool IsCounted { get; set; }
        public int CurrentCount { get; set; }
    }

    public class GetCurrentSiteOnlineCountRequest_DTO
    {
        public string SiteIndex { get; set; } = string.Empty;
        public int? Minutes { get; set; }
    }

    public class GetCurrentSiteOnlineCountResult_DTO
    {
        public string SiteIndex { get; set; } = string.Empty;
        public int Minutes { get; set; }
        public int CurrentOnlineCount { get; set; }
        public DateTime QueryTime { get; set; }
    }
    #endregion
}
