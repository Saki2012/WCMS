using WCMS.SysCore.Library;
using System.ComponentModel;
using static WCMS.SysCore.Enum.SysEnum;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Model;
using WCMS.Features.SiteEdit.PageManagement;

namespace WCMS.Features.SysSetting.FileManagement
{
    public class FileManagementSet
    {
        public FileManagementModel FileManagement { get; set; }
        public List<FileInfoDownloadModel> FileInfoDownload { get; set; }
        public List<FileInfoSyncModel> FileInfoSyncModel { get; set; }
    }

    /// <summary>
    /// 檔案管理
    /// </summary>
    public class FileManagementModel: BasicDataModel
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc, Key]public new string InternalId { get; set; }
        /// <summary>
        /// 路徑
        /// </summary>
        [LibDesc] public string Path { get; set; }
        /// <summary>
        /// 檔案名稱
        /// </summary>
        [LibDesc] public string FileName { get; set; }
        /// <summary>
        /// 檔案描述
        /// (後續可透過帶出，其他表可修改對應的顯示說明)
        /// </summary>
        [LibDesc] public string FileDiscription { get; set; } = string.Empty;
        /// <summary>
        /// 網際網路媒體型式
        /// </summary>
        [LibDesc] public string MimeType { get; set; }
        /// <summary>
        /// 檔案SHA256值 
        /// 用來檢查Server是否已有該檔案，若有就不用再次上傳)
        /// </summary>
        [LibDesc] public string FileSHA256 { get; set; }
        /// <summary>
        /// 檔案大小
        /// </summary>
        [LibDesc] public long FileSize { get; set; }
        /// <summary>
        /// 功能Id
        /// </summary>
        [LibDesc] public string ProgId { get; set; }
        /// <summary>
        /// 匯入標籤
        /// </summary>
        [LibDesc] public string ImportLabel { get; set; }
        #region 不需要的欄位
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new DateTime? ModifyTime { get; }
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new string ModifyUserId { get; }
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new FormStatus FormStatus { get; }
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new DataStatus DataStatus { get; }
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new DateTime? InvalidTime { get; }
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new string InvalidUserId { get; }
        #endregion
    }
    /// <summary>
    /// 檔案被下載資訊
    /// </summary>
    public class FileInfoDownloadModel : DetailRowModel
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc,Key] public string InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc,Key] public int RowId { get; set; }
        /// <summary>
        /// 下載者IP
        /// </summary>
        [LibDesc] public string DownloadUserIP { get; set; }
        /// <summary>
        /// 使用裝置
        /// </summary>
        [LibDesc] public string UserAgent { get; set; }
        /// <summary>
        /// 下載來源
        /// </summary>
        [LibDesc] public string RefererURL { get; set; }
        /// <summary>
        /// 下載狀態 (成功/失敗)
        /// </summary>
        [LibDesc] public string DownloadStatus { get;set;}
        /// <summary>
        /// 下載時間
        /// </summary>
        [LibDesc] public DateTime DownloadTime { get; set; }
    }
    /// <summary>
    /// 檔案同步資訊
    /// </summary>
    public class FileInfoSyncModel : DetailRowModel
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc, Key] public string InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 同步狀態
        /// </summary>
        public string SyncStatus { get; set; } = "Pending"; // Pending / Success / Failed
        /// <summary>
        /// 來源IP
        /// </summary>
        public string SrcIP { get; set; }
        /// <summary>
        /// 目的地IP
        /// </summary>
        public string DestIP{ get; set; }
        /// <summary>
        /// 錯誤訊息
        /// </summary>
        public string? ErrorMessage { get; set; }                  // 若失敗則紀錄原因
        /// <summary>
        /// 執行時間
        /// </summary>
        public DateTime ExecuteTime { get; set; } = DateTime.UtcNow;
        /// <summary>
        /// 完成時間
        /// </summary>
        public DateTime? CompletedTime { get; set; }
    }
}
