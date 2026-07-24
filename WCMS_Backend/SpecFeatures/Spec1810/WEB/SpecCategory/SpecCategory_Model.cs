using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.I18n.Metadata;
using WCMS.SysCore.I18n;
using WCMS.SpecFeatures.Spec1810._Resx;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecCategory;

public class SpecCategory : HeaderModel
{
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.SpecCategoryId)]
    public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 功能Id
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ProgId, DisplayName.Common_ProgId)]
    public string ProgId { get; set; } = string.Empty;
    /// <summary>
    /// 顯示欄位
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecCategory_ShowColumn)]
    public string ShowColumnItems { get; set; } = string.Empty;

    #region 主子表關聯
    [InverseProperty(nameof(SpecCategoryDetail._SpecCategory))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecCategoryDetail> _SpecCategoryDetail { get; set; } = [];
    #endregion
}

public class SpecCategoryDetail : FormDetailModel
{
    /// <summary>
    /// 
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.SpecCategoryId)]
    public string CategoryId { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, SpecModelDisplayName.SpecCategory_Name)]
    public string CategoryName { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(CategoryId))]
    [LibField(ApiFieldMode.Ignore)]
    public SpecCategory _SpecCategory { get; set; }
    #endregion
}
