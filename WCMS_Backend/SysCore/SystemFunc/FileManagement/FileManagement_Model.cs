using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;
using static WCMS.Features.SystemSetting.SiteInfo.SiteMenuSetting.ModuleOptions;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.SystemFunc.FileManagement
{

    public class FileManageSet:ITSet
    {
        public FileManageModel FileManage { get; set; } = new();
        public List<FileManage_DownloadInfoModel> FileManage_DownloadInfo { get; set; } = [];
        public List<FileManage_SyncInfoModel> FileManage_SyncInfo { get; set; } = [];
    }
    /// <summary>
    /// 檔案管理
    /// </summary>
    [Index(nameof(FileSHA256))]
    public class FileManageModel : MasterDataModel
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [Key, StringLength(SysLengthParam.InternalId)] public new string InternalId { get; set; } = new Guid().ToString();
        /// <summary>
        /// 路徑
        /// </summary>
        [StringLength(SysLengthParam.Path)] public string Path { get; set; }
        /// <summary>
        /// 檔案名稱
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string FileName { get; set; }
        /// <summary>
        /// 副檔名
        /// </summary>
        [StringLength(SysLengthParam.FileExt)] public string FileExtension { get; set; }
        /// <summary>
        /// 檔案描述
        /// (後續可透過帶出，其他表可修改對應的顯示說明)
        /// </summary>
        [StringLength(SysLengthParam.Memo)] public string FileDescription { get; set; } = string.Empty;
        /// <summary>
        /// 網際網路媒體型式
        /// </summary>
        [StringLength(SysLengthParam.FileMineType)] public string MimeType { get; set; } = string.Empty;
        /// <summary>
        /// 檔案SHA256值 
        /// 用來檢查Server是否已有該檔案，若有就不用再次上傳，但是要更新其他欄位
        /// </summary>
        [StringLength(SysLengthParam.FileSHA256)] public string FileSHA256 { get; set; }
        /// <summary>
        /// 檔案大小
        /// </summary>
        [LibDesc] public long FileSize { get; set; }
        /// <summary>
        /// 功能Id
        /// </summary>
        [StringLength(SysLengthParam.ProgId)] public string ProgId { get; set; }
        /// <summary>
        /// 匯入標籤(
        /// (供初始化的，例如1810專案的檔案匯入，資料夾就為1810(ImportLabel名就為1810)，底下結構不變的紀錄至Path)
        /// </summary>
        [StringLength(SysLengthParam.ID)] public string ImportLabel { get; set; } = string.Empty;
        /// <summary>
        /// 檔案狀態
        /// </summary>
        [LibDesc] public FileStatus FileStatus { get; set; }
        /// <summary>
        /// 下載次數
        /// </summary>
        [NotMapped] public int DownloadCount { get { return _FileManage_DownloadInfo.Count; } }

        #region 主子表關聯
        [InverseProperty(nameof(FileManage_DownloadInfoModel._FileManage))] public List<FileManage_DownloadInfoModel> _FileManage_DownloadInfo { get; set; } = [];
        [InverseProperty(nameof(FileManage_SyncInfoModel._FileManage))] public List<FileManage_SyncInfoModel> _FileManage_SyncInfo { get; set; }
        //[InverseProperty(nameof(FileManage_UsedModel._FileManage))] public List<FileManage_UsedModel> _FileManage_Used { get; set; }
        #endregion

        #region 不需要的欄位
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new FormStatus FormStatus { get; }
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new DataStatus DataStatus { get; }
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new DateTime? InvalidTime { get; }
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new string? InvalidUserId { get; }
        [NotMapped, JsonIgnore, EditorBrowsable(EditorBrowsableState.Never)] public new UserModel? InvalidUser { get; set; }
        #endregion
    }
    /// <summary>
    /// 檔案被下載資訊
    /// </summary>
    public class FileManage_DownloadInfoModel : DetailRowModel
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [Key, StringLength(SysLengthParam.InternalId)] public string InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [Key] public int? RowId { get; set; }
        /// <summary>
        /// 下載者IP
        /// </summary>
        [StringLength(SysLengthParam.IP)] public string DownloadUserIP { get; set; }
        /// <summary>
        /// 使用裝置
        /// </summary>
        [StringLength(SysLengthParam.Memo)] public string UserAgent { get; set; }
        /// <summary>
        /// 下載來源
        /// </summary>
        [StringLength(SysLengthParam.Url)] public string RefererURL { get; set; }
        /// <summary>
        /// 下載狀態 (1成功/0失敗)
        /// </summary>
        [LibDesc] public bool DownloadStatus { get; set; }
        /// <summary>
        /// 下載時間
        /// </summary>
        [LibDesc] public DateTime DownloadTime { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(InternalId))] public FileManageModel _FileManage { get; set; } = null!;
        #endregion
    }
    /// <summary>
    /// 檔案同步資訊
    /// </summary>
    public class FileManage_SyncInfoModel : DetailRowModel
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [Key, StringLength(SysLengthParam.InternalId)] public string InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [Key] public int? RowId { get; set; }
        /// <summary>
        /// 同步狀態
        /// </summary>
        public FileStatus FileStatus { get; set; } = FileStatus.None;
        /// <summary>
        /// 來源IP
        /// </summary>
        [StringLength(SysLengthParam.IP)] public string SrcIP { get; set; } = string.Empty;
        /// <summary>
        /// 來源機器
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string SrcNode { get; set; } = string.Empty;
        /// <summary>
        /// 來源完整路徑
        /// </summary>
        [StringLength(SysLengthParam.Url)] public string SrcFullPath { get; set; } = string.Empty;
        /// <summary>
        /// 目的地IP
        /// </summary>
        [StringLength(SysLengthParam.IP)] public string DestIP { get; set; } = string.Empty;
        /// <summary>
        /// 目的地機器
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string DestNode { get; set; } = string.Empty;
        /// <summary>
        /// 目的地完整路徑
        /// </summary>
        [StringLength(SysLengthParam.Url)] public string DestFullPath { get; set; } = string.Empty;
        /// <summary>
        /// 錯誤訊息碼
        /// </summary>
        [StringLength(SysLengthParam.ID)] public string? ErrorCode { get; set; } = string.Empty;
        /// <summary>
        /// 錯誤訊息
        /// </summary>
        [StringLength(SysLengthParam.CodeMessage)] public string? ErrorMessage { get; set; } = string.Empty;
        /// <summary>
        /// 執行時間
        /// </summary>
        public DateTime ExecuteTime { get; set; } = DateTime.UtcNow;

        #region 主子表關聯
        [ForeignKey(nameof(InternalId))] public FileManageModel _FileManage { get; set; } = null!;
        #endregion
    }
    /// <summary>
    /// 檔案被用表 (之後再來做邏輯，先開表)
    /// </summary>
    public class FileManage_UsedModel
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [Key, StringLength(SysLengthParam.InternalId)] public string InternalId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [Key] public int? RowId { get; set; }
        /// <summary>
        /// 使用的功能表名
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string TableName { get; set; }
        /// <summary>
        /// 使用的功能欄位名稱
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string ColumnName{ get; set; }
        /// <summary>
        /// 對應資料主鍵
        /// </summary>
        [StringLength(SysLengthParam.Memo)] public string CompositeKey { get; set; }
        #region 主子表關聯
        [ForeignKey(nameof(InternalId))] public FileManageModel _FileManage { get; set; } = null!;
        #endregion
    }
}
