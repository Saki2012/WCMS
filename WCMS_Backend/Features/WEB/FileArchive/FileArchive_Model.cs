using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.WEB.Content;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Metadata;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.Features.WEB.FileArchive;

[LibDesc(DisplayName.FileArchive)]
public class FileArchive : HeaderModel
{
    /// <summary>
    /// 檔案分類ID
    /// </summary>
    [Required, Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.FileArchiveId)]
    public string FileArchiveId { get; set; } = string.Empty;
    /// <summary>
    /// 狀態:置頂/熱門/隱藏
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_ContentStatus)]
    public ContentStatus ContentStatus { get; set; }
    /// <summary>
    /// 類別ID(多個)
    /// </summary>
    [Required]
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Category)]
    public string CategoriesId { get; set; } = string.Empty;
    /// <summary>
    /// 標籤ID(多個)
    /// </summary>
    [Required]
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Tag)]
    public string TagsId { get; set; } = string.Empty;
    /// <summary>
    /// 資料有效日期起 (該欄位未來會淘汰掉，把檔案室變成真正的一個表單與檔案清單設置，去對接Menu模組)
    /// </summary>
    [Obsolete]
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Announcement_StartDate)]
    public DateTime Validate_Start { get; set; }

    #region 主子表關聯
    [InverseProperty(nameof(FileArchiveInfo._FileArchive))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<FileArchiveInfo> _FileArchiveInfo { get; set; } = [];
    #endregion
}
[LibDesc(DisplayName.FileArchiveInfo)]
public class FileArchiveInfo : FormDetailModel
{
    /// <summary>
    /// 檔案分類ID
    /// </summary>
    [Required, Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.FileArchiveId)]
    public string FileArchiveId { get; set; } = string.Empty;
    /// <summary>
    /// 語系 LangCode
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Title)]
    public string Title { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(FileArchiveId))]
    [LibField(ApiFieldMode.Ignore)]
    public FileArchive _FileArchive { get; set; }
    [InverseProperty(nameof(FileArchiveDetail._FileArchiveInfo))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<FileArchiveDetail> _FileArchiveDetail { get; set; } = [];
    [InverseProperty(nameof(FileArchiveUrlDetail._FileArchiveInfo))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<FileArchiveUrlDetail> _FileArchiveUrlDetail { get; set; } = [];
    #endregion
}
[LibDesc(DisplayName.FileArchiveDetail)]
public class FileArchiveDetail : FormDetailModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
    [Required, Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.FileArchiveId)]
    public string FileArchiveId { get; set; } = string.Empty;
    /// <summary>
    /// 父行主鍵 (_FileArchiveInfo)
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
    public int ParentRowId { get; set; }
    /// <summary>
    /// 檔案來源
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, DisplayName.FileArchive_FileSrcId)]
    public string? FileSrcId { get; set; }
    [ForeignKey(nameof(FileSrcId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage FileSrc { get; set; }
    /// <summary>
    /// 語系 LangCode
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.FileArchive_FileName)]
    public string FileName { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey($@"{nameof(FileArchiveId)},{nameof(ParentRowId)}")]
    [LibField(ApiFieldMode.Ignore)]
    public FileArchiveInfo _FileArchiveInfo { get; set; }
    #endregion
}
[LibDesc(DisplayName.FileArchiveUrlDetail)]
public class FileArchiveUrlDetail : FormDetailModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
    [Required, Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.FileArchiveId)]
    public string FileArchiveId { get; set; } = string.Empty;
    /// <summary>
    /// 父行主鍵 (_FileArchiveInfo)
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
    public int ParentRowId { get; set; }
    /// <summary>
    /// 檔案來源
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, DisplayName.Common_Url)]
    public string Url { get; set; } = string.Empty;
    /// <summary>
    /// 網址描述
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_UrlDescription)]
    public string UrlDescription { get; set; } = string.Empty;
    /// <summary>
    /// 開啟連結方式
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.SiteMenu_WindowTarget)]
    public WindowTarget WindowTarget { get; set; }

    #region 主子表關聯
    [ForeignKey($@"{nameof(FileArchiveId)},{nameof(ParentRowId)}")]
    [LibField(ApiFieldMode.Ignore)]
    public FileArchiveInfo _FileArchiveInfo { get; set; }
    #endregion
}
