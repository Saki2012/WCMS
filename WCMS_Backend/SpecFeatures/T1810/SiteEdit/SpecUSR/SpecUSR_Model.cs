using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    public class SpecUSRSet
    {
        public SpecUSRModel SpecUSR { get; set; } = new();
        public List<SpecUSRDetail> SpecUSRDetail { get; set; } = [];
    }

    public class SpecUSRModel: MasterDataModel
    {
        /// <summary>
        /// USR Id
        /// </summary>
        [LibDesc, Key] public string USRId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        public string CategoryId { get; set; }
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        [LibDesc] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [LibDesc] public string? Tags { get; set; } = string.Empty;
        /// <summary>
        /// 圖片 (關聯檔案資料)
        /// </summary>
        [LibDesc] public string? PictureId { get; set; } = string.Empty;
        /// <summary>
        /// 圖片描述
        /// </summary>
        [LibDesc] public string? PicDescription { get; set; } = string.Empty;
    }

    public class SpecUSRDetail:DetailRowModel
    {
        [LibDesc, Key] public string USRId { get;set; }
        [LibDesc, Key] public int RowId { get; set; }
        [Required, StringLength(5)] public string Lang { get; set; } = default!;
        [StringLength(10)] public string? Year { get; set; }
        [StringLength(10)] public string? AcademicYear { get; set; }
        [StringLength(200)] public string? Courses { get; set; }
        [StringLength(200)] public string? PracticeField { get; set; }
        [StringLength(200)] public string? ProjectName { get; set; }
        [StringLength(200)] public string? ExternalCooperationUnit { get; set; }
        [StringLength(200)] public string? Department { get; set; }
        [StringLength(200)] public string? DuringExecution { get; set; }
        [StringLength(200)] public string? PlanAmount { get; set; }
        public string? ExecutionStrategy { get; set; }
        public string? ContentIntroduction { get; set; }
        public string? ProjectConcept { get; set; }
        public string? ProjectHighlights { get; set; }
        [StringLength(200)] public string? ProjectLeader { get; set; }
        [StringLength(200)] public string? Cohost1 { get; set; }
        [StringLength(200)] public string? Cohost2 { get; set; }
        [StringLength(200)] public string? Commissioned { get; set; }
        public string? Remark { get; set; }
    }
}
