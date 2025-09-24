using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    public class SpecUSRSet: ITSet
    {
        public SpecUSRModel SpecUSR { get; set; } = new();
        public List<SpecUSRDetail> SpecUSRDetail { get; set; } = [];
    }

    public class SpecUSRModel: MasterDataModel
    {
        /// <summary>
        /// USR Id
        /// </summary>
        [LibDesc, Key, StringLength(SysLengthParam.ID)] public string USRId { get; set; }
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
        [StringLength(SysLengthParam.Title)] public string? Tags { get; set; } = string.Empty;
        /// <summary>
        /// 圖片 (關聯檔案資料)
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.InternalId)] public string? PictureId { get; set; } = string.Empty;
        /// <summary>
        /// 圖片描述
        /// </summary>
        [LibDesc, StringLength(SysLengthParam.Memo)] public string? PicDescription { get; set; } = string.Empty;
        public List<SpecUSRDetail> SpecUSRDetail { get; set; } = [];
    }

    public class SpecUSRDetail:DetailRowModel
    {
        [LibDesc, Key, StringLength(SysLengthParam.ID)] public string USRId { get;set; }
        [LibDesc, Key] public int RowId { get; set; }
        [Required, StringLength(SysLengthParam.Lang)] public string Lang { get; set; } = default!;
        [StringLength(10)] public string? Year { get; set; }
        public int? AcademicYear { get; set; }
        [StringLength(1000)] public string? Courses { get; set; }
        [StringLength(1000)] public string? PracticeField { get; set; }
        [StringLength(1000)] public string? ProjectName { get; set; }
        [StringLength(1000)] public string? ExternalCooperationUnit { get; set; }
        [StringLength(1000)] public string? Department { get; set; }
        [StringLength(1000)] public string? DuringExecution { get; set; }
        public decimal? PlanAmount { get; set; }
        [StringLength(1000)] public string? ExecutionStrategy { get; set; }
        public string? ContentIntroduction { get; set; }
        [StringLength(1000)] public string? ProjectConcept { get; set; }
        [StringLength(4000)] public string? ProjectHighlights { get; set; }
        [StringLength(1000)] public string? ProjectLeader { get; set; }
        [StringLength(1000)] public string? Cohost1 { get; set; }
        [StringLength(1000)] public string? Cohost2 { get; set; }
        [StringLength(1000)] public string? Commissioned { get; set; }
        [StringLength(500)] public string? Remark { get; set; }
    }
}
