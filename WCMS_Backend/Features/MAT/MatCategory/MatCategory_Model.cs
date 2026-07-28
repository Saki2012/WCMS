using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
namespace WCMS.Features.MAT.MatCategory;

/// <summary>
/// 
/// </summary>
public class MatCategoryDataSet : CategoryDataSet
{
    public new Category Category { get; set; } = new();
    public new List<CategoryDetail> CategoryDetail { get; set; } = [];
    public List<MatCategoryInfoField> MatCategoryInfoField { get; set; } = [];
    public List<MatCategoryInfoFieldDisplay> MatCategoryInfoFieldDisplay { get; set; } = [];
}
/// <summary>
/// 
/// </summary>
public class MatCategoryInfoField : DetailRowModel
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
    /// 
    /// </summary>
    public int RowNo { get; set; }
    /// <summary>
    /// 動態欄位Id
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Field), StringLength(SysLengthParam.ID)] public string Field { get; set; }
    
    #region 主子表關聯
    [ForeignKey(nameof(CategoryId))] public Category _Category { get; set; }
    [InverseProperty(nameof(MatCategoryInfoFieldDisplay._MatCategoryInfoField))] public List<MatCategoryInfoFieldDisplay> _MatCategoryInfoFieldDisplay { get; set; }
    #endregion
}
/// <summary>
/// 
/// </summary>
public class MatCategoryInfoFieldDisplay : DetailRowModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
    [Key, StringLength(SysLengthParam.ID)] public string CategoryId { get; set; }
    /// <summary>
    /// 父行主鍵 (_FileArchiveInfo)
    /// </summary>
    [Key, LibDesc(ModelDisplayName.Common_ParentRowId)] public int ParentRowId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [Key] public int RowId { get; set; }
    /// <summary>
    /// 語系 SysEnum.Lang
    /// </summary>
    public LangCode Lang { get; set; }
    /// <summary>
    /// 動態欄位顯示名稱
    /// </summary>
    [LibDesc(ModelDisplayName.Common_FieldDisplayName), StringLength(SysLengthParam.Title)] public string FieldDisplayName { get; set; }

    #region 主子表關聯
    [ForeignKey($@"{nameof(CategoryId)},{nameof(ParentRowId)}")] public MatCategoryInfoField _MatCategoryInfoField { get; set; }
    #endregion
}
