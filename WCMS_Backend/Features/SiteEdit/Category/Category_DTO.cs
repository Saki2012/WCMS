using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.Category
{
    public class CategoryDataSet_DTO : ITSet_DTO
    {
        public Category_DTO Category { get; set; } = new();
        public List<CategoryDetail_DTO> CategoryDetail { get; set; } = [];
    }
    public class Category_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc(ModelDisplayName.CategoryId)] public string? CategoryId { get; set; }
        /// <summary>
        /// 對應功能模塊ID
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ProgId)] public string? ProgId { get; set; }

        #region 主子表關聯
        public List<CategoryDetail_DTO>? _CategoryDetail { get; set; }
        #endregion
    }
    public class CategoryDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc(ModelDisplayName.CategoryId)] public string? CategoryId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Category_CategoryName)] public string? CategoryName { get; set; }
    }
}
