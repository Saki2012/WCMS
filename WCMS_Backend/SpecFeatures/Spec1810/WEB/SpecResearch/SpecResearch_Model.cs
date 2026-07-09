using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SpecFeatures.Spec1810._Resx;
using WCMS.SysCore.FeatureDriver.Resx;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecResearch;

public class SpecResearchSet:ITSet
{
    [LibField(ApiFieldMode.ReadWrite)]
    public SpecResearchModel SpecResearch { get; set; }= new();
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecResearchDetailModel> SpecResearchDetail { get; set; }= [];
}
public class SpecResearchModel : MasterDataModel
{
    /// <summary>
    /// 橫幅ID
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.SpecResearchId)]
public string ResearchId { get; set; } = string.Empty;
    /// <summary>
    /// 類別ID
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ID, SpecDisplayName.SpecResearch_Categories)]
public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 狀態 (多個)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_ContentStatus)]
    public ContentStatus ContentStatus { get; set; }
    /// <summary>
    /// 標籤 (多個) 
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.SpecResearch_Tags)]
public string Tags { get; set; }= string.Empty;

    #region 主子表關聯
[InverseProperty(nameof(SpecResearchDetailModel._SpecResearch))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecResearchDetailModel> _SpecResearchDetail { get; set; } = [];
    #endregion
}
public class SpecResearchDetailModel : DetailRowModel
{
[Key]
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.SpecResearchId)]
public string ResearchId { get; set; } = string.Empty;
[Key]
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }= default!;
    [LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecResearch_Year)]
    public int Year { get; set; }
    [LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecResearch_AcademicYear)]
    public int AcademicYear { get; set; }
[LibStr(ApiFieldMode.ReadWrite, 10, SpecDisplayName.SpecResearch_Semester)]
public string Semester { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_DuringExecution)]
public string DuringExecution { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_ContractPeriod)]
public string ContractPeriod { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_ClassTime)]
public string ClassTime { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_ProjectLeader)]
public string ProjectLeader { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_Name)]
public string Name { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_TeachingStaffOfOurSchool)]
public string TeachingStaffOfOurSchool { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_ApprovalNumber)]
public string ApprovalNumber { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecResearch_ApprovedAmount)]
    public decimal ApprovedAmount { get; set; }
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_College)]
public string College { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_Department)]
public string Department { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_Degree)]
public string GraduationDegree { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_CoUnits)]
public string CooperatingUnits { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_CoProject)]
public string CooperationProject { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_Courses)]
public string Courses { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, SpecDisplayName.SpecResearch_ProjectName)]
public string ProjectName { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_PaperTitle)]
public string PaperTitle { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Memo, SpecDisplayName.SpecResearch_Remark)]
public string Remark { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_Cohost1)]
public string Cohost1 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_Cohost2)]
public string Cohost2 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_Commissioned)]
public string Commissioned { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecResearch_PlanAmount)]
    public decimal PlanAmount { get; set; }
    [LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecResearch_PlanContent)]
    public string PlanContent { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecDisplayName.SpecResearch_Professor)]
public string Professor { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(ResearchId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecResearchModel _SpecResearch { get; set; }
    #endregion
}
