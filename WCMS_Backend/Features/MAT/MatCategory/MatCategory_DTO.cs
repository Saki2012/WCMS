using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
namespace WCMS.Features.MAT.MatCategory;

public class MatCategoryDataSet_DTO : CategoryDataSet_DTO
{
    public List<MatCategoryInfoField_DTO> MatCategoryInfoField { get; set; } = [];
    public List<MatCategoryInfoFieldDisplay_DTO> MatCategoryInfoFieldDisplay { get; set; } = [];
}

public class MatCategoryInfoField_DTO : DetailRowModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
    [Key, StringLength(SysLengthParam.ID)] public string? CategoryId { get; set; }
    /// <summary>
    /// 父行主鍵 (_FileArchiveInfo)
    /// </summary>
    [LibDesc(ModelDisplayName.Common_ParentRowId)] public int? ParentRowId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [Key] public int? RowId { get; set; }
    /// <summary>
    /// 動態欄位Id
    /// </summary>
    [StringLength(SysLengthParam.ID)] public string? Field { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(CategoryId))] public Category_DTO? _Category { get; set; }
    #endregion
}

public class MatCategoryInfoFieldDisplay_DTO : DetailRowModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
    [Key, StringLength(SysLengthParam.ID)] public string? CategoryId { get; set; }
    /// <summary>
    /// 父行主鍵 (_FileArchiveInfo)
    /// </summary>
    [LibDesc(ModelDisplayName.Common_ParentRowId)] public int? ParentRowId { get; set; }
    /// <summary>
    /// 行主鍵
    /// </summary>
    [Key] public int? RowId { get; set; }
    /// <summary>
    /// 語系 SysEnum.Lang
    /// </summary>
    public LangCode? Lang { get; set; }
    /// <summary>
    /// 動態欄位顯示名稱
    /// </summary>
    [StringLength(SysLengthParam.Title)] public string? FieldDisplayName { get; set; }

    #region 主子表關聯
    [ForeignKey($@"{nameof(CategoryId)},{nameof(ParentRowId)}")] public MatCategoryInfoField_DTO? _MatCategoryInfoField { get; set; }
    #endregion
}
