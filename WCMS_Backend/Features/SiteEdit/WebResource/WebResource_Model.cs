using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.WebResource
{
    public class WebResourceSet
    {
        public required WebResource WebResource { get; set; }
        public required List<WebResourceInfo> WebResourceInfo { get; set; }

    }
    /// <summary>
    /// 網路資源
    /// </summary>
    public class WebResource : MasterDataModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key] public string WebResourceId { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [LibDesc] public string CategoriesId { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [LibDesc] public string TagsId { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc] public int Status { get; set; }
        /// <summary>
        /// 資源類型:1. 上傳圖片、2. 外網資源(圖片網址 or Youtube)
        /// </summary>
        public byte SrcType { get; set; }
        /// <summary>
        /// 根據SrcType決定是FileInfo還是單純網址
        /// </summary>
        public string SrcData { get; set; }
        /// <summary>
        /// 超連結
        /// </summary>
        public string ResUrl { get; set; }
        /// <summary>
        /// 超連結開啟方式
        /// </summary>
        public string Url_OpenType { get; set; }
        /// <summary>
        /// 排序
        /// </summary>
        public int Sort { get; set; }
    }
    /// <summary>
    /// 網路資源資訊
    /// </summary>
    public class WebResourceInfo : DetailRowModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key] public string WebResourceId { get; set; }
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
}
