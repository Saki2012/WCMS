using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.Features.MAT.MatCategory;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.COMM.Category;

/// <summary>
/// 共用類別主表。
/// </summary>
public class Category : HeaderModel
{
    #region Property
    /// <summary>
    /// 類別 ID。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.CategoryId)]
    public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 對應功能模組 ID。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ProgId, DisplayName.Common_ProgId)]
    public string ProgId { get; set; } = string.Empty;
    /// <summary>
    /// 類別多語明細。
    /// </summary>
    [InverseProperty(nameof(CategoryDetail._Category))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<CategoryDetail> _CategoryDetail { get; set; } = [];
    /// <summary>
    /// MAT 類別欄位內部 Navigation；由 MatCategoryFormModel 對外代理。
    /// </summary>
    [JsonIgnore]
    [InverseProperty(nameof(MatCategoryInfoField._Category))]
    [LibField(ApiFieldMode.Ignore)]
    public List<MatCategoryInfoField> _MatCategoryInfoField { get; set; } = [];
    #endregion
}

/// <summary>
/// 共用類別多語明細。
/// </summary>
public class CategoryDetail : DetailModel
{
    #region Property
    /// <summary>
    /// 類別 ID。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.CategoryId)]
    public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵。
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    /// <summary>
    /// 語系。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 類別名稱。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Category_CategoryName)]
    public string CategoryName { get; set; } = string.Empty;
    /// <summary>
    /// 所屬類別。
    /// </summary>
    [ForeignKey(nameof(CategoryId))]
    [LibField(ApiFieldMode.Ignore)]
    public Category _Category { get; set; } = null!;
    #endregion
}
