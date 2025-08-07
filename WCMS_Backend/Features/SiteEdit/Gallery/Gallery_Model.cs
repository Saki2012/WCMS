using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.Gallery
{
    public class GallerySet
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
        [LibDesc, Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [LibDesc, Required] public string Categories { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [LibDesc, Required] public string Tags { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 封面照 (透過功能從相簿裡的PicSrcId直接取得，保存時紀錄，供之後list查看時減少效能使用)
        /// </summary>
        public string CoverPicSrcId { get; set; }
        /// <summary>
        /// 相簿排序
        /// </summary>
        public int Sort { get; set; }
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
        [LibDesc] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        public string Title { get; set; }
        /// <summary>
        /// 內容
        /// </summary>
        public string Content { get; set; }
    }
    /// <summary>
    /// 相簿裡的相片
    /// </summary>
    public class GalleryPhotos : DetailRowModel
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
        /// 圖片來源
        /// </summary>
        public string PicSrcId { get;set; }
        /// <summary>
        /// 相片排序
        /// </summary>
        public int Sort { get; set; }
    }
    /// <summary>
    /// 相簿裡的相片資訊
    /// </summary>
    public class GalleryPhotosInfo : DetailRowModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 父行主鍵 - (GalleryPhotos)
        /// </summary>
        [LibDesc, Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        public string Title { get; set; }
    }
}
