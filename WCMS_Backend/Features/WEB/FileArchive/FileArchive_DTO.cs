using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.FileArchive
{
    [LibDesc(ModelDisplayName.FileArchiveSet)] public class FileArchiveSet_DTO : ITSet_DTO
    {
        public FileArchive_DTO FileArchive { get; set; } = new();
        public List<FileArchiveInfo_DTO> FileArchiveInfo { get; set; } = [];
        [LibDesc(ModelDisplayName.FileArchiveDetail)] public List<FileArchiveDetail_DTO> FileArchiveDetail { get; set; } = [];
        [LibDesc(ModelDisplayName.FileArchiveUrlDetail)] public List<FileArchiveUrlDetail_DTO> FileArchiveUrlDetail { get; set; } = [];
    }
    public class FileArchive_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchiveId), StringLength(SysLengthParam.ID)] public string? FileArchiveId { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ContentStatus)] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Category), StringLength(SysLengthParam.Title)] public string? CategoriesId { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Tag), StringLength(SysLengthParam.Title)] public string? TagsId { get; set; }
        /// <summary>
        /// 資料有效日期-起
        /// </summary>
        [LibDesc(ModelDisplayName.Announcement_StartDate)] public DateTime? Validate_Start { get; set; }

        #region 主子表關聯
        public List<FileArchiveInfo_DTO>? _FileArchiveInfo { get; set; } = [];
        #endregion
    }
    public class FileArchiveInfo_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchiveId), StringLength(SysLengthParam.ID)] public string? FileArchiveId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Title)] public string? Title { get; set; }

        #region 主子表關聯
        public List<FileArchiveDetail_DTO> _FileArchiveDetail { get; set; } = [];
        public List<FileArchiveUrlDetail_DTO> _FileArchiveUrlDetail { get; set; } = [];
        #endregion
    }
    [LibDesc(ModelDisplayName.FileArchiveDetail)] public class FileArchiveDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchiveId), StringLength(SysLengthParam.ID)] public string? FileArchiveId { get; set; }
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
        [ForeignKey(nameof(FileSrcId))] public FileManageModel_DTO? FileSrc { get; set; }
        [LibDesc(ModelDisplayName.FileArchive_FileSrcId), StringLength(SysLengthParam.InternalId)] public string? FileSrcId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchive_FileName), StringLength(SysLengthParam.Title)] public string? FileName { get; set; }
    }
    [LibDesc(ModelDisplayName.FileArchiveUrlDetail)] public class FileArchiveUrlDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchiveId), StringLength(SysLengthParam.ID)] public string? FileArchiveId { get; set; }
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
        [LibDesc(ModelDisplayName.Common_Url), StringLength(SysLengthParam.Url)] public string? Url { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_UrlDescription), StringLength(SysLengthParam.Title)] public string? UrlDescription { get; set; }
        /// <summary>
        /// 開啟連結方式
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_WindowTarget)] public WindowTarget WindowTarget { get; set; }
    }
}
