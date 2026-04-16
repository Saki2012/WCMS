using WCMS.Features._Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;

namespace WCMS.Features.WEB.PageManagement
{
    public class PageManagementSet_DTO : ITSet_DTO
    {
        public PageManagement_DTO PageManagement { get; set; } = new();
        public List<PageManagementDetail_DTO> PageManagementDetail { get; set; } = [];
    }
    public class PageManagement_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc(ModelDisplayName.PageId)] public string? PageId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Category)] public string? CategoryId { get; set; }

        #region 主子表關聯
        public List<PageManagementDetail_DTO>? _PageManagementDetail { get; set; }
        #endregion
    }
    public class PageManagementDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc(ModelDisplayName.PageId)] public string? PageId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title)] public string? Title { get; set; }
        /// <summary>
        /// 內容
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Content)] public string? Content { get; set; }
    }
}
