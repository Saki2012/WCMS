using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.SiteEdit.Category;
using WCMS.SpecFeatures.Spec1817.Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;

namespace WCMS.SpecFeatures.Spec1817.SiteEdit.SpecMusical
{
    public class SpecMusicalSet_DTO : ITSet_DTO
    {
        public SpecMusicalModel_DTO SpecMusical { get; set; } = new ();
        public List<SpecMusicalSoundList_DTO> SpecMusicalSoundList { get; set; } = [];
        public List<SpecMusicalPictureList_DTO> SpecMusicalPictureList { get; set; } = [];
    }

    public class SpecMusicalModel_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 樂器代碼
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_MusicalId),Key, StringLength(SysLengthParam.ID)] public string? MusicalId { get; set; }
        /// <summary>
        /// 樂器名稱
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_MusicalName),StringLength(SysLengthParam.Name)] public string? MusicalName { get; set; }
        /// <summary>
        /// 類別
        /// </summary>
        [ForeignKey(nameof(CategoryId))] public Category_DTO? Category { get; set; }
        [LibDesc(ModelDisplayName.CategoryId), StringLength(SysLengthParam.ID)] public string? CategoryId { get; set; } = string.Empty;
        /// <summary>
        /// 封面圖片(來源從明細找)
        /// </summary>
        [LibDesc(ModelDisplayName.Announcement_CoverPictureId), StringLength(SysLengthParam.InternalId)] public string? CoverPicId { get; set; }
        /// <summary>
        /// 規格
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_Specification), StringLength(SysLengthParam.Info)] public string? Specification { get; set; } = string.Empty;
        /// <summary>
        /// 琴頭
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_Headstock), StringLength(SysLengthParam.Info)] public string? Headstock { get; set; } = string.Empty;
        /// <summary>
        /// 背板
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_Backboard), StringLength(SysLengthParam.Info)] public string? Backboard { get; set; } = string.Empty;
        /// <summary>
        /// 弦長
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_ScaleLength), StringLength(SysLengthParam.Info)] public string? ScaleLength { get; set; } = string.Empty;
        /// <summary>
        /// 覆手
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_Bridge), StringLength(SysLengthParam.Info)] public string? Bridge { get; set; } = string.Empty;
        /// <summary>
        /// 形制
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_BodyForm), StringLength(SysLengthParam.Info)] public string? BodyForm { get; set; } = string.Empty;
        /// <summary>
        /// 弦材
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_Material), StringLength(SysLengthParam.Info)] public string? Material { get; set; } = string.Empty;
        /// <summary>
        /// 樂器說明
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_MusicalInfo), StringLength(SysLengthParam.Memo)] public string? Info { get; set; } = string.Empty;
        #region 主子表關聯
        [InverseProperty(nameof(SpecMusicalSoundList._SpecMusical))] public List<SpecMusicalSoundList_DTO>? _SpecMusicalSoundList { get; set; }
        [InverseProperty(nameof(SpecMusicalPictureList._SpecMusical))] public List<SpecMusicalPictureList_DTO>? _SpecMusicalPictureList { get; set; }
        #endregion
    }
    public class SpecMusicalSoundList_DTO : DetailRowModel
    {
        /// <summary>
        /// 樂器代碼
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_MusicalId), Key, StringLength(SysLengthParam.ID)] public string? MusicalId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
        /// <summary>
        /// 音源
        /// </summary>
        [LibDesc(ModelDisplayName.Common_SoundSrcId), StringLength(SysLengthParam.InternalId)] public string? SoundSrcId { get; set; }
        /// <summary>
        /// 音檔說明
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_SoundSrcInfo), StringLength(SysLengthParam.Info)] public string? Info { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(MusicalId))] public SpecMusicalModel_DTO? _SpecMusical { get; set; }
        #endregion
    }
    public class SpecMusicalPictureList_DTO : DetailRowModel
    {
        /// <summary>
        /// 樂器代碼
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_MusicalId), Key, StringLength(SysLengthParam.ID)] public string? MusicalId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
        /// <summary>
        /// 圖片來源
        /// </summary>
        [LibDesc(ModelDisplayName.Gallery_PicSrcId), StringLength(SysLengthParam.InternalId)] public string? PicSrcId { get; set; }
        /// <summary>
        /// 相片排序
        /// </summary>
        [LibDesc(ModelDisplayName.Gallery_Sort)] public int? Sort { get; set; }
        /// <summary>
        /// 圖片說明
        /// </summary>
        [LibDesc(ModelDisplayName.Gallery_PhotosInfo), StringLength(SysLengthParam.Info)] public string? Info { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(MusicalId))] public SpecMusicalModel_DTO? _SpecMusical { get; set; }
        #endregion
    }
}
