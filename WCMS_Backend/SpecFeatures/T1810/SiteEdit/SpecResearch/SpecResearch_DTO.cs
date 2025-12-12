using System.ComponentModel.DataAnnotations;
using WCMS.SpecFeatures.T1810.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
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
        [LibDesc(SpecModelDisplayName.SpecResearchId), Key] public string? ResearchId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecResearch_Categories)] public string? CategoryId { get; set; }
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ContentStatus)] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecResearch_Tags)] public string? Tags { get; set; } = string.Empty;

        public List<SpecResearchDetailModel_DTO>? _SpecResearchDetail { get; set; } = [];
    }
    public class SpecResearchDetailModel_DTO
    {
        [LibDesc(SpecModelDisplayName.SpecResearchId), Key] public string? ResearchId { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        [LibDesc(ModelDisplayName.Common_Lang), StringLength(5)] public LangCode? Lang { get; set; } = default!;
        [LibDesc(SpecModelDisplayName.SpecResearch_Year)] public int? Year { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_AcademicYear)] public int? AcademicYear { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_Semester), StringLength(10)] public string? Semester { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_DuringExecution), StringLength(200)] public string? DuringExecution { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_ContractPeriod), StringLength(200)] public string? ContractPeriod { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_ClassTime), StringLength(200)] public string? ClassTime { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_ProjectLeader), StringLength(200)] public string? ProjectLeader { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_Name), StringLength(200)] public string? Name { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_TeachingStaffOfOurSchool), StringLength(200)] public string? TeachingStaffOfOurSchool { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_ApprovalNumber), StringLength(200)] public string? ApprovalNumber { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_ApprovedAmount)] public decimal? ApprovedAmount { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_College), StringLength(200)] public string? College { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_Department), StringLength(200)] public string? Department { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_Degree), StringLength(200)] public string? GraduationDegree { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_CoUnits), StringLength(200)] public string? CooperatingUnits { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_CoProject), StringLength(200)] public string? CooperationProject { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_Courses), StringLength(200)] public string? Courses { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_ProjectName)] public string? ProjectName { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_PaperTitle), StringLength(200)] public string? PaperTitle { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_Remark)] public string? Remark { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_Cohost1), StringLength(200)] public string? Cohost1 { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_Cohost2), StringLength(200)] public string? Cohost2 { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_Commissioned), StringLength(200)] public string? Commissioned { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_PlanAmount)] public decimal? PlanAmount { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_PlanContent)] public string? PlanContent { get; set; }
        [LibDesc(SpecModelDisplayName.SpecResearch_Professor), StringLength(200)] public string? Professor { get; set; }
    }
}
