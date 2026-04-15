using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.Announcement
{
    /// <summary>
    /// 公告功能
    /// </summary>
    public class AnnouncementSet:ITSet
    {
        public Announcement Announcement { get; set; } = new Announcement();
        public List<AnnouncementDetail> AnnouncementDetail { get; set; } = [];
        public List<AnnouncementDetailFile> AnnouncementDetailFile { get; set; } = [];
    }
    /// <summary>
    /// 公告主表
    /// </summary>
    public class Announcement: MasterDataModel
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string? AnnouncementId { get; set; }
        /// <summary>
        /// 類別 (多個)
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string? Categories { get; set; } = string.Empty;
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string? Tags { get; set; } = string.Empty;
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 圖片 (關聯檔案資料)
        /// </summary>
        [StringLength(SysLengthParam.InternalId)] public string? PictureId { get; set; } = string.Empty;
        /// <summary>
        /// 圖片描述
        /// </summary>
        [StringLength(SysLengthParam.Memo)] public string? PicDescription { get; set; } = string.Empty;
        #region 主子表關聯
        [InverseProperty(nameof(AnnouncementDetail._Announcement))] public List<AnnouncementDetail> _AnnouncementDetail { get; set; }
        #endregion
    }
    /// <summary>
    /// 公告明細
    /// </summary>
    public class AnnouncementDetail : DetailRowModel
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string? AnnouncementId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [Key] public int? RowId { get; set; }
        /// <summary>
        /// 語系
        /// </summary>
        public LangCode? Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string? Title { get; set; }
        /// <summary>
        /// 副標題
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string? SubTitle { get; set; }
        /// <summary>
        /// 內文
        /// </summary>
        public string? Content { get; set; }
        /// <summary>
        /// 網址
        /// </summary>
        [StringLength(SysLengthParam.Url)] public string Url { get; set; } = string.Empty;
        [StringLength(SysLengthParam.Memo)] public string UrlDescription { get; set; } = string.Empty;
        #region 主子表關聯
        [ForeignKey(nameof(AnnouncementId))] public Announcement _Announcement { get; set; } = null!;
        [InverseProperty(nameof(AnnouncementDetailFile._AnnouncementDetail))] public List<AnnouncementDetailFile> _AnnouncementDetailFile { get; set; }
        #endregion
    }
    /// <summary>
    /// 明細檔案關聯
    /// </summary>
    public class AnnouncementDetailFile : DetailRowModel
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string AnnouncementId { get; set; }
        /// <summary>
        /// 父行代碼
        /// </summary>
        [Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [Key] public int RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [ForeignKey(nameof(FileId))] public FileManageModel? File { get; set; }
        [StringLength(SysLengthParam.InternalId)] public string FileId { get; set; }
        /// <summary>
        /// 檔案名稱
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string FileName { get; set; }
        #region 主子表關聯
        [ForeignKey($@"{nameof(AnnouncementId)},{nameof(ParentRowId)}")] public AnnouncementDetail _AnnouncementDetail { get; set; }
        #endregion
    }
}
