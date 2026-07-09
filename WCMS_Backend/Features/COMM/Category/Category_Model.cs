using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.MAT.MatCategory;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.I18n;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.COMM.Category;

public class Category : HeaderModel
{
    /// <summary>
    /// 類別ID
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.CategoryId)]
public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 對應功能模塊ID
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ProgId, DisplayName.Common_ProgId)]
public string ProgId { get; set; } = string.Empty;

    #region 主子表關聯
[InverseProperty(nameof(CategoryDetail._Category))]
[LibField(ApiFieldMode.ReadWrite)]
public List<CategoryDetail> _CategoryDetail { get; set; } = [];
[InverseProperty(nameof(MatCategoryInfoField._Category))]
[LibField(ApiFieldMode.ReadWrite)]
public List<MatCategoryInfoField> _MatCategoryInfoField { get; set; } = [];
    #endregion
}
public class CategoryDetail : DetailModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, DisplayName.CategoryId)]
public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 語系 SysEnum.Lang
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
public LangCode Lang { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Category_CategoryName)]
public string CategoryName { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(CategoryId))]
[LibField(ApiFieldMode.ReadOnly)]
public Category _Category { get; set; }= null!;
    #endregion
}
