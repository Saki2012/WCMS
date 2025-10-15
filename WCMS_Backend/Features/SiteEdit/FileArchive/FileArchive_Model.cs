using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.Banner;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.Features.SystemSetting.SiteInfo.SiteMenuSetting.ModuleOptions;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.FileArchive
{
    public class FileArchiveSet:ITSet
    {
        public FileArchive FileArchive { get; set; } = new FileArchive();
        public List<FileArchiveInfo> FileArchiveInfo { get; set; } = [];
        public List<FileArchiveDetail> FileArchiveDetail { get; set; } = [];
    }
    public class FileArchive : MasterDataModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [Required, Key, StringLength(SysLengthParam.ID)] public string FileArchiveId { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [Required, StringLength(SysLengthParam.Title)] public string CategoriesId { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [Required, StringLength(SysLengthParam.Title)] public string TagsId { get; set; }
        /// <summary>
        /// 下載次數
        /// </summary>
        public int DownloadCount { get; set; }

        #region 主子表關聯
        [InverseProperty(nameof(FileArchiveInfo._FileArchive))] public List<FileArchiveInfo> _FileArchiveInfo { get; set; }
        #endregion
    }
    public class FileArchiveInfo : DetailRowModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [Required, Key, StringLength(SysLengthParam.ID)] public string FileArchiveId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.Lang)] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string Title { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(FileArchiveId))] public FileArchive _FileArchive { get; set; }
        [InverseProperty(nameof(FileArchiveDetail._FileArchiveInfo))] public List<FileArchiveDetail> _FileArchiveDetail { get; set; }
        #endregion
    }
    public class FileArchiveDetail : DetailRowModel
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [Required, Key, StringLength(SysLengthParam.ID)] public string FileArchiveId { get; set; }
        /// <summary>
        /// 父行主鍵 (_FileArchiveInfo)
        /// </summary>
        [Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [Key] public int RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.InternalId)] public string FileSrcId { get; set; }
        [ForeignKey(nameof(FileSrcId))] public FileManageModel FileSrc { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.Title)] public string FileName { get; set; }

        [ForeignKey($@"{nameof(FileArchiveId)},{nameof(ParentRowId)}")] public FileArchiveInfo _FileArchiveInfo { get; set; }
    }
}
