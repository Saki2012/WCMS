using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SpecFeatures.T1810.SiteEdit.SpecCategory;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch
{
    public class SpecResearchSet:ITSet
    {
        public SpecResearchModel SpecResearch { get; set; } = new();
        public List<SpecResearchDetailModel> SpecResearchDetail { get; set; } = [];
    }
    public class SpecResearchModel : MasterDataModel
    {
        /// <summary>
        /// 橫幅ID
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string ResearchId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [StringLength(SysLengthParam.ID)] public string CategoryId { get; set; }
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        [LibDesc] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.Title)] public string? Tags { get; set; } = string.Empty;

        #region 主子表關聯
        [InverseProperty(nameof(SpecResearchDetailModel._SpecResearch))] public List<SpecResearchDetailModel> _SpecResearchDetail { get; set; }
        #endregion
    }
    public class SpecResearchDetailModel : DetailRowModel
    {
        [LibDesc, Key, StringLength(SysLengthParam.ID)] public string ResearchId { get;set; }
        [LibDesc, Key] public int RowId { get; set; }
        [StringLength(SysLengthParam.Lang)] public string Lang { get; set; } = default!;
        public int? Year { get; set; }
        public int? AcademicYear { get; set; }
        [StringLength(10)] public string? Semester { get; set; }
        [StringLength(200)] public string? DuringExecution { get; set; }
        [StringLength(200)] public string? ContractPeriod { get; set; }
        [StringLength(200)] public string? ClassTime { get; set; }
        [StringLength(200)] public string? ProjectLeader { get; set; }
        [StringLength(200)] public string? Name { get; set; }
        [StringLength(200)] public string? TeachingStaffOfOurSchool { get; set; }
        [StringLength(200)] public string? ApprovalNumber { get; set; }
        public decimal? ApprovedAmount { get; set; }
        [StringLength(200)] public string? College { get; set; }
        [StringLength(200)] public string? Department { get; set; }
        [StringLength(200)] public string? GraduationDegree { get; set; }
        [StringLength(200)] public string? CooperatingUnits { get; set; }
        [StringLength(200)] public string? CooperationProject { get; set; }
        [StringLength(200)] public string? Courses { get; set; }
        [StringLength(SysLengthParam.Memo)] public string? ProjectName { get; set; }
        [StringLength(200)] public string? PaperTitle { get; set; }
        [StringLength(SysLengthParam.Memo)]public string? Remark { get; set; }
        [StringLength(200)] public string? Cohost1 { get; set; }
        [StringLength(200)] public string? Cohost2 { get; set; }
        [StringLength(200)] public string? Commissioned { get; set; }
        public decimal? PlanAmount { get; set; }
        public string? PlanContent { get; set; }
        [StringLength(200)] public string? Professor { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(ResearchId))] public SpecResearchModel _SpecResearch { get; set; }
        #endregion
    }
}
