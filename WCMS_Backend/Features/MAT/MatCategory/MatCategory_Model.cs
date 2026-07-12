using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Form;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.Features.MAT.MatCategory;

/// <summary>
/// MAT 類別組合式表單模型。
/// </summary>
[LibDesc(DisplayName.MatCategoryFormModel)]
public class MatCategoryFormModel : IFormModel<Category>
{
    #region Property
    private Category _category = new();
    /// <summary>
    /// 共用 Category Root DbModel。
    /// </summary>
    [FormRoot]
    [LibField(ApiFieldMode.ReadWrite)]
    public Category Category
    {
        get => _category;
        set
        {
            List<MatCategoryInfoField> currentGraph = _category._MatCategoryInfoField;
            _category = value ?? new Category();
            if (_category._MatCategoryInfoField.Count == 0 && currentGraph.Count > 0) _category._MatCategoryInfoField = currentGraph;
        }
    }
    /// <summary>
    /// MAT 類別自訂欄位。
    /// </summary>
    [FormGraphPath(nameof(Category._MatCategoryInfoField))]
    [LibField(ApiFieldMode.ReadWrite, DisplayName.MatCategoryInfoField)]
    public List<MatCategoryInfoField> MatCategoryInfoField
    {
        get => _category._MatCategoryInfoField;
        set => _category._MatCategoryInfoField = value ?? [];
    }
    #endregion

    #region Private
    /// <summary>
    /// 取得 Category Root DbModel。
    /// </summary>
    Category IFormModel<Category>.GetRoot() => Category;
    /// <summary>
    /// 設定 Category Root DbModel。
    /// </summary>
    void IFormModel<Category>.SetRoot(Category rootModel) => Category = rootModel;
    #endregion
}

/// <summary>
/// MAT 類別自訂欄位。
/// </summary>
public class MatCategoryInfoField : DetailModel
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
    /// 動態欄位 ID。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, DisplayName.Common_Field)]
    public string Field { get; set; } = string.Empty;
    /// <summary>
    /// 所屬 Category。
    /// </summary>
    [ForeignKey(nameof(CategoryId))]
    [LibField(ApiFieldMode.Ignore)]
    public Category _Category { get; set; } = null!;
    /// <summary>
    /// 動態欄位多語顯示名稱。
    /// </summary>
    [InverseProperty(nameof(MatCategoryInfoFieldDisplay._MatCategoryInfoField))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<MatCategoryInfoFieldDisplay> _MatCategoryInfoFieldDisplay { get; set; } = [];
    #endregion
}

/// <summary>
/// MAT 類別自訂欄位多語顯示名稱。
/// </summary>
public class MatCategoryInfoFieldDisplay : DetailModel
{
    #region Property
    /// <summary>
    /// 類別 ID。
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.CategoryId)]
    public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 父行主鍵。
    /// </summary>
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
    public int ParentRowId { get; set; }
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
    /// 動態欄位顯示名稱。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_FieldDisplayName)]
    public string FieldDisplayName { get; set; } = string.Empty;
    /// <summary>
    /// 所屬 MAT 類別自訂欄位。
    /// </summary>
    [ForeignKey($"{nameof(CategoryId)},{nameof(ParentRowId)}")]
    [LibField(ApiFieldMode.Ignore)]
    public MatCategoryInfoField _MatCategoryInfoField { get; set; } = null!;
    #endregion
}
