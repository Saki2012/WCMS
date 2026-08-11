using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.SysCore.PlatformServices.FileManagement;

/// <summary>
/// 實體檔案放置位置
/// </summary>
public class FilePathOptions
{
    public string Root { get; set; }
    public string Pending { get; set; }
    public string Permanent { get; set; }
    public string Import { get; set; }
}

/// <summary>
/// 檔案管理
/// </summary>
[Index(nameof(FileSHA256))]
[LibDesc(DisplayName.FileManage)]
public class FileManage : HeaderModel
{
    /// <summary>
    /// 檔案識別碼
    /// </summary>
    [Key, StringLength(DbStrLen.InternalId)]
    [LibField(ApiFieldMode.ReadOnly)]
    public override string InternalId { get; set; } = Guid.NewGuid().ToString();
    /// <summary>
    /// 路徑
    /// </summary>
    [StringLength(DbStrLen.Path)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string Path { get; set; } = string.Empty;
    /// <summary>
    /// 檔案名稱
    /// </summary>
    [StringLength(DbStrLen.FileName)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string FileName { get; set; } = string.Empty;
    /// <summary>
    /// 副檔名
    /// </summary>
    [StringLength(DbStrLen.FileExt)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string FileExtension { get; set; } = string.Empty;
    /// <summary>
    /// 檔案描述
    /// (後續可透過帶出，其他表可修改對應的顯示說明)
    /// </summary>
    [StringLength(DbStrLen.Memo)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string FileDescription { get; set; } = string.Empty;
    /// <summary>
    /// 網際網路媒體型式
    /// </summary>
    [StringLength(DbStrLen.FileMineType)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string MimeType { get; set; } = string.Empty;
    /// <summary>
    /// 檔案SHA256值 
    /// 用來檢查Server是否已有該檔案，若有就不用再次上傳，但是要更新其他欄位
    /// </summary>
    [StringLength(DbStrLen.FileSHA256)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string FileSHA256 { get; set; } = string.Empty;
    /// <summary>
    /// 檔案大小
    /// </summary>
    [LibNum(ApiFieldMode.ReadWrite)]
    public long FileSize { get; set; }
    /// <summary>
    /// 功能Id
    /// </summary>
    [StringLength(DbStrLen.ProgId)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string ProgId { get; set; } = string.Empty;
    /// <summary>
    /// 匯入標籤(
    /// (供初始化的，例如1810專案的檔案匯入，資料夾就為1810(ImportLabel名就為1810)，底下結構不變的紀錄至Path)
    /// </summary>
    [StringLength(DbStrLen.ID)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string ImportLabel { get; set; } = string.Empty;
    /// <summary>
    /// 檔案狀態
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public FileStatus FileStatus { get; set; }
    /// <summary>
    /// 前台網站下載次數
    /// </summary>
    [LibNum(ApiFieldMode.ReadWrite, DisplayName.FileManage_DownloadCount)]
    public int PublicDownloadCount { get; set; } = 0;
    /// <summary>
    /// 是否公開檔案
    /// 2026.03.17新增，因為有些檔案可能只是內部使用，或是已經不想被下載了，但又不想刪除，所以先加個欄位來控制是否公開下載
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public bool IsPublic { get; set; } = true;

    #region 主子表關聯
    [InverseProperty(nameof(FileManage_SyncInfo._FileManage))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<FileManage_SyncInfo> _FileManage_SyncInfo { get; set; } = [];
    [InverseProperty(nameof(FileManage_DownloadRecent._FileManage))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<FileManage_DownloadRecent> _FileManage_DownloadRecent { get; set; } = [];
    #endregion
}
/// <summary>
/// 檔案被下載資訊
/// </summary>
/// 
[Index(nameof(InternalId), nameof(VisitorKey), IsUnique = true), Index(nameof(LastCountTime))]
[LibDesc(DisplayName.FileManage_DownloadRecent)]
public class FileManage_DownloadRecent : FormDetailModel
{
    /// <summary>
    /// 檔案識別碼
    /// </summary>
    [Key, StringLength(DbStrLen.InternalId)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string InternalId { get; set; } = string.Empty;
    /// <summary>
    /// 匿名訪客識別碼
    /// </summary>
    [Required, StringLength(DbStrLen.InternalId)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string VisitorKey { get; set; } = string.Empty;
    /// <summary>
    /// 最近一次正式計數的來源頁
    /// </summary>
    [StringLength(DbStrLen.Url)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string RefererURL { get; set; } = string.Empty;
    /// <summary>
    /// 最近一次正式計數時間
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public DateTime LastCountTime { get; set; } = DateTime.UtcNow;
    #region 主子表關聯
    [ForeignKey(nameof(InternalId))]
    [LibField(ApiFieldMode.Ignore)]
    public FileManage _FileManage { get; set; } = null!;
    #endregion
}
/// <summary>
/// 檔案同步資訊
/// </summary>
[LibDesc(DisplayName.FileManage_SyncInfo)]
public class FileManage_SyncInfo : FormDetailModel
{
    /// <summary>
    /// 檔案識別碼
    /// </summary>
    [Key, StringLength(DbStrLen.InternalId)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string InternalId { get; set; } = string.Empty;
    /// <summary>
    /// 同步狀態
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public FileStatus FileStatus { get; set; } = FileStatus.None;
    /// <summary>
    /// 來源IP
    /// </summary>
    [StringLength(DbStrLen.IP)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string SrcIP { get; set; } = string.Empty;
    /// <summary>
    /// 來源機器
    /// </summary>
    [StringLength(DbStrLen.Name)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string SrcNode { get; set; } = string.Empty;
    /// <summary>
    /// 來源完整路徑
    /// </summary>
    [StringLength(DbStrLen.Url)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string SrcFullPath { get; set; } = string.Empty;
    /// <summary>
    /// 目的地IP
    /// </summary>
    [StringLength(DbStrLen.IP)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string DestIP { get; set; } = string.Empty;
    /// <summary>
    /// 目的地機器
    /// </summary>
    [StringLength(DbStrLen.Name)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string DestNode { get; set; } = string.Empty;
    /// <summary>
    /// 目的地完整路徑
    /// </summary>
    [StringLength(DbStrLen.Url)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string DestFullPath { get; set; } = string.Empty;
    /// <summary>
    /// 錯誤訊息碼
    /// </summary>
    [StringLength(DbStrLen.ID)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string ErrorCode { get; set; } = string.Empty;
    /// <summary>
    /// 錯誤訊息
    /// </summary>
    [StringLength(DbStrLen.CodeMessage)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string ErrorMessage { get; set; } = string.Empty;
    /// <summary>
    /// 執行時間
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public DateTime ExecuteTime { get; set; } = DateTime.UtcNow;

    #region 主子表關聯
    [ForeignKey(nameof(InternalId))]
    [LibField(ApiFieldMode.Ignore)]
    public FileManage _FileManage { get; set; } = null!;
    #endregion
}
/// <summary>
/// 檔案被用表 (之後再來做邏輯，先開表)
/// </summary>
[LibDesc(DisplayName.FileManage_UsedModel)]
public class FileManage_UsedModel
{
    /// <summary>
    /// 檔案識別碼
    /// </summary>
    [Key, StringLength(DbStrLen.InternalId)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string InternalId { get; set; } = string.Empty;
    /// <summary>
    /// 行代碼
    /// </summary>
    [Key]
    [LibNum(ApiFieldMode.ReadOnly)]
    public int RowId { get; set; }
    /// <summary>
    /// 使用的功能表名
    /// </summary>
    [StringLength(DbStrLen.Name)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string TableName { get; set; } = string.Empty;
    /// <summary>
    /// 使用的功能欄位名稱
    /// </summary>
    [StringLength(DbStrLen.Name)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string ColumnName { get; set; } = string.Empty;
    /// <summary>
    /// 對應資料主鍵
    /// </summary>
    [StringLength(DbStrLen.Memo)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string CompositeKey { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(InternalId))]
    [LibField(ApiFieldMode.Ignore)]
    public FileManage _FileManage { get; set; } = null!;
    #endregion
}
