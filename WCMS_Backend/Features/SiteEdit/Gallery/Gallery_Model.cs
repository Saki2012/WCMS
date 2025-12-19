using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.Gallery
{
    public class GallerySet:ITSet
    {
        public Gallery Gallery { get; set; } = new();
        public List<GalleryInfo> GalleryInfo { get; set; } = [];
        public List<GalleryPhotos> GalleryPhotos { get; set; } = [];
        public List<GalleryPhotosInfo> GalleryPhotosInfo { get; set; } = [];
    }
    /// <summary>
    /// 相簿
    /// </summary>
    public class Gallery : MasterDataModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key, StringLength(SysLengthParam.ID)] public string GalleryId { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [LibDesc, Required, StringLength(SysLengthParam.Title)] public string Categories { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [LibDesc, Required, StringLength(SysLengthParam.Title)] public string Tags { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 封面照 (透過功能從相簿裡的PicSrcId直接取得，保存時紀錄，供之後List查看時減少效能使用)
        /// </summary>
        [StringLength(SysLengthParam.InternalId)] public string? CoverPicSrcId { get; set; }
        #region 主子表關聯
        [InverseProperty(nameof(GalleryInfo._Gallery))] public List<GalleryInfo> _GalleryInfo { get; set; }
        [InverseProperty(nameof(GalleryPhotos._Gallery))] public List<GalleryPhotos> _GalleryPhotos { get; set; }
        #endregion
    }
    /// <summary>
    /// 相簿資訊
    /// </summary>
    public class GalleryInfo : DetailRowModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public LangCode Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        public string Title { get; set; }
        /// <summary>
        /// 內容
        /// </summary>
        public string Content { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(GalleryId))] public Gallery _Gallery { get; set; }
        #endregion
    }
    /// <summary>
    /// 相簿裡的相片
    /// </summary>
    public class GalleryPhotos : DetailRowModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key, StringLength(SysLengthParam.ID)] public string GalleryId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 圖片來源
        /// </summary>
        [StringLength(SysLengthParam.InternalId)] public string PicSrcId { get;set; }
        /// <summary>
        /// 相片排序
        /// </summary>
        public int Sort { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(GalleryId))] public Gallery _Gallery { get; set; }
        [InverseProperty(nameof(GalleryPhotosInfo._GalleryPhotos))] public List<GalleryPhotosInfo> _GalleryPhotosInfo { get; set; }
        #endregion
    }
    /// <summary>
    /// 相簿裡的相片資訊
    /// </summary>
    public class GalleryPhotosInfo : DetailRowModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key, StringLength(SysLengthParam.ID)] public string GalleryId { get; set; }
        /// <summary>
        /// 父行主鍵 - (_GalleryPhotos)
        /// </summary>
        [LibDesc, Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public LangCode Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [StringLength(SysLengthParam.Memo)] public string Title { get; set; }

        #region 主子表關聯
        [ForeignKey($@"{nameof(GalleryId)},{nameof(ParentRowId)}")] public GalleryPhotos _GalleryPhotos { get; set; }
        #endregion
    }
}
