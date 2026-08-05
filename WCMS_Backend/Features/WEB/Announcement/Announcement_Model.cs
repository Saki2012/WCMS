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
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.AnnouncementId)]
    public string AnnouncementId { get; set; } = string.Empty;
    /// <summary>
    /// 類別 (多個)
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Category)]
    public string Categories { get; set; } = string.Empty;
    /// <summary>
    /// 標籤 (多個) 
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Tag)]
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
    public FileManage? Picture { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, DisplayName.Announcement_CoverPictureId)]
    public string? PictureId { get; set; } = string.Empty;
    /// <summary>
    /// 圖片描述
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.Announcement_PicDescription)]
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
[LibDesc(DisplayName.AnnouncementDetail)]
public partial class AnnouncementDetail : FormDetailModel
{
    /// <summary>
    /// 公告代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.AnnouncementId)]
    public string AnnouncementId { get; set; } = string.Empty;
    /// <summary>
    /// 語系
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Title)]
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 副標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_SubTitle)]
    public string SubTitle { get; set; } = string.Empty;
    /// <summary>
    /// 內文
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Content)]
    public string Content { get; set; } = string.Empty;
    /// <summary>
    /// 網址
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, DisplayName.Common_Url)]
    public string Url { get; set; } = string.Empty;
    /// <summary>
    /// 網址描述
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.Common_UrlDescription)]
    public string UrlDescription { get; set; } = string.Empty;
    #region 主子表關聯
    [ForeignKey(nameof(AnnouncementId))]
    [LibField(ApiFieldMode.Ignore)]
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
public partial class AnnouncementDetailFile : FormDetailModel
{
    /// <summary>
    /// 公告代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.AnnouncementId)]
    public string AnnouncementId { get; set; } = string.Empty;
    /// <summary>
    /// 父行代碼
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
    public int ParentRowId { get; set; }
    /// <summary>
    /// 檔案來源
    /// </summary>
    [ForeignKey(nameof(FileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? File { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, DisplayName.Announcement_FileId)]
    public string? FileId { get; set; }
    /// <summary>
    /// 檔案名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Announcement_FileName)]
    public string FileName { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey($@"{nameof(AnnouncementId)},{nameof(ParentRowId)}")]
    [LibField(ApiFieldMode.Ignore)]
    public AnnouncementDetail _AnnouncementDetail { get; set; }
    #endregion
}
