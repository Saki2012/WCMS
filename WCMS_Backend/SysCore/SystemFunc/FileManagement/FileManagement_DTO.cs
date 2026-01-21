using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.FileManagement
{

    public class FileManageSet_DTO : ITSet_DTO
    {
        public FileManageModel_DTO? FileManage { get; set; } = new();
        public List<FileManage_DownloadInfoModel_DTO>? FileManage_DownloadInfo { get; set; } = [];
        public List<FileManage_SyncInfoModel_DTO>? FileManage_SyncInfo { get; set; } = [];
    }
    /// <summary>
    /// 檔案管理
    /// </summary>
    public class FileManageModel_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 路徑
        /// </summary>
        [LibDesc] public string? Path { get; set; }
        /// <summary>
        /// 檔案名稱
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.FileName)] public string? FileName { get; set; }
        /// <summary>
        /// 副檔名
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.FileExt)] public string? FileExtension { get; set; }
        /// <summary>
        /// 檔案描述
        /// (後續可透過帶出，其他表可修改對應的顯示說明)
        /// </summary>
        [LibDesc] public string? FileDescription { get; set; } = string.Empty;
        /// <summary>
        /// 網際網路媒體型式
        /// </summary>
        [LibDesc,StringLength(SysLengthParam.FileMineType)] public string? MimeType { get; set; } = string.Empty;
        /// <summary>
        /// 檔案SHA256值 
        /// 用來檢查Server是否已有該檔案，若有就不用再次上傳，但是要更新其他欄位
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.FileSHA256)] public string? FileSHA256 { get; set; }
        /// <summary>
        /// 檔案大小
        /// </summary>
        [LibDesc] public long? FileSize { get; set; }
        /// <summary>
        /// 功能Id
        /// </summary>
        [LibDesc] public string? ProgId { get; set; }
        /// <summary>
        /// 匯入標籤(
        /// (供初始化的，例如1810專案的檔案匯入，資料夾就為1810(ImportLabel名就為1810)，底下結構不變的紀錄至Path)
        /// </summary>
        [LibDesc] public string? ImportLabel { get; set; } = string.Empty;
        /// <summary>
        /// 檔案狀態
        /// </summary>
        [LibDesc] public FileStatus? FileStatus { get; set; }
        /// <summary>
        /// 下載次數
        /// </summary>
        [LibDesc, NotMapped] public int? DownloadCount { get; }

        #region 主子表關聯
        public List<FileManage_DownloadInfoModel_DTO>? _FileManage_DownloadInfo { get; set; } = [];
        public List<FileManage_SyncInfoModel_DTO>? _FileManage_SyncInfo { get; set; }
        #endregion
    }
    /// <summary>
    /// 檔案被下載資訊
    /// </summary>
    public class FileManage_DownloadInfoModel_DTO
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc, Key] public string? InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc, Key] public int? RowId { get; set; }
        /// <summary>
        /// 下載者IP
        /// </summary>
        [LibDesc] public string? DownloadUserIP { get; set; }
        /// <summary>
        /// 使用裝置
        /// </summary>
        [LibDesc] public string? UserAgent { get; set; }
        /// <summary>
        /// 下載來源
        /// </summary>
        [LibDesc] public string? RefererURL { get; set; }
        /// <summary>
        /// 下載狀態 (成功/失敗)
        /// </summary>
        [LibDesc] public string? DownloadStatus { get; set; }
        /// <summary>
        /// 下載時間
        /// </summary>
        [LibDesc] public DateTime? DownloadTime { get; set; }

        #region 主子表關聯
        public FileManageModel_DTO? _FileManage { get; set; } = null!;
        #endregion
    }
    /// <summary>
    /// 檔案同步資訊
    /// </summary>
    public class FileManage_SyncInfoModel_DTO
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc, Key] public string? InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc, Key] public int? RowId { get; set; }
        /// <summary>
        /// 同步狀態
        /// </summary>
        public FileStatus FileStatus { get; set; } = FileStatus.None;
        /// <summary>
        /// 來源IP
        /// </summary>
        public string? SrcIP { get; set; } = string.Empty;
        /// <summary>
        /// 來源機器
        /// </summary>
        public string? SrcNode { get; set; } = string.Empty;
        /// <summary>
        /// 來源完整路徑
        /// </summary>
        public string? SrcFullPath { get; set; } = string.Empty;
        /// <summary>
        /// 目的地IP
        /// </summary>
        public string? DestIP { get; set; } = string.Empty;
        /// <summary>
        /// 目的地機器
        /// </summary>
        public string? DestNode { get; set; } = string.Empty;
        /// <summary>
        /// 目的地完整路徑
        /// </summary>
        public string? DestFullPath { get; set; } = string.Empty;
        /// <summary>
        /// 錯誤訊息碼
        /// </summary>
        public string? ErrorCode { get; set; } = string.Empty;
        /// <summary>
        /// 錯誤訊息
        /// </summary>
        public string? ErrorMessage { get; set; } = string.Empty;
        /// <summary>
        /// 執行時間
        /// </summary>
        public DateTime? ExecuteTime { get; set; } = DateTime.UtcNow;

        #region 主子表關聯
        public FileManageModel_DTO? _FileManage { get; set; } = null!;
        #endregion
    }
    /// <summary>
    /// 檔案被用表 (之後再來做邏輯，先開表)
    /// </summary>
    public class FileManage_UsedModel_DTO
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc, Key] public string? InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc, Key] public int? RowId { get; set; }
        /// <summary>
        /// 使用的功能表名
        /// </summary>
        [LibDesc] public string? TableName { get; set; }
        /// <summary>
        /// 使用的功能欄位名稱
        /// </summary>
        [LibDesc] public string? ColumnName { get; set; }
        /// <summary>
        /// 對應資料主鍵
        /// </summary>
        public string? CompositeKey { get; set; }


        #region 主子表關聯
      public FileManageModel_DTO? _FileManage { get; set; } = null!;
        #endregion
    }
}
