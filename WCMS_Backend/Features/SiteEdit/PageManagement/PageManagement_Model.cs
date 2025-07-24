using System.ComponentModel.DataAnnotations;
using WCMS.Features.SiteEdit.Category;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.PageManagement
{
    public class PageManagementSet
    {
        public required PageManagement PageManagement { get; set; }
        public required List<PageManagementDetail> PageManagementDetail { get; set; }
    }

    public class PageManagement:BillDataModel
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc,Key] public string? PageId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc] public string? CategoryId { get; set; }
        /// <summary>
        /// 查看次數
        /// </summary>
        [LibDesc] public int? ViewCount { get; set; }

        public virtual ICollection<PageManagementDetail>? PageManagementDetail { get; set; }

    }
    public class PageManagementDetail:DetailRowModel
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc, Key] public string? PageId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int? RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public string? Lang { get;set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc] public string? Title { get; set; }
        /// <summary>
        /// 內容
        /// </summary>
        [LibDesc] public string? Content { get; set; }
    }
}
