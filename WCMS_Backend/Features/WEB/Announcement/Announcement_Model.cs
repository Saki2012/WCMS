using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.WEB.Announcement;

/// <summary>
/// 公告主表
/// </summary>
[LibDesc(DisplayName.Announcement)]
public partial class Announcement : HeaderModel
{
    /// <summary>
    /// 公告代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.AnnouncementId)]
    public string AnnouncementId { get; set; } = string.Empty;
    /// <summary>
    /// 類別 (多個)
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Category)]
    public string Categories { get; set; } = string.Empty;
    /// <summary>
    /// 標籤 (多個) 
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Tag)]
    public string Tags { get; set; } = string.Empty;
    /// <summary>
    /// 狀態 (多個)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_ContentStatus)]
    public ContentStatus ContentStatus { get; set; }
    /// <summary>
    /// 圖片 (關聯檔案資料)
    /// </summary>
    [ForeignKey(nameof(PictureId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManageModel? Picture { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Announcement_CoverPictureId)]
    public string? PictureId { get; set; } = string.Empty;
    /// <summary>
    /// 圖片描述
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, DisplayName.Announcement_PicDescription)]
    public string PicDescription { get; set; } = string.Empty;
    /// <summary>
    /// 資料有效日期-起
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Announcement_StartDate)]
    public DateTime Validate_Start { get; set; }
    /// <summary>
    /// 資料有效日期-迄
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Announcement_EndDate)]
    public DateTime Validate_End { get; set; }

    #region 主子表關聯
    [InverseProperty(nameof(AnnouncementDetail._Announcement))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<AnnouncementDetail> _AnnouncementDetail { get; set; } = [];
    #endregion
}
/// <summary>
/// 公告明細
/// </summary>
public partial class AnnouncementDetail : DetailModel
{
    /// <summary>
    /// 公告代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.AnnouncementId)]
    public string AnnouncementId { get; set; } = string.Empty;
    /// <summary>
    /// 行代碼
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Title)]
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 副標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_SubTitle)]
    public string SubTitle { get; set; } = string.Empty;
    /// <summary>
    /// 內文
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Content)]
    public string Content { get; set; } = string.Empty;
    /// <summary>
    /// 網址
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Url, DisplayName.Common_Url)]
    public string Url { get; set; } = string.Empty;
    /// <summary>
    /// 網址描述
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, DisplayName.Common_UrlDescription)]
    public string UrlDescription { get; set; } = string.Empty;
    #region 主子表關聯
    [ForeignKey(nameof(AnnouncementId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public Announcement _Announcement { get; set; } = null!;
    [InverseProperty(nameof(AnnouncementDetailFile._AnnouncementDetail))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<AnnouncementDetailFile> _AnnouncementDetailFile { get; set; } = [];
    #endregion
}
/// <summary>
/// 明細檔案關聯
/// </summary>
[LibDesc(DisplayName.AnnouncementDetailFile)]
public partial class AnnouncementDetailFile : DetailModel
{
    /// <summary>
    /// 公告代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.AnnouncementId)]
    public string AnnouncementId { get; set; } = string.Empty;
    /// <summary>
    /// 父行代碼
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
    public int ParentRowId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    /// <summary>
    /// 檔案來源
    /// </summary>
    [ForeignKey(nameof(FileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManageModel? File { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Announcement_FileId)]
    public string? FileId { get; set; }
    /// <summary>
    /// 檔案名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Announcement_FileName)]
    public string FileName { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey($@"{nameof(AnnouncementId)},{nameof(ParentRowId)}")]
    [LibField(ApiFieldMode.ReadOnly)]
    public AnnouncementDetail _AnnouncementDetail { get; set; }
    #endregion
}
