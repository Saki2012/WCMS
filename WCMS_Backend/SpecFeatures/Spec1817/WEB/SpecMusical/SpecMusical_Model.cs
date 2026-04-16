using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
namespace WCMS.SpecFeatures.Spec1817.WEB.SpecMusical;

public class SpecMusicalSet:ITSet
{
    public SpecMusicalModel SpecMusical { get; set; } = new SpecMusicalModel();
    public List<SpecMusicalSoundList> SpecMusicalSoundList { get; set; } = [];
    public List<SpecMusicalPictureList> SpecMusicalPictureList { get; set; } = [];
}
public class SpecMusicalModel : MasterDataModel
{
    /// <summary>
    /// 樂器代碼
    /// </summary>
    [Key, StringLength(SysLengthParam.ID)] public string MusicalId { get; set; }
    /// <summary>
    /// 樂器名稱
    /// </summary>
    [StringLength(SysLengthParam.Name)] public string MusicalName { get; set; }
    /// <summary>
    /// 類別
    /// </summary>
    [ForeignKey(nameof(CategoryId))] public Category Category { get; set; }
    [StringLength(SysLengthParam.ID)] public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 封面圖片(來源從明細找)
    /// </summary>
    [StringLength(SysLengthParam.InternalId)] public string? CoverPicId { get; set; }
    /// <summary>
    /// 規格
    /// </summary>
    [StringLength(SysLengthParam.Info)] public string Specification { get; set; } = string.Empty;
    /// <summary>
    /// 琴頭
    /// </summary>
    [StringLength(SysLengthParam.Info)] public string Headstock { get; set; } = string.Empty;
    /// <summary>
    /// 背板
    /// </summary>
    [StringLength(SysLengthParam.Info)] public string Backboard { get; set; } = string.Empty;
    /// <summary>
    /// 弦長
    /// </summary>
    [StringLength(SysLengthParam.Info)] public string ScaleLength { get; set; } = string.Empty;
    /// <summary>
    /// 覆手
    /// </summary>
    [StringLength(SysLengthParam.Info)] public string Bridge { get; set; } = string.Empty;
    /// <summary>
    /// 形制
    /// </summary>
    [StringLength(SysLengthParam.Info)] public string BodyForm { get; set; } = string.Empty;
    /// <summary>
    /// 弦材
    /// </summary>
    [StringLength(SysLengthParam.Info)] public string Material { get; set; } = string.Empty;
    /// <summary>
    /// 樂器說明
    /// </summary>
    [StringLength(SysLengthParam.Memo)] public string Info { get; set; } = string.Empty;



    #region 主子表關聯
    [InverseProperty(nameof(SpecMusicalSoundList._SpecMusical))] public List<SpecMusicalSoundList> _SpecMusicalSoundList { get; set; }
    [InverseProperty(nameof(SpecMusicalPictureList._SpecMusical))] public List<SpecMusicalPictureList> _SpecMusicalPictureList { get; set; }
    #endregion
}
public class SpecMusicalSoundList : DetailRowModel 
{
    /// <summary>
    /// 樂器代碼
    /// </summary>
    [Key, StringLength(SysLengthParam.ID)] public string MusicalId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [Key] public int RowId { get; set; }
    /// <summary>
    /// 音源
    /// </summary>
    [ForeignKey(nameof(SoundSrcId))] public FileManageModel SoundSrc { get; set; }
    [StringLength(SysLengthParam.InternalId)] public string SoundSrcId { get; set; }
    /// <summary>
    /// 音檔說明
    /// </summary>
    [StringLength(SysLengthParam.Info)] public string Info { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(MusicalId))] public SpecMusicalModel _SpecMusical { get; set; }
    #endregion

}
public class SpecMusicalPictureList : DetailRowModel 
{
    /// <summary>
    /// 樂器代碼
    /// </summary>
    [Key, StringLength(SysLengthParam.ID)] public string MusicalId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [Key] public int RowId { get; set; }
    /// <summary>
    /// 圖片來源
    /// </summary>
    [ForeignKey(nameof(PicSrcId))] public FileManageModel PicSrc { get; set; }
    [StringLength(SysLengthParam.InternalId)] public string PicSrcId { get; set; }
    /// <summary>
    /// 相片排序
    /// </summary>
    public int Sort { get; set; }
    /// <summary>
    /// 圖片說明
    /// </summary>
    [StringLength(SysLengthParam.Info)] public string Info { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(MusicalId))] public SpecMusicalModel _SpecMusical { get; set; }
    #endregion
}
