using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.Gallery
{

    public class GallerySet_DTO : ITSet_DTO
    {
        public Gallery_DTO Gallery { get; set; } = new();
        public List<GalleryInfo_DTO> GalleryInfo { get; set; } = [];
        public List<GalleryPhotos_DTO> GalleryPhotos { get; set; } = [];
        public List<GalleryPhotosInfo_DTO> GalleryPhotosInfo { get; set; } = [];
    }

    /// <summary>
    /// 相簿
    /// </summary>
    public class Gallery_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.GalleryId), Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Category), Required] public string Categories { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Tag), Required] public string Tags { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ContentStatus)] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 封面照 (透過功能從相簿裡的PicSrcId直接取得，保存時紀錄，供之後list查看時減少效能使用)
        /// </summary>
        [LibDesc(ModelDisplayName.Gallery_CoverPicSrcId)] public string CoverPicSrcId { get; set; }
        /// <summary>
        /// 相簿排序
        /// </summary>
        [LibDesc(ModelDisplayName.Gallery_Sort)] public int Sort { get; set; }

        public List<GalleryInfo_DTO> GalleryInfo { get; set; } = [];
        public List<GalleryPhotos_DTO> GalleryPhotos { get; set; } = [];
    }
    /// <summary>
    /// 相簿資訊
    /// </summary>
    public class GalleryInfo_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.GalleryId), Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title)] public string Title { get; set; }
        /// <summary>
        /// 內容
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Content)] public string Content { get; set; }
    }
    /// <summary>
    /// 相簿裡的相片
    /// </summary>
    public class GalleryPhotos_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.GalleryId), Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        /// <summary>
        /// 圖片來源
        /// </summary>
        [LibDesc(ModelDisplayName.Gallery_PicSrcId)] public string PicSrcId { get; set; }
        /// <summary>
        /// 相片排序
        /// </summary>
        [LibDesc(ModelDisplayName.Gallery_Sort)] public int Sort { get; set; }

        public List<GalleryPhotosInfo_DTO> GalleryPhotosInfo { get; set; } = [];
    }
    /// <summary>
    /// 相簿裡的相片資訊
    /// </summary>
    public class GalleryPhotosInfo_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.GalleryId), Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 父行主鍵 - (GalleryPhotos)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ParentRowId), Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title)] public string Title { get; set; }
    }
}
