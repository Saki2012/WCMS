using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.WEB.Gallery;

/// <summary>
/// 相簿
/// </summary>
public class Gallery : HeaderModel
{
    /// <summary>
    /// 檔案分類ID
    /// </summary>
[Required, Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.GalleryId)]
public string GalleryId { get; set; } = string.Empty;
    /// <summary>
    /// 類別ID(多個)
    /// </summary>
[Required]
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Category)]
public string Categories { get; set; } = string.Empty;
    /// <summary>
    /// 標籤ID(多個)
    /// </summary>
[Required]
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Tag)]
public string Tags { get; set; } = string.Empty;
    /// <summary>
    /// 狀態:置頂/熱門/隱藏
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_ContentStatus)]
public ContentStatus ContentStatus { get; set; }
    /// <summary>
    /// 資料有效日期起。
    /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public DateTime Validate_Start { get; set; }
    /// <summary>
    /// 資料有效日期迄。
    /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public DateTime Validate_End { get; set; }
    /// <summary>
    /// 封面照 (透過功能從相簿裡的PicSrcId直接取得，保存時紀錄，供之後List查看時減少效能使用)
    /// </summary>
[ForeignKey(nameof(CoverPicSrcId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? CoverPicSrc { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Gallery_CoverPicSrcId)]
public string? CoverPicSrcId { get; set; }

    #region 主子表關聯
[InverseProperty(nameof(GalleryInfo._Gallery))]
[LibField(ApiFieldMode.ReadWrite)]
public List<GalleryInfo> _GalleryInfo { get; set; } = [];
[InverseProperty(nameof(GalleryPhotos._Gallery))]
[LibField(ApiFieldMode.ReadWrite)]
public List<GalleryPhotos> _GalleryPhotos { get; set; } = [];
    #endregion
}
/// <summary>
/// 相簿資訊
/// </summary>
public class GalleryInfo : DetailModel
{
    /// <summary>
    /// 檔案分類ID
    /// </summary>
[Required, Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.GalleryId)]
public string GalleryId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 語系 SysEnum.Lang
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
public LangCode Lang { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_Title)]
public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 內容
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Content)]
public string Content { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(GalleryId))]
[LibField(ApiFieldMode.ReadOnly)]
public Gallery _Gallery { get; set; }
    #endregion
}
/// <summary>
/// 相簿裡的相片
/// </summary>
[LibDesc(DisplayName.Gallery_Photos)]
public class GalleryPhotos : DetailModel
{
    /// <summary>
    /// 檔案分類ID
    /// </summary>
[Required, Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.GalleryId)]
public string GalleryId { get; set; } = string.Empty;
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
public FileManageModel? PicSrc { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, DisplayName.Gallery_PicSrcId)]
public string? PicSrcId { get; set; }
    /// <summary>
    /// 相片排序
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Gallery_Sort)]
public int Sort { get; set; }

    #region 主子表關聯
[ForeignKey(nameof(GalleryId))]
[LibField(ApiFieldMode.ReadOnly)]
public Gallery _Gallery { get; set; }
[InverseProperty(nameof(GalleryPhotosInfo._GalleryPhotos))]
[LibField(ApiFieldMode.ReadWrite)]
public List<GalleryPhotosInfo> _GalleryPhotosInfo { get; set; } = [];
    #endregion
}
/// <summary>
/// 相簿裡的相片資訊
/// </summary>
public class GalleryPhotosInfo : DetailModel
{
    /// <summary>
    /// 檔案分類ID
    /// </summary>
[Required, Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.GalleryId)]
public string GalleryId { get; set; } = string.Empty;
    /// <summary>
    /// 父行主鍵 - (_GalleryPhotos)
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
public int ParentRowId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 語系 SysEnum.Lang
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
public LangCode Lang { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, DisplayName.Common_Title)]
public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 描述
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, DisplayName.Common_Description)]
public string Description { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey($@"{nameof(GalleryId)},{nameof(ParentRowId)}")]
[LibField(ApiFieldMode.ReadOnly)]
public GalleryPhotos _GalleryPhotos { get; set; }
    #endregion
}
