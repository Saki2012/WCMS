using System.ComponentModel.DataAnnotations;
using WCMS.SpecFeatures.T1810.Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    /// <summary>
    /// 
    /// </summary>
    public class SpecUSRSet_DTO : ITSet_DTO
    {
        public SpecUSRModel_DTO SpecUSR { get; set; } = new();
        public List<SpecUSRDetail_DTO> SpecUSRDetail { get; set; } = [];
        public List<SpecUSRPhoto_DTO> SpecUSRPhoto { get; set; } = [];
        public List<SpecUSRPhotoInfo_DTO> SpecUSRPhotoInfo { get; set; } = [];
        public List<SpecUSRFile_DTO> SpecUSRFile { get; set; } = [];
        public List<SpecUSRUrl_DTO> SpecUSRUrl { get; set; } = [];
    }
    /// <summary>
    /// 
    /// </summary>
    public class SpecUSRModel_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// USR Id
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecUSRId),StringLength(SysLengthParam.ID), Key] public string? USRId { get; set; }
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
        /// <summary>
        /// 圖片 (關聯檔案資料)
        /// 注:後續應改關聯SpecUSRPhoto的RowId去指向對應的相片，以及SpecUSRPhotoInfo的Title
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecUSR_PictureId)] public string? PictureId { get; set; } = string.Empty;
        /// <summary>
        /// 圖片描述
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecUSR_PicDescription)] public string? PicDescription { get; set; } = string.Empty;

        #region 主子表關聯
        public List<SpecUSRDetail_DTO>? _SpecUSRDetail { get; set; }
        public List<SpecUSRPhoto_DTO>? _SpecUSRPhoto { get; set; }
        #endregion
    }
    /// <summary>
    /// 
    /// </summary>
    public class SpecUSRDetail_DTO
    {
        [LibDesc(SpecModelDisplayName.SpecUSRId),StringLength(SysLengthParam.ID), Key] public string? USRId { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        [LibDesc(ModelDisplayName.Common_Lang), Required, StringLength(5)] public string? Lang { get; set; } = default!;
        [LibDesc(SpecModelDisplayName.SpecUSR_Year), StringLength(10)] public string? Year { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_AcademicYear)] public int? AcademicYear { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_Courses), StringLength(200)] public string? Courses { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_PracticeField), StringLength(200)] public string? PracticeField { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_ProjectName), StringLength(200)] public string? ProjectName { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_ExternalCoUnits), StringLength(200)] public string? ExternalCooperationUnit { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_Department), StringLength(200)] public string? Department { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_DuringExecution), StringLength(200)] public string? DuringExecution { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_PlanAmount)] public decimal? PlanAmount { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_ExecutionStrategy)] public string? ExecutionStrategy { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_ContentIntro)] public string? ContentIntroduction { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_ProjectConcept)] public string? ProjectConcept { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_KeyHighlights)] public string? ProjectHighlights { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_ProjectLeader), StringLength(200)] public string? ProjectLeader { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_ProjectSubLeader), StringLength(1000)] public string? ProjectSubLeader { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_AttendTeam), StringLength(1000)] public string? AttendTeam { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_Cohost1), StringLength(200)] public string? Cohost1 { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_Cohost2), StringLength(200)] public string? Cohost2 { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_Commissioned), StringLength(200)] public string? Commissioned { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_Remark)] public string? Remark { get; set; }
        [LibDesc(SpecModelDisplayName.SpecUSR_ProjectItem)] public string? ProjectItem { get; set; }
        [Obsolete, LibDesc(SpecModelDisplayName.SpecUSR_Url)] public string? Url { get; set; }
        [Obsolete,LibDesc(SpecModelDisplayName.SpecUSR_UrlDescription)] public string? UrlDescription { get; set; }
    }

    /// <summary>
    ///USR相簿裡的相片
    /// </summary>
    public class SpecUSRPhoto_DTO 
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecUSRId),  StringLength(SysLengthParam.ID), Key] public string? USRId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        /// <summary>
        /// 圖片來源
        /// </summary>
        [StringLength(SysLengthParam.InternalId)] public string PicSrcId { get; set; }
        /// <summary>
        /// 相片排序
        /// </summary>
        [LibDesc(ModelDisplayName.Gallery_Sort)] public int Sort { get; set; }

        #region 主子表關聯
        public SpecUSRModel_DTO? _SpecUSR { get; set; }
        public List<SpecUSRPhotoInfo_DTO>? _SpecUSRPhotoInfo { get; set; }
        #endregion
    }
    /// <summary>
    /// USR相簿裡的相片資訊
    /// </summary>
    public class SpecUSRPhotoInfo_DTO 
    {
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecUSRId), StringLength(SysLengthParam.ID), Key] public string? USRId { get; set; }
        /// <summary>
        /// 父行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ParentRowId), Key] public int? ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang), StringLength(SysLengthParam.Lang)] public string? Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Title), StringLength(SysLengthParam.Memo)] public string? Title { get; set; }

        #region 主子表關聯
        public SpecUSRPhoto_DTO? _SpecUSRPhoto { get; set; }
        #endregion
    }
    /// <summary>
    /// USR檔案
    /// </summary>
    public class SpecUSRFile_DTO 
    {
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecUSRId), StringLength(SysLengthParam.ID), Key] public string? USRId { get; set; }
        /// <summary>
        /// 父行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ParentRowId), Key] public int? ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        public FileManageModel? FileSrc { get; set; }
        [LibDesc(ModelDisplayName.FileArchive_FileSrcId), StringLength(SysLengthParam.InternalId)] public string? FileSrcId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.FileArchive_FileName), StringLength(SysLengthParam.Title)] public string? FileName { get; set; }

        #region 主子表關聯
        public SpecUSRDetail_DTO? _SpecUSRDetail { get; set; }
        #endregion
    }
    /// <summary>
    /// USR外部網址設定
    /// </summary>
    public class SpecUSRUrl_DTO 
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecUSRId),StringLength(SysLengthParam.ID), Key] public string? USRId { get; set; }
        /// <summary>
        /// 父行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ParentRowId), Key] public int? ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int? RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Url),StringLength(SysLengthParam.Url)] public string? Url { get; set; }
        /// <summary>
        /// 網址描述
        /// </summary>
        [LibDesc(ModelDisplayName.Common_UrlDescription), StringLength(SysLengthParam.Title)] public string? UrlDescription { get; set; }
        /// <summary>
        /// 開啟連結方式
        /// </summary>
        [LibDesc(ModelDisplayName.SiteMenu_WindowTarget)] public WindowTarget WindowTarget { get; set; }

        #region 主子表關聯
        public SpecUSRDetail_DTO? _SpecUSRDetail { get; set; }
        #endregion
    }
}
