using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.Features.SystemSetting.SiteInfo.SiteMenuSetting.ModuleOptions;

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

        #region 主子表關聯
        [InverseProperty(nameof(CategoryDetail._Category))] public List<CategoryDetail>? _CategoryDetail { get; set; }
        #endregion
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
        [StringLength(SysLengthParam.Title)] public string CategoryName { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(CategoryId))] public Category _Category { get; set; } = null!;
        #endregion
    }
}
