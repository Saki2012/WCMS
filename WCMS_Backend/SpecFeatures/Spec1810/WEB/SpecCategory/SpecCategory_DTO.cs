using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1810.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecCategory;

public class SpecCategorySet_DTO : ITSet_DTO
{
    public SpecCategoryModel_DTO SpecCategory { get; set; } = new();
    public List<SpecCategoryDetailModel_DTO> SpecCategoryDetail { get; set; } = [];
}

public class SpecCategoryModel_DTO : DTOBasicDataModel
{
    [LibDesc(SpecModelDisplayName.SpecCategoryId)] public string CategoryId { get; set; }
    /// <summary>
    /// 功能Id
    /// </summary>
    [LibDesc(ModelDisplayName.Common_ProgId)] public string ProgId { get; set; }
    /// <summary>
    /// 顯示欄位
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecCategory_ShowColumn)] public string ShowColumnItems { get; set; }
    public List<SpecCategoryDetailModel_DTO>? _SpecCategoryDetail { get; set; } = [];
}

public class SpecCategoryDetailModel_DTO
{
    /// <summary>
    /// 
    /// </summary>
    [LibDesc(SpecModelDisplayName.SpecCategoryId)] public string CategoryId { get; set; }
    [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode Lang { get; set; }
    [LibDesc(SpecModelDisplayName.SpecCategory_Name)] public string CategoryName { get; set; }
}
