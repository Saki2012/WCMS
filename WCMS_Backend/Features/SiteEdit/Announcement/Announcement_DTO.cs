using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.Announcement
{
    /// <summary>
    /// 公告功能
    /// </summary>
    [LibDesc]
    public class AnnouncementSet_DTO : ITSet_DTO
    {
        [LibDesc] public Announcement_DTO Announcement { get; set; } = new();
        [LibDesc] public List<AnnouncementDetail_DTO> AnnouncementDetail { get; set; } = [];
        [LibDesc] public List<AnnouncementDetailFile_DTO> AnnouncementDetailFile { get; set; } = [];
    }
    /// <summary>
    /// 公告主表
    /// </summary>
    [LibDesc]
    public class Announcement_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [LibDesc(ModelDisplayName.AnnouncementId)] public string? AnnouncementId { get; set; }
        /// <summary>
        /// 類別 (多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Category)] public string? Categories { get; set; } = string.Empty;
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Tag)] public string? Tags { get; set; } = string.Empty;
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ContentStatus)] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 圖片 (關聯檔案資料)
        /// </summary>
        [LibDesc(ModelDisplayName.Announcement_CoverPictureId)] public string? PictureId { get; set; } = string.Empty;
        /// <summary>
        /// 圖片描述
        /// </summary>
        [LibDesc(ModelDisplayName.Announcement_PicDescription)] public string? PicDescription { get; set; } = string.Empty;
        /// <summary>
        /// 觀看次數
        /// </summary>
        [LibDesc(ModelDisplayName.Announcement_ViewCount)] public int? ViewCount { get; set; } = 0;
        /// <summary>
        /// 資料有效日期-起
        /// </summary>
        [LibDesc(ModelDisplayName.Announcement_StartDate)] public DateTime? Validate_Start { get; set; }
        /// <summary>
        /// 資料有效日期-迄
        /// </summary>
        [LibDesc(ModelDisplayName.Announcement_EndDate)] public DateTime? Validate_End { get; set; }

        #region 主子表關聯
        public List<AnnouncementDetail_DTO>? _AnnouncementDetail { get; set; }
        #endregion
    }
    /// <summary>
    /// 公告明細
    /// </summary>
    [LibDesc]
    public class AnnouncementDetail_DTO
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [LibDesc(ModelDisplayName.AnnouncementId)] public string? AnnouncementId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }
        /// <summary>
        /// 語系
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public string? Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title)] public string? Title { get; set; }
        /// <summary>
        /// 副標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_SubTitle)] public string? SubTitle { get; set; }
        /// <summary>
        /// 內文
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Content)] public string? Content { get; set; }
        /// <summary>
        /// 網址
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Url)] public string? Url { get; set; }
        /// <summary>
        /// 網址描述
        /// </summary>
        [LibDesc(ModelDisplayName.Common_UrlDescription)] public string? UrlDescription { get; set; }
    }
    /// <summary>
    /// 明細檔案關聯
    /// </summary>
    [LibDesc]
    public class AnnouncementDetailFile_DTO
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [LibDesc(ModelDisplayName.AnnouncementId)] public string? AnnouncementId { get; set; }
        /// <summary>
        /// 父行代碼
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ParentRowId)] public int ParentRowId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [LibDesc(ModelDisplayName.Announcement_FileId)] public string? FileId { get; set; }
        /// <summary>
        /// 檔案名稱
        /// </summary>
        [LibDesc(ModelDisplayName.Announcement_FileName)] public string? FileName { get; set; }
    }
}
