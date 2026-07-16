using System.ComponentModel.DataAnnotations;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1810._Resx;
using WCMS.SysCore.I18n;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecCategory;

public class SpecCategorySet_DTO : ITSet_DTO
{
    public SpecCategory_DTO SpecCategory { get; set; } = new();
    public List<SpecCategoryDetail_DTO> SpecCategoryDetail { get; set; } = [];
}

public class SpecCategory_DTO : DTOBasicDataModel
{
    [LibDesc(SpecModelDisplayName.SpecCategoryId), StringLength(SysLengthParam.ID)] public string CategoryId { get; set; }
    /// <summary>
    /// 功能Id
    /// </summary>
    [LibDesc(ModelDisplayName.Common_ProgId), StringLength(SysLengthParam.ProgId)] public string ProgId { get; set; }
    /// <summary>
    /// 顯示欄位
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecCategory_ShowColumn)] public string ShowColumnItems { get; set; }
    public List<SpecCategoryDetail_DTO>? _SpecCategoryDetail { get; set; } = [];
}

public class SpecCategoryDetail_DTO
{
    /// <summary>
    /// 
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecCategoryId), StringLength(SysLengthParam.ID)] public string CategoryId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode Lang { get; set; }
    [LibDesc(SpecModelDisplayName.SpecCategory_Name), StringLength(SysLengthParam.Name)] public string CategoryName { get; set; }
}
