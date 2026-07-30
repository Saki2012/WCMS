using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.I18n.Metadata;
using WCMS.SysCore.I18n;
using WCMS.SysCore.PlatformServices.FileManagement;
using WCMS.SpecFeatures.Spec1810._Resx;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.Features.WEB.Content;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecUSR;

/// <summary>
/// 
/// </summary>
public class SpecUSR: HeaderModel
{
    /// <summary>
    /// USR Id
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.SpecUSRId)]
public string USRId { get; set; } = string.Empty;
    /// <summary>
    /// 類別ID
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, SpecModelDisplayName.SpecResearch_Categories)]
public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 狀態 (多個)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_ContentStatus)]
    public ContentStatus ContentStatus { get; set; }
    /// <summary>
    /// 標籤 (多個) 
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.SpecResearch_Tags)]
public string Tags { get; set; }= string.Empty;
    /// <summary>
    /// 圖片 (關聯檔案資料)
    /// 注:後續應改關聯SpecUSRPhoto的RowId去指向對應的相片，以及SpecUSRPhotoInfo的Title
    /// </summary>
[ForeignKey(nameof(PictureId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManage? Picture { get; set; }
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.SpecUSR_PictureId)]
public string? PictureId { get; set; }= string.Empty;
    /// <summary>
    /// 圖片描述
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, SpecModelDisplayName.SpecUSR_PicDescription)]
public string PicDescription { get; set; }= string.Empty;

    #region 主子表關聯
[InverseProperty(nameof(SpecUSRDetail._SpecUSR))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecUSRDetail> _SpecUSRDetail { get; set; } = [];
[InverseProperty(nameof(SpecUSRPhoto._SpecUSR))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecUSRPhoto> _SpecUSRPhoto { get; set; } = [];
    #endregion
}
/// <summary>
/// 
/// </summary>
public class SpecUSRDetail:FormDetailModel
{
[Key]
[LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.SpecUSRId)]
public string USRId { get; set; } = string.Empty;
[Required]
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
public LangCode Lang { get; set; }= default!;
[LibStr(ApiFieldMode.ReadWrite, 10, SpecModelDisplayName.SpecUSR_Year)]
public string Year { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecUSR_AcademicYear)]
    public int AcademicYear { get; set; }
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_Courses)]
public string Courses { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_PracticeField)]
public string PracticeField { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_ProjectName)]
public string ProjectName { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_ExternalCoUnits)]
public string ExternalCooperationUnit { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_Department)]
public string Department { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_DuringExecution)]
public string DuringExecution { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecUSR_PlanAmount)]
    public decimal PlanAmount { get; set; }
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_ExecutionStrategy)]
public string ExecutionStrategy { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecUSR_ContentIntro)]
    public string ContentIntroduction { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_ProjectConcept)]
public string ProjectConcept { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 4000, SpecModelDisplayName.SpecUSR_KeyHighlights)]
public string ProjectHighlights { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_ProjectLeader)]
public string ProjectLeader { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_ProjectSubLeader)]
public string ProjectSubLeader { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_AttendTeam)]
public string AttendTeam { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_Cohost1)]
public string Cohost1 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_Cohost2)]
public string Cohost2 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 1000, SpecModelDisplayName.SpecUSR_Commissioned)]
public string Commissioned { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 500, SpecModelDisplayName.SpecUSR_Remark)]
public string Remark { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 500, SpecModelDisplayName.SpecUSR_ProjectItem)]
public string ProjectItem { get; set; } = string.Empty;
[Obsolete, StringLength(DbStrLen.Url)]
[LibField(ApiFieldMode.ReadWrite)]
public string Url { get; set; } = string.Empty;
[Obsolete, StringLength(DbStrLen.Url)]
[LibField(ApiFieldMode.ReadWrite)]
public string UrlDescription { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(USRId))]
[LibField(ApiFieldMode.Ignore)]
public SpecUSR _SpecUSR { get; set; }
[InverseProperty(nameof(SpecUSRFile._SpecUSRDetail))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecUSRFile> _SpecUSRFile { get; set; } = [];
[InverseProperty(nameof(SpecUSRUrl._SpecUSRDetail))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecUSRUrl> _SpecUSRUrl { get; set; } = [];
    #endregion
}
/// <summary>
///USR相簿裡的相片
/// </summary>
public class SpecUSRPhoto : FormDetailModel
{
    /// <summary>
    /// 檔案分類ID
    /// </summary>
[Required, Key]
[LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.SpecUSRId)]
public string USRId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
/// <summary>
    /// 圖片來源
    /// </summary>
[ForeignKey(nameof(PicSrcId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManage? PicSrc { get; set; }
[StringLength(DbStrLen.InternalId)]
[LibField(ApiFieldMode.ReadWrite)]
public string? PicSrcId { get; set; }
    /// <summary>
    /// 相片排序
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Gallery_Sort)]
    public int Sort { get; set; }

    #region 主子表關聯
[ForeignKey(nameof(USRId))]
[LibField(ApiFieldMode.Ignore)]
public SpecUSR _SpecUSR { get; set; }
[InverseProperty(nameof(SpecUSRPhotoInfo._SpecUSRPhoto))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecUSRPhotoInfo> _SpecUSRPhotoInfo { get; set; } = [];
    #endregion
}
/// <summary>
/// USR相簿裡的相片資訊
/// </summary>
public class SpecUSRPhotoInfo : FormDetailModel
{
    /// <summary>
    /// 
    /// </summary>
[Required, Key]
[LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.SpecUSRId)]
public string USRId { get; set; } = string.Empty;
    /// <summary>
    /// 父行主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
public int ParentRowId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
/// <summary>
    /// 語系 LangCode
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.Common_Title)]
public string Title { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey($@"{nameof(USRId)},{nameof(ParentRowId)}")]
[LibField(ApiFieldMode.Ignore)]
public SpecUSRPhoto _SpecUSRPhoto { get; set; }
    #endregion
}
/// <summary>
/// USR檔案
/// </summary>
public class SpecUSRFile : FormDetailModel
{
    /// <summary>
    /// 
    /// </summary>
[Required, Key]
[LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.SpecUSRId)]
public string USRId { get; set; } = string.Empty;
    /// <summary>
    /// 父行主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
public int ParentRowId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
/// <summary>
    /// 檔案來源
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, DisplayName.FileArchive_FileSrcId)]
public string? FileSrcId { get; set; }
[ForeignKey(nameof(FileSrcId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManage? FileSrc { get; set; }
    /// <summary>
    /// 語系 LangCode
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.FileName, DisplayName.FileArchive_FileName)]
public string FileName { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey($@"{nameof(USRId)},{nameof(ParentRowId)}")]
[LibField(ApiFieldMode.Ignore)]
public SpecUSRDetail _SpecUSRDetail { get; set; }
    #endregion
}
/// <summary>
/// USR外部網址設定
/// </summary>
public class SpecUSRUrl : FormDetailModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
[Required, Key]
[LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.SpecUSRId)]
public string USRId { get; set; } = string.Empty;
    /// <summary>
    /// 父行主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
public int ParentRowId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
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
[ForeignKey($@"{nameof(USRId)},{nameof(ParentRowId)}")]
[LibField(ApiFieldMode.Ignore)]
public SpecUSRDetail _SpecUSRDetail { get; set; }
    #endregion
}
