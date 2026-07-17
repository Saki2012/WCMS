using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.COMM.Category;
using WCMS.SpecFeatures.Spec1817._Resx;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.PlatformServices.FileManagement;
using WCMS.Features.MAT.Material;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;

namespace WCMS.SpecFeatures.Spec1817.WEB.SpecMusical;

/// <summary>
/// 樂器表單主資料。
/// </summary>
public class SpecMusical : HeaderModel
{
    #region Property
    /// <summary>
    /// 樂器代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_MusicalId)]
    public string MusicalId { get; set; } = string.Empty;
    /// <summary>
    /// 樂器名稱。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Name, SpecDisplayName.Spec_MusicalName)]
    public string MusicalName { get; set; } = string.Empty;
    /// <summary>
    /// 類別關聯資料。
    /// </summary>
    [ForeignKey(nameof(CategoryId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public Category? Category { get; set; }
    /// <summary>
    /// 類別代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ID, DisplayName.CategoryId)]
    public string? CategoryId { get; set; }
    /// <summary>
    /// 封面圖片代碼，來源為相片明細。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Announcement_CoverPictureId)]
    public string? CoverPicId { get; set; }
    /// <summary>
    /// 規格。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Specification)]
    public string Specification { get; set; } = string.Empty;
    /// <summary>
    /// 琴頭。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Headstock)]
    public string Headstock { get; set; } = string.Empty;
    /// <summary>
    /// 背板。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Backboard)]
    public string Backboard { get; set; } = string.Empty;
    /// <summary>
    /// 弦長。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_ScaleLength)]
    public string ScaleLength { get; set; } = string.Empty;
    /// <summary>
    /// 覆手。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Bridge)]
    public string Bridge { get; set; } = string.Empty;
    /// <summary>
    /// 形制。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_BodyForm)]
    public string BodyForm { get; set; } = string.Empty;
    /// <summary>
    /// 弦材。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Material)]
    public string Material { get; set; } = string.Empty;
    /// <summary>
    /// 樂器說明。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, SpecDisplayName.Spec_MusicalInfo)]
    public string Info { get; set; } = string.Empty;
    /// <summary>
    /// 音檔明細。
    /// </summary>
    [InverseProperty(nameof(SpecMusicalSoundList._SpecMusical))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecMusicalSoundList> _SpecMusicalSoundList { get; set; } = [];
    /// <summary>
    /// 相片明細。
    /// </summary>
    [InverseProperty(nameof(SpecMusicalPictureList._SpecMusical))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecMusicalPictureList> _SpecMusicalPictureList { get; set; } = [];
    #endregion
}

/// <summary>
/// 樂器音檔明細。
/// </summary>
public class SpecMusicalSoundList : FormDetailModel
{
    #region Property
    /// <summary>
    /// 樂器代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_MusicalId)]
    public string MusicalId { get; set; } = string.Empty;
    /// <summary>
    /// 音源關聯資料。
    /// </summary>
    [ForeignKey(nameof(SoundSrcId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? SoundSrc { get; set; }
    /// <summary>
    /// 音源檔案代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Common_SoundSrcId)]
    public string? SoundSrcId { get; set; }
    /// <summary>
    /// 音檔說明。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_SoundSrcInfo)]
    public string Info { get; set; } = string.Empty;
    /// <summary>
    /// 所屬樂器。
    /// </summary>
    [ForeignKey(nameof(MusicalId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecMusical? _SpecMusical { get; set; }
    #endregion
}

/// <summary>
/// 樂器相片明細。
/// </summary>
public class SpecMusicalPictureList : FormDetailModel
{
    #region Property
    /// <summary>
    /// 樂器代碼。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_MusicalId)]
    public string MusicalId { get; set; } = string.Empty;
    /// <summary>
    /// 圖片關聯資料。
    /// </summary>
    [ForeignKey(nameof(PicSrcId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? PicSrc { get; set; }
    /// <summary>
    /// 圖片檔案代碼。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Gallery_PicSrcId)]
    public string? PicSrcId { get; set; }
    /// <summary>
    /// 相片排序。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Gallery_Sort)]
    public int Sort { get; set; }
    /// <summary>
    /// 圖片說明。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, DisplayName.Gallery_PhotosInfo)]
    public string Info { get; set; } = string.Empty;
    /// <summary>
    /// 所屬樂器。
    /// </summary>
    [ForeignKey(nameof(MusicalId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecMusical? _SpecMusical { get; set; }
    #endregion
}
