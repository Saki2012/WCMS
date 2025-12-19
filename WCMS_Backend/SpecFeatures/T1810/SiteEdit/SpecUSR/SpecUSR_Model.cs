using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    /// <summary>
    /// 
    /// </summary>
    public class SpecUSRSet: ITSet
    {
        public SpecUSRModel SpecUSR { get; set; } = new();
        public List<SpecUSRDetail> SpecUSRDetail { get; set; } = [];
        public List<SpecUSRPhoto> SpecUSRPhoto { get; set; } = [];
        public List<SpecUSRPhotoInfo> SpecUSRPhotoInfo { get; set; } = [];
        public List<SpecUSRFile> SpecUSRFile { get; set; } = [];
        public List<SpecUSRUrl> SpecUSRUrl { get; set; } = [];
    }
    /// <summary>
    /// 
    /// </summary>
    public class SpecUSRModel: MasterDataModel
    {
        /// <summary>
        /// USR Id
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string USRId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [StringLength(SysLengthParam.ID)] public string CategoryId { get; set; }
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string? Tags { get; set; } = string.Empty;
        /// <summary>
        /// 圖片 (關聯檔案資料)
        /// 注:後續應改關聯SpecUSRPhoto的RowId去指向對應的相片，以及SpecUSRPhotoInfo的Title
        /// </summary>
        [StringLength(SysLengthParam.InternalId)] public string? PictureId { get; set; } = string.Empty;
        /// <summary>
        /// 圖片描述
        /// </summary>
        [StringLength(SysLengthParam.Memo)] public string? PicDescription { get; set; } = string.Empty;

        #region 主子表關聯
        [InverseProperty(nameof(SpecUSRDetail._SpecUSR))] public List<SpecUSRDetail> _SpecUSRDetail { get; set; }
        [InverseProperty(nameof(SpecUSRPhoto._SpecUSR))] public List<SpecUSRPhoto> _SpecUSRPhoto { get; set; }
        #endregion
    }
    /// <summary>
    /// 
    /// </summary>
    public class SpecUSRDetail:DetailRowModel
    {
        [Key, StringLength(SysLengthParam.ID)] public string USRId { get;set; }
        [Key] public int RowId { get; set; }
        [Required] public LangCode Lang { get; set; } = default!;
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
        [StringLength(1000)] public string? ProjectSubLeader { get; set; }
        [StringLength(1000)] public string? AttendTeam { get; set; }
        [StringLength(1000)] public string? Cohost1 { get; set; }
        [StringLength(1000)] public string? Cohost2 { get; set; }
        [StringLength(1000)] public string? Commissioned { get; set; }
        [StringLength(500)] public string? Remark { get; set; }
        [StringLength(500)] public string? ProjectItem { get; set; }
        [Obsolete, StringLength(SysLengthParam.Url)] public string? Url { get; set; }
        [Obsolete, StringLength(SysLengthParam.Url)] public string? UrlDescription { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(USRId))] public SpecUSRModel _SpecUSR { get; set; }
        [InverseProperty(nameof(SpecUSRFile._SpecUSRDetail))] public List<SpecUSRFile> _SpecUSRFile { get; set; }
        [InverseProperty(nameof(SpecUSRUrl._SpecUSRDetail))] public List<SpecUSRUrl> _SpecUSRUrl { get; set; }
        #endregion
    }
    /// <summary>
    ///USR相簿裡的相片
    /// </summary>
    public class SpecUSRPhoto : DetailRowModel
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [Required, Key, StringLength(SysLengthParam.ID)] public string USRId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [Key] public int RowId { get; set; }
        /// <summary>
        /// 圖片來源
        /// </summary>
        [StringLength(SysLengthParam.InternalId)] public string PicSrcId { get; set; }
        /// <summary>
        /// 相片排序
        /// </summary>
        public int Sort { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(USRId))] public SpecUSRModel _SpecUSR { get; set; }
        [InverseProperty(nameof(SpecUSRPhotoInfo._SpecUSRPhoto))] public List<SpecUSRPhotoInfo> _SpecUSRPhotoInfo { get; set; }
        #endregion
    }
    /// <summary>
    /// USR相簿裡的相片資訊
    /// </summary>
    public class SpecUSRPhotoInfo : DetailRowModel
    {
        /// <summary>
        /// 
        /// </summary>
        [Required, Key, StringLength(SysLengthParam.ID)] public string USRId { get; set; }
        /// <summary>
        /// 父行主鍵
        /// </summary>
        [Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        public LangCode Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [StringLength(SysLengthParam.Memo)] public string Title { get; set; }

        #region 主子表關聯
        [ForeignKey($@"{nameof(USRId)},{nameof(ParentRowId)}")] public SpecUSRPhoto _SpecUSRPhoto { get; set; }
        #endregion
    }
    /// <summary>
    /// USR檔案
    /// </summary>
    public class SpecUSRFile : DetailRowModel
    {
        /// <summary>
        /// 
        /// </summary>
        [Required, Key, StringLength(SysLengthParam.ID)] public string USRId { get; set; }
        /// <summary>
        /// 父行主鍵
        /// </summary>
        [Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [Key] public int RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [StringLength(SysLengthParam.InternalId)] public string FileSrcId { get; set; }
        [ForeignKey(nameof(FileSrcId))] public FileManageModel FileSrc { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string FileName { get; set; }

        #region 主子表關聯
        [ForeignKey($@"{nameof(USRId)},{nameof(ParentRowId)}")] public SpecUSRDetail _SpecUSRDetail { get; set; }
        #endregion
    }
    /// <summary>
    /// USR外部網址設定
    /// </summary>
    public class SpecUSRUrl : DetailRowModel
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [Required, Key, StringLength(SysLengthParam.ID)] public string USRId { get; set; }
        /// <summary>
        /// 父行主鍵
        /// </summary>
        [Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [Key] public int RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [StringLength(SysLengthParam.Url)] public string Url { get; set; }
        /// <summary>
        /// 網址描述
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string UrlDescription { get; set; }
        /// <summary>
        /// 開啟連結方式
        /// </summary>
        public WindowTarget WindowTarget { get; set; }

        #region 主子表關聯
        [ForeignKey($@"{nameof(USRId)},{nameof(ParentRowId)}")] public SpecUSRDetail _SpecUSRDetail { get; set; }
        #endregion
    }
}
