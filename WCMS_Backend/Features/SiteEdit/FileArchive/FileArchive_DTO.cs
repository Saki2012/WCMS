using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.FileArchive
{
    public class FileArchiveSet_DTO : ITSet_DTO
    {
        public FileArchive_DTO FileArchive { get; set; } = new();
        public List<FileArchiveInfo_DTO> FileArchiveInfo { get; set; } = [];
        public List<FileArchiveDetail_DTO> FileArchiveDetail { get; set; } = [];
        public List<FileArchiveUrlDetail_DTO> FileArchiveUrlDetail { get; set; } = [];
    }
    public class FileArchive_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchiveId)] public string? FileArchiveId { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ContentStatus)] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Category)] public string? CategoriesId { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        //[LibDesc(ModelDisplayName.Common_Tag)] public string? TagsId { get; set; }
        [LibDesc(ModelDisplayName.Spec1810_Tag)] public string? TagsId { get; set; }
        /// <summary>
        /// 下載次數
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchive_DownloadCount)]public int DownloadCount { get; set; }
        #region 主子表關聯
        public List<FileArchiveInfo_DTO>? _FileArchiveInfo { get; set; } = [];
        #endregion
    }
    public class FileArchiveInfo_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchiveId)] public string? FileArchiveId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public string? Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title)] public string? Title { get; set; }

        #region 主子表關聯
        public List<FileArchiveDetail_DTO> _FileArchiveDetail { get; set; } = [];
        public List<FileArchiveUrlDetail_DTO> _FileArchiveUrlDetail { get; set; } = [];
        #endregion
    }
    public class FileArchiveDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchiveId)] public string? FileArchiveId { get; set; }
        /// <summary>
        /// 父行主鍵 (_FileArchiveInfo)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ParentRowId)] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchive_FileSrcId)] public string? FileSrcId { get; set; }
        /// <summary>
        /// 檔案關聯資訊
        /// </summary>
        [ForeignKey(nameof(FileSrcId))]public FileManageModel_DTO? FileSrc { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchive_FileName)] public string? FileName { get; set; }
    }
    public class FileArchiveUrlDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchiveId)] public string? FileArchiveId { get; set; }
        /// <summary>
        /// 父行主鍵 (_FileArchiveInfo)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ParentRowId)] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Url)] public string? Url { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_UrlDescription)] public string? UrlDescription { get; set; }
        /// <summary>
        /// 開啟連結方式
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_WindowTarget)] public WindowTarget WindowTarget { get; set; }
    }
}
