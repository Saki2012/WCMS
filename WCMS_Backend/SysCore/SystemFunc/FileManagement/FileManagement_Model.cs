using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.Features._Resx;
using WCMS.Features.IAM.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.FileManagement
{
    [LibDesc(ModelDisplayName.FileManageSet)]
    public class FileManageSet : ITSet
    {
        public FileManageModel FileManage { get; set; } = new();
        public List<FileManage_SyncInfoModel> FileManage_SyncInfo { get; set; } = [];
        public List<FileManage_DownloadRecentModel> FileManage_DownloadRecent { get; set; } = [];
    }

    /// <summary>
    /// 檔案管理
    /// </summary>
    [LibDesc(ModelDisplayName.FileManageModel)]
    [Index(nameof(FileSHA256))]
    public class FileManageModel : MasterDataModel
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [Key, StringLength(SysLengthParam.InternalId)]
        public new string InternalId { get; set; } = new Guid().ToString();

        /// <summary>
        /// 路徑
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_Path), StringLength(SysLengthParam.Path)]
        public string Path { get; set; }

        /// <summary>
        /// 檔案名稱
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_FileName), StringLength(SysLengthParam.FileName)]
        public string FileName { get; set; }

        /// <summary>
        /// 副檔名
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_FileExtension), StringLength(SysLengthParam.FileExt)]
        public string FileExtension { get; set; }

        /// <summary>
        /// 檔案描述
        /// (後續可透過帶出，其他表可修改對應的顯示說明)
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_FileDescription), StringLength(SysLengthParam.Memo)]
        public string FileDescription { get; set; } = string.Empty;

        /// <summary>
        /// 網際網路媒體型式
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_MimeType), StringLength(SysLengthParam.FileMineType)]
        public string MimeType { get; set; } = string.Empty;

        /// <summary>
        /// 檔案SHA256值
        /// 用來檢查Server是否已有該檔案，若有就不用再次上傳，但是要更新其他欄位
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_FileSHA256), StringLength(SysLengthParam.FileSHA256)]
        public string FileSHA256 { get; set; }

        /// <summary>
        /// 檔案大小
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_FileSize)]
        public long FileSize { get; set; }

        /// <summary>
        /// 功能Id
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_ProgId), StringLength(SysLengthParam.ProgId)]
        public string ProgId { get; set; }

        /// <summary>
        /// 匯入標籤
        /// (供初始化的，例如1810專案的檔案匯入)
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_ImportLabel), StringLength(SysLengthParam.ID)]
        public string ImportLabel { get; set; } = string.Empty;

        /// <summary>
        /// 檔案狀態
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_FileStatus)]
        public FileStatus FileStatus { get; set; }

        /// <summary>
        /// 前台網站下載次數
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_DownloadCount)]
        public int PublicDownloadCount { get; set; } = 0;

        /// <summary>
        /// 是否公開檔案
        /// </summary>
        [LibDesc(ModelDisplayName.FileManage_IsPublic)]
        public bool IsPublic { get; set; } = true;

        #region 主子表關聯
        [InverseProperty(nameof(FileManage_SyncInfoModel._FileManage))]
        public List<FileManage_SyncInfoModel> _FileManage_SyncInfo { get; set; }

        [InverseProperty(nameof(FileManage_DownloadRecentModel._FileManage))]
        public List<FileManage_DownloadRecentModel> _FileManage_DownloadRecent { get; set; } = [];
        #endregion

        #region 不需要的欄位
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)]
        public new FormStatus FormStatus { get; }

        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)]
        public new DataStatus DataStatus { get; }

        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)]
        public new DateTime? InvalidTime { get; }

        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)]
        public new string? InvalidUserId { get; }

        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)]
        public new AccountModel? InvalidUser { get; set; }
        #endregion
    }

    /// <summary>
    /// 檔案被下載資訊
    /// </summary>
    [LibDesc(ModelDisplayName.FileManageDownloadRecent)]
    [Index(nameof(InternalId), nameof(VisitorKey), IsUnique = true)]
    [Index(nameof(LastCountTime))]
    public class FileManage_DownloadRecentModel : DetailRowModel
    {
        [Key, StringLength(SysLengthParam.InternalId)]
        public string InternalId { get; set; } = string.Empty;

        [Key]
        public int? RowId { get; set; }

        [LibDesc(ModelDisplayName.FileManage_VisitorKey)]
        [Required, StringLength(SysLengthParam.InternalId)]
        public string VisitorKey { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_RefererUrl)]
        [StringLength(SysLengthParam.Url)]
        public string RefererURL { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_LastCountTime)]
        public DateTime LastCountTime { get; set; } = DateTime.UtcNow;

        #region 主子表關聯
        [ForeignKey(nameof(InternalId))]
        public FileManageModel _FileManage { get; set; } = null!;
        #endregion
    }

    /// <summary>
    /// 檔案同步資訊
    /// </summary>
    [LibDesc(ModelDisplayName.FileManageSyncInfo)]
    public class FileManage_SyncInfoModel : DetailRowModel
    {
        [Key, StringLength(SysLengthParam.InternalId)]
        public string InternalId { get; set; }

        [Key]
        public int? RowId { get; set; }

        [LibDesc(ModelDisplayName.FileManage_FileStatus)]
        public FileStatus FileStatus { get; set; } = FileStatus.None;

        [LibDesc(ModelDisplayName.FileManage_SrcIp), StringLength(SysLengthParam.IP)]
        public string SrcIP { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_SrcNode), StringLength(SysLengthParam.Name)]
        public string SrcNode { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_SrcFullPath), StringLength(SysLengthParam.Url)]
        public string SrcFullPath { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_DestIp), StringLength(SysLengthParam.IP)]
        public string DestIP { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_DestNode), StringLength(SysLengthParam.Name)]
        public string DestNode { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_DestFullPath), StringLength(SysLengthParam.Url)]
        public string DestFullPath { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_ErrorCode), StringLength(SysLengthParam.ID)]
        public string? ErrorCode { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_ErrorMessage), StringLength(SysLengthParam.CodeMessage)]
        public string? ErrorMessage { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_ExecuteTime)]
        public DateTime ExecuteTime { get; set; } = DateTime.UtcNow;

        #region 主子表關聯
        [ForeignKey(nameof(InternalId))]
        public FileManageModel _FileManage { get; set; } = null!;
        #endregion
    }

    /// <summary>
    /// 檔案被使用表
    /// </summary>
    [LibDesc(ModelDisplayName.FileManageUsed)]
    public class FileManage_UsedModel
    {
        [Key, StringLength(SysLengthParam.InternalId)]
        public string InternalId { get; set; }

        [Key]
        public int? RowId { get; set; }

        [LibDesc(ModelDisplayName.FileManage_TableName), StringLength(SysLengthParam.Name)]
        public string TableName { get; set; }

        [LibDesc(ModelDisplayName.FileManage_ColumnName), StringLength(SysLengthParam.Name)]
        public string ColumnName { get; set; }

        [LibDesc(ModelDisplayName.FileManage_CompositeKey), StringLength(SysLengthParam.Memo)]
        public string CompositeKey { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(InternalId))]
        public FileManageModel _FileManage { get; set; } = null!;
        #endregion
    }
}
