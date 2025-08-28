using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.WebResource
{
    public class WebResourceSet : ITSet
    {
        public WebResource WebResource { get; set; } = new();
        public List<WebResourceInfo> WebResourceInfo { get; set; } = [];

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
        [LibDesc] public string Categories { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [LibDesc] public string Tags { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 圖片顯示
        /// </summary>
        [LibDesc] public string PicId { get; set; }
        /// <summary>
        /// 圖片顯示描述
        /// </summary>
        [LibDesc] public string PicDescription { get; set; }

        public List<WebResourceInfo> WebResourceInfo { get; set; } = [];

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
        /// <summary>
        /// 超連結
        /// </summary>
        public string ResUrl { get; set; }
        /// <summary>
        /// 超連結開啟方式
        /// </summary>
        public string Url_OpenType { get; set; }
    }
}
