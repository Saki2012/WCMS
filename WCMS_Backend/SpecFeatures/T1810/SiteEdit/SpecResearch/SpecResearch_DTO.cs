using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch
{

    public class SpecResearchSet_DTO : ITSet_DTO
    {
        public SpecResearchModel_DTO SpecResearch { get; set; } = new();
        public List<SpecResearchDetailModel_DTO> SpecResearchDetail { get; set; } = [];
    }
    public class SpecResearchModel_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 橫幅ID
        /// </summary>
        [LibDesc(ModelDisplayName.SpecResearchId), Key] public string? ResearchId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc(ModelDisplayName.SpecResearch_Categories)] public string? CategoryId { get; set; }
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ContentStatus)] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [LibDesc(ModelDisplayName.SpecResearch_Tags)] public string? Tags { get; set; } = string.Empty;

        public List<SpecResearchDetailModel_DTO>? _SpecResearchDetail { get; set; } = [];
    }
    public class SpecResearchDetailModel_DTO
    {
        [LibDesc(ModelDisplayName.SpecResearchId), Key] public string? ResearchId { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        [LibDesc(ModelDisplayName.Common_Lang), StringLength(5)] public string? Lang { get; set; } = default!;
        [LibDesc(ModelDisplayName.SpecResearch_Year)] public int? Year { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_AcademicYear)] public int? AcademicYear { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Semester), StringLength(10)] public string? Semester { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_DuringExecution), StringLength(200)] public string? DuringExecution { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ContractPeriod), StringLength(200)] public string? ContractPeriod { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ClassTime), StringLength(200)] public string? ClassTime { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ProjectLeader), StringLength(200)] public string? ProjectLeader { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Name), StringLength(200)] public string? Name { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_TeachingStaffOfOurSchool), StringLength(200)] public string? TeachingStaffOfOurSchool { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ApprovalNumber), StringLength(200)] public string? ApprovalNumber { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ApprovedAmount)] public decimal? ApprovedAmount { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_College), StringLength(200)] public string? College { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Department), StringLength(200)] public string? Department { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Degree), StringLength(200)] public string? GraduationDegree { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_CoUnits), StringLength(200)] public string? CooperatingUnits { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_CoProject), StringLength(200)] public string? CooperationProject { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Courses), StringLength(200)] public string? Courses { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ProjectName)] public string? ProjectName { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_PaperTitle), StringLength(200)] public string? PaperTitle { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Remark)] public string? Remark { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Cohost1), StringLength(200)] public string? Cohost1 { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Cohost2), StringLength(200)] public string? Cohost2 { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Commissioned), StringLength(200)] public string? Commissioned { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_PlanAmount)] public decimal? PlanAmount { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_PlanContent)] public string? PlanContent { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Professor), StringLength(200)] public string? Professor { get; set; }
    }
}
