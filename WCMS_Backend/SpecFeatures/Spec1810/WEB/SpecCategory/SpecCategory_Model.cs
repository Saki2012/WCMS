using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.I18n;
using WCMS.SpecFeatures.Spec1810._Resx;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SpecFeatures.Spec1817._Resx;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecCategory;

public class SpecCategorySet : ITSet
{
    [LibField(ApiFieldMode.ReadWrite)]
    public SpecCategoryModel SpecCategory { get; set; } = new();
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecCategoryDetailModel> SpecCategoryDetail { get; set; } = [];
}

public class SpecCategoryModel : MasterDataModel
{
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.SpecCategoryId)]
    public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 功能Id
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ProgId, DisplayName.Common_ProgId)]
    public string ProgId { get; set; } = string.Empty;
    /// <summary>
    /// 顯示欄位
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecCategory_ShowColumn)]
    public string ShowColumnItems { get; set; } = string.Empty;

    #region 主子表關聯
    [InverseProperty(nameof(SpecCategoryDetailModel._SpecCategory))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecCategoryDetailModel> _SpecCategoryDetail { get; set; } = [];
    #endregion
}

public class SpecCategoryDetailModel : DetailRowModel
{
    /// <summary>
    /// 
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.SpecCategoryId)]
    public string CategoryId { get; set; } = string.Empty;
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
    public int RowId { get; set; }
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Name, SpecDisplayName.SpecCategory_Name)]
    public string CategoryName { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(CategoryId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SpecCategoryModel _SpecCategory { get; set; }
    #endregion
}
