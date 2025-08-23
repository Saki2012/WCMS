using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.Category
{
    public class CategoryDataSet:ITSet
    {
        public Category Category { get; set; } = new();
        public List<CategoryDetail> CategoryDetail { get; set; } = [];
    }
    public class Category : MasterDataModel
    {
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc, Key] public string? CategoryId { get; set; }
        /// <summary>
        /// 對應功能模塊ID
        /// </summary>
        [LibDesc] public string? ProgId { get; set; }
        /// <summary>
        /// 類別明細
        /// </summary>
        public virtual ICollection<CategoryDetail>? CategoryDetail { get; set; }
    }
    public class CategoryDetail : DetailRowModel
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc, Key] public string CategoryId { get; set; }
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
        public string CategoryName { get; set; }
    }
}
