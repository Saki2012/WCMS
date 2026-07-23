using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.I18n.Metadata;
using WCMS.SysCore.I18n;
using WCMS.SpecFeatures.Spec1810._Resx;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.Features.WEB.Content;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecResearch;

public class SpecResearch : HeaderModel
{
    /// <summary>
    /// 橫幅ID
    /// </summary>
[Key]
[LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.SpecResearchId)]
public string ResearchId { get; set; } = string.Empty;
    /// <summary>
    /// 類別ID
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, SpecModelDisplayName.SpecResearch_Categories)]
public string CategoryId { get; set; } = string.Empty;
    /// <summary>
    /// 狀態 (多個)
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_ContentStatus)]
    public ContentStatus ContentStatus { get; set; }
    /// <summary>
    /// 標籤 (多個) 
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecModelDisplayName.SpecResearch_Tags)]
public string Tags { get; set; }= string.Empty;

    #region 主子表關聯
[InverseProperty(nameof(SpecResearchDetail._SpecResearch))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecResearchDetail> _SpecResearchDetail { get; set; } = [];
    #endregion
}
public class SpecResearchDetail : FormDetailModel
{
[Key]
[LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.SpecResearchId)]
public string ResearchId { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }= default!;
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecResearch_Year)]
    public int Year { get; set; }
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecResearch_AcademicYear)]
    public int AcademicYear { get; set; }
[LibStr(ApiFieldMode.ReadWrite, 10, SpecModelDisplayName.SpecResearch_Semester)]
public string Semester { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_DuringExecution)]
public string DuringExecution { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_ContractPeriod)]
public string ContractPeriod { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_ClassTime)]
public string ClassTime { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_ProjectLeader)]
public string ProjectLeader { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_Name)]
public string Name { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_TeachingStaffOfOurSchool)]
public string TeachingStaffOfOurSchool { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_ApprovalNumber)]
public string ApprovalNumber { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecResearch_ApprovedAmount)]
    public decimal ApprovedAmount { get; set; }
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_College)]
public string College { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_Department)]
public string Department { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_Degree)]
public string GraduationDegree { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_CoUnits)]
public string CooperatingUnits { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_CoProject)]
public string CooperationProject { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_Courses)]
public string Courses { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, SpecModelDisplayName.SpecResearch_ProjectName)]
public string ProjectName { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_PaperTitle)]
public string PaperTitle { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, SpecModelDisplayName.SpecResearch_Remark)]
public string Remark { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_Cohost1)]
public string Cohost1 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_Cohost2)]
public string Cohost2 { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_Commissioned)]
public string Commissioned { get; set; } = string.Empty;
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecResearch_PlanAmount)]
    public decimal PlanAmount { get; set; }
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.SpecResearch_PlanContent)]
    public string PlanContent { get; set; } = string.Empty;
[LibStr(ApiFieldMode.ReadWrite, 200, SpecModelDisplayName.SpecResearch_Professor)]
public string Professor { get; set; } = string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(ResearchId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecResearch _SpecResearch { get; set; }
    #endregion
}
