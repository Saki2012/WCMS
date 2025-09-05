using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.SiteEdit.Category;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.PageManagement
{
    public class PageManagementSet:ITSet
    {
        public PageManagement PageManagement { get; set; } = new();
        public List<PageManagementDetail> PageManagementDetail { get; set; } = [];
    }
    public class PageManagement:BillDataModel
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc,Key, StringLength(SysLengthParam.ID)] public string? PageId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.ID)] public string? CategoryId { get; set; }

        //[ForeignKey(nameof(CategoryId))] public virtual Category.Category Category { get; set; }
        /// <summary>
        /// 查看次數
        /// </summary>
        [LibDesc] public int? ViewCount { get; set; }

        #region Detail關聯
        [ForeignKey(nameof(PageId))] public virtual ICollection<PageManagementDetail>? PageManagementDetail { get; set; }
        #endregion
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
