using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using WCMS.SysCore.Enum;
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
        [Key, StringLength(SysLengthParam.ID)] public string? CategoryId { get; set; }
        /// <summary>
        /// 對應功能模塊ID
        /// </summary>
        [StringLength(SysLengthParam.ProgId)] public string? ProgId { get; set; }
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
        [Key, StringLength(SysLengthParam.ID)] public string CategoryId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [StringLength(SysLengthParam.Lang)] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string CategoryName { get; set; }
    }
}
