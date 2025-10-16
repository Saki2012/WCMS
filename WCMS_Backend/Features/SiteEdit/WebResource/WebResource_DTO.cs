using WCMS.Features.SiteEdit.Tag;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.WebResource
{
    public class WebResourceSet_DTO : ITSet_DTO
    {
        public WebResource_DTO WebResource { get; set; } = new();
        public List<WebResourceInfo_DTO> WebResourceInfo { get; set; } = [];
    }
    /// <summary>
    /// 網路資源
    /// </summary>
    public class WebResource_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.WebResourceId)] public string?  WebResourceId { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Category)] public string?  Categories { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Tag)] public string?  Tags { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ContentStatus)] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 圖片顯示
        /// </summary>
        [LibDesc(ModelDisplayName.WebResource_PicId)] public string?  PicId { get; set; }
        /// <summary>
        /// 圖片顯示描述
        /// </summary>
        [LibDesc(ModelDisplayName.WebResource_PicDescription)] public string?  PicDescription { get; set; }

        #region 主子表關聯
        public List<WebResourceInfo_DTO>? _WebResourceInfo { get; set; }
        #endregion
    }
    /// <summary>
    /// 網路資源資訊
    /// </summary>
    public class WebResourceInfo_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(ModelDisplayName.WebResourceId)] public string?  WebResourceId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public string?  Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title)] public string?  Title { get; set; }
        /// <summary>
        /// 內容
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Content)] public string?  Content { get; set; }
        /// <summary>
        /// 超連結
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Url)] public string?  ResUrl { get; set; }
        /// <summary>
        /// 超連結開啟方式
        /// </summary>
        [LibDesc(ModelDisplayName.Common_UrlOpen)] public WindowTarget?  Url_OpenType { get; set; }
    }
}
