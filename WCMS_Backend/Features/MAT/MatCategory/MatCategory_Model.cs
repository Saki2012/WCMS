using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.Features.MAT.MatCategory;

/// <summary>
/// 再看看如何接該Set或表單了
/// </summary>
[LibDesc(DisplayName.MatCategoryDataSet)]
public class MatCategoryDataSet : CategoryDataSet
{
[LibField(ApiFieldMode.ReadWrite)]
public new Category Category { get; set; }= new();
[LibField(ApiFieldMode.ReadWrite)]
public new List<CategoryDetail> CategoryDetail { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite, DisplayName.MatCategoryInfoField)]
public List<MatCategoryInfoField> MatCategoryInfoField { get; set; }= [];
[LibField(ApiFieldMode.ReadWrite)]
public List<MatCategoryInfoFieldDisplay> MatCategoryInfoFieldDisplay { get; set; }= [];
}
/// <summary>
/// 
/// </summary>
public class MatCategoryInfoField : DetailModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
[Key, StringLength(SysLengthParam.ID)]
[LibField(ApiFieldMode.ReadOnly)]
public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly)]
public int RowId { get; set; }
    /// <summary>
    /// 動態欄位Id
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ID, DisplayName.Common_Field)]
public string Field { get; set; } = string.Empty;
    
    #region 主子表關聯
[ForeignKey(nameof(CategoryId))]
[LibField(ApiFieldMode.ReadOnly)]
public Category _Category { get; set; }
[InverseProperty(nameof(MatCategoryInfoFieldDisplay._MatCategoryInfoField))]
[LibField(ApiFieldMode.ReadWrite)]
public List<MatCategoryInfoFieldDisplay> _MatCategoryInfoFieldDisplay { get; set; } = [];
    #endregion
}
/// <summary>
/// 
/// </summary>
public class MatCategoryInfoFieldDisplay : DetailModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
[Key, StringLength(SysLengthParam.ID)]
[LibField(ApiFieldMode.ReadOnly)]
public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 父行主鍵 (_FileArchiveInfo)
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_ParentRowId)]
public int ParentRowId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
[Key]
[LibField(ApiFieldMode.ReadOnly)]
public int RowId { get; set; }
    /// <summary>
    /// 語系 SysEnum.Lang
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
public LangCode Lang { get; set; }
    /// <summary>
    /// 動態欄位顯示名稱
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, DisplayName.Common_FieldDisplayName)]
public string FieldDisplayName { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey($@"{nameof(CategoryId)},{nameof(ParentRowId)}")]
[LibField(ApiFieldMode.ReadOnly)]
public MatCategoryInfoField _MatCategoryInfoField { get; set; }
    #endregion
}
