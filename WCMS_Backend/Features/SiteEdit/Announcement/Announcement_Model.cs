using static WCMS.SysCore.Enum.SysEnum;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using System.Security.AccessControl;
using WCMS.SysCore.Model;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.Announcement
{
    /// <summary>
    /// 公告功能
    /// </summary>
    [LibDesc] public class AnnouncementSet
    {
        [LibDesc] public Announcement Announcement { get; set; } = new Announcement();
        [LibDesc] public List<AnnouncementDetail> AnnouncementDetail { get; set; } = [];
        [LibDesc] public List<AnnouncementDetailFile> AnnouncementDetailFile { get; set; } = [];
    }
    /// <summary>
    /// 公告主表
    /// </summary>
    [LibDesc] public class Announcement: MasterDataModel
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [LibDesc, Key] public string AnnouncementId { get; set; }
        /// <summary>
        /// 類別 (多個)
        /// </summary>
        [LibDesc] public string? Categories { get; set; } = string.Empty;
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [LibDesc] public string? Tags { get; set; } = string.Empty;
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        [LibDesc] public string? Statuses { get; set; } = string.Empty;
        /// <summary>
        /// 圖片 (關聯檔案資料)
        /// </summary>
        [LibDesc] public string? PictureId { get; set; } = string.Empty;
        /// <summary>
        /// 圖片描述
        /// </summary>
        [LibDesc] public string? PicDescription { get; set; } = string.Empty;
        /// <summary>
        /// 觀看次數
        /// </summary>
        [LibDesc] public int? ViewCount { get; set; } = 0;
    }
    /// <summary>
    /// 公告明細
    /// </summary>
    [LibDesc] public class AnnouncementDetail : DetailRowModel
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [LibDesc, Key] public string AnnouncementId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 語系
        /// </summary>
        [LibDesc] public string? Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc] public string? Title { get; set; }
        /// <summary>
        /// 副標題
        /// </summary>
        [LibDesc] public string? SubTitle { get; set; }
        /// <summary>
        /// 內文
        /// </summary>
        [LibDesc] public string? Content { get; set; }
        /// <summary>
        /// 網址
        /// </summary>
        [LibDesc] public string? Url { get; set; }
    }
    /// <summary>
    /// 明細檔案關聯
    /// </summary>
    /*(感覺可以直接做到主表就好)*/
    [LibDesc] public class AnnouncementDetailFile : DetailRowModel
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [LibDesc, Key] public string AnnouncementId { get; set; }
        /// <summary>
        /// 父行代碼 - (AnnouncementDetail)
        /// </summary>
        [LibDesc, Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [LibDesc] public string FileId { get; set; }
    }
}
