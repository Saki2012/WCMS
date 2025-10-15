using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{

    public class SpecUSRSet_DTO : ITSet_DTO
    {
        public SpecUSRModel_DTO SpecUSR { get; set; } = new();
        public List<SpecUSRDetail_DTO> SpecUSRDetail { get; set; } = [];
    }

    public class SpecUSRModel_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// USR Id
        /// </summary>
        [LibDesc(ModelDisplayName.SpecUSRId), Key] public string? USRId { get; set; }
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
        /// <summary>
        /// 圖片 (關聯檔案資料)
        /// </summary>
        [LibDesc(ModelDisplayName.SpecUSR_PictureId)] public string? PictureId { get; set; } = string.Empty;
        /// <summary>
        /// 圖片描述
        /// </summary>
        [LibDesc(ModelDisplayName.SpecUSR_PicDescription)] public string? PicDescription { get; set; } = string.Empty;
        public List<SpecUSRDetail_DTO> _SpecUSRDetail { get; set; }
    }

    public class SpecUSRDetail_DTO
    {
        [LibDesc(ModelDisplayName.SpecUSRId), Key] public string? USRId { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        [LibDesc(ModelDisplayName.Common_Lang), Required, StringLength(5)] public string? Lang { get; set; } = default!;
        [LibDesc(ModelDisplayName.SpecUSR_Year), StringLength(10)] public string? Year { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_AcademicYear)] public int? AcademicYear { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Courses), StringLength(200)] public string? Courses { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_PracticeField), StringLength(200)] public string? PracticeField { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ProjectName), StringLength(200)] public string? ProjectName { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ExternalCoUnits), StringLength(200)] public string? ExternalCooperationUnit { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Department), StringLength(200)] public string? Department { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_DuringExecution), StringLength(200)] public string? DuringExecution { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_PlanAmount)] public decimal? PlanAmount { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ExternalCoUnits)] public string? ExecutionStrategy { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ContentIntro)] public string? ContentIntroduction { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ProjectConcept)] public string? ProjectConcept { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_KeyHighlights)] public string? ProjectHighlights { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ProjectLeader), StringLength(200)] public string? ProjectLeader { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Cohost1), StringLength(200)] public string? Cohost1 { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Cohost2), StringLength(200)] public string? Cohost2 { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Commissioned), StringLength(200)] public string? Commissioned { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Remark)] public string? Remark { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ProjectItem)] public string? ProjectItem { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Url)] public string? Url { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_UrlDescription)] public string? UrlDescription { get; set; }
    }
}
