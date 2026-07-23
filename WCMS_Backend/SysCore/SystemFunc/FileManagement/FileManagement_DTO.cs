using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.FileManagement
{
    [LibDesc(ModelDisplayName.FileManageSet)]
    public class FileManageSet_DTO : ITSet_DTO
    {
        public FileManageModel_DTO? FileManage { get; set; } = new();
        public List<FileManage_DownloadRecentModel_DTO>? FileManage_DownloadRecent { get; set; } = [];
        public List<FileManage_SyncInfoModel_DTO>? FileManage_SyncInfo { get; set; } = [];
    }

    /// <summary>
    /// 檔案管理
    /// </summary>
    [LibDesc(ModelDisplayName.FileManageModel)]
    public class FileManageModel_DTO : DTOBasicDataModel
    {
        [LibDesc(ModelDisplayName.FileManage_Path)]
        public string? Path { get; set; }

        [LibDesc(ModelDisplayName.FileManage_FileName), StringLength(SysLengthParam.FileName)]
        public string? FileName { get; set; }

        [LibDesc(ModelDisplayName.FileManage_FileExtension), StringLength(SysLengthParam.FileExt)]
        public string? FileExtension { get; set; }

        [LibDesc(ModelDisplayName.FileManage_FileDescription)]
        public string? FileDescription { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_MimeType), StringLength(SysLengthParam.FileMineType)]
        public string? MimeType { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_FileSHA256), StringLength(SysLengthParam.FileSHA256)]
        public string? FileSHA256 { get; set; }

        [LibDesc(ModelDisplayName.FileManage_FileSize)]
        public long? FileSize { get; set; }

        [LibDesc(ModelDisplayName.FileManage_ProgId)]
        public string? ProgId { get; set; }

        [LibDesc(ModelDisplayName.FileManage_ImportLabel)]
        public string? ImportLabel { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_FileStatus)]
        public FileStatus? FileStatus { get; set; }

        [LibDesc(ModelDisplayName.FileManage_DownloadCount)]
        public int PublicDownloadCount { get; set; } = 0;

        [LibDesc(ModelDisplayName.FileManage_IsPublic)]
        public bool IsPublic { get; set; } = true;

        #region 主子表關聯
        public List<FileManage_DownloadRecentModel_DTO>? _FileManage_DownloadRecent { get; set; } = [];
        public List<FileManage_SyncInfoModel_DTO>? _FileManage_SyncInfo { get; set; }
        #endregion
    }

    [LibDesc(ModelDisplayName.FileManageDownloadRecent)]
    public class FileManage_DownloadRecentModel_DTO
    {
        [Key]
        public string? InternalId { get; set; }

        [Key]
        public int? RowId { get; set; }

        [LibDesc(ModelDisplayName.FileManage_VisitorKey)]
        public string? VisitorKey { get; set; }

        [LibDesc(ModelDisplayName.FileManage_RefererUrl)]
        public string? RefererURL { get; set; }

        [LibDesc(ModelDisplayName.FileManage_LastCountTime)]
        public DateTime? LastCountTime { get; set; }

        #region 主子表關聯
        public FileManageModel_DTO? _FileManage { get; set; } = null!;
        #endregion
    }

    [LibDesc(ModelDisplayName.FileManageSyncInfo)]
    public class FileManage_SyncInfoModel_DTO
    {
        [Key]
        public string? InternalId { get; set; }

        [Key]
        public int? RowId { get; set; }

        [LibDesc(ModelDisplayName.FileManage_FileStatus)]
        public FileStatus FileStatus { get; set; } = FileStatus.None;

        [LibDesc(ModelDisplayName.FileManage_SrcIp)]
        public string? SrcIP { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_SrcNode)]
        public string? SrcNode { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_SrcFullPath)]
        public string? SrcFullPath { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_DestIp)]
        public string? DestIP { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_DestNode)]
        public string? DestNode { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_DestFullPath)]
        public string? DestFullPath { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_ErrorCode)]
        public string? ErrorCode { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_ErrorMessage)]
        public string? ErrorMessage { get; set; } = string.Empty;

        [LibDesc(ModelDisplayName.FileManage_ExecuteTime)]
        public DateTime? ExecuteTime { get; set; } = DateTime.UtcNow;

        #region 主子表關聯
        public FileManageModel_DTO? _FileManage { get; set; } = null!;
        #endregion
    }

    [LibDesc(ModelDisplayName.FileManageUsed)]
    public class FileManage_UsedModel_DTO
    {
        [Key]
        public string? InternalId { get; set; }

        [Key]
        public int? RowId { get; set; }

        [LibDesc(ModelDisplayName.FileManage_TableName)]
        public string? TableName { get; set; }

        [LibDesc(ModelDisplayName.FileManage_ColumnName)]
        public string? ColumnName { get; set; }

        [LibDesc(ModelDisplayName.FileManage_CompositeKey)]
        public string? CompositeKey { get; set; }

        #region 主子表關聯
        public FileManageModel_DTO? _FileManage { get; set; } = null!;
        #endregion
    }
}
