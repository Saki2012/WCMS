using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SpecFeatures.Spec1817._Resx;
using WCMS.SysCore.FeatureDriver.Resx;
namespace WCMS.SpecFeatures.Spec1817.WEB.SpecMusical;

public class SpecMusicalSet:ITSet
{
    [LibField(ApiFieldMode.ReadWrite)]
    public SpecMusicalModel SpecMusical { get; set; }= new SpecMusicalModel();
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecMusicalSoundList> SpecMusicalSoundList { get; set; }= [];
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecMusicalPictureList> SpecMusicalPictureList { get; set; }= [];
}
public class SpecMusicalModel : HeaderModel
{
    /// <summary>
    /// 樂器代碼
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_MusicalId)]
public string MusicalId { get; set; } = string.Empty;
    /// <summary>
    /// 樂器名稱
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Name, SpecDisplayName.Spec_MusicalName)]
public string MusicalName { get; set; } = string.Empty;
    /// <summary>
    /// 類別
    /// </summary>
[ForeignKey(nameof(CategoryId))]
[LibField(ApiFieldMode.ReadOnly)]
public Category Category { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ID, DisplayName.CategoryId)]
public string? CategoryId { get; set; }= string.Empty;
    /// <summary>
    /// 封面圖片(來源從明細找)
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Announcement_CoverPictureId)]
public string CoverPicId { get; set; } = string.Empty;
    /// <summary>
    /// 規格
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Specification)]
public string Specification { get; set; }= string.Empty;
    /// <summary>
    /// 琴頭
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Headstock)]
public string Headstock { get; set; }= string.Empty;
    /// <summary>
    /// 背板
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Backboard)]
public string Backboard { get; set; }= string.Empty;
    /// <summary>
    /// 弦長
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_ScaleLength)]
public string ScaleLength { get; set; }= string.Empty;
    /// <summary>
    /// 覆手
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Bridge)]
public string Bridge { get; set; }= string.Empty;
    /// <summary>
    /// 形制
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_BodyForm)]
public string BodyForm { get; set; }= string.Empty;
    /// <summary>
    /// 弦材
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_Material)]
public string Material { get; set; }= string.Empty;
    /// <summary>
    /// 樂器說明
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, SpecDisplayName.Spec_MusicalInfo)]
public string Info { get; set; }= string.Empty;



    #region 主子表關聯
[InverseProperty(nameof(SpecMusicalSoundList._SpecMusical))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecMusicalSoundList> _SpecMusicalSoundList { get; set; } = [];
[InverseProperty(nameof(SpecMusicalPictureList._SpecMusical))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecMusicalPictureList> _SpecMusicalPictureList { get; set; } = [];
    #endregion
}
public class SpecMusicalSoundList : DetailModel
{
    /// <summary>
    /// 樂器代碼
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_MusicalId)]
public string MusicalId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 音源
    /// </summary>
[ForeignKey(nameof(SoundSrcId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel SoundSrc { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Common_SoundSrcId)]
public string? SoundSrcId { get; set; }
    /// <summary>
    /// 音檔說明
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_SoundSrcInfo)]
public string Info { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(MusicalId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecMusicalModel _SpecMusical { get; set; }
    #endregion

}
public class SpecMusicalPictureList : DetailModel
{
    /// <summary>
    /// 樂器代碼
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_MusicalId)]
public string MusicalId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 圖片來源
    /// </summary>
[ForeignKey(nameof(PicSrcId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel PicSrc { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Gallery_PicSrcId)]
public string? PicSrcId { get; set; }
    /// <summary>
    /// 相片排序
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Gallery_Sort)]
    public int Sort { get; set; }
    /// <summary>
    /// 圖片說明
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, DisplayName.Gallery_PhotosInfo)]
public string Info { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(MusicalId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecMusicalModel _SpecMusical { get; set; }
    #endregion
}
