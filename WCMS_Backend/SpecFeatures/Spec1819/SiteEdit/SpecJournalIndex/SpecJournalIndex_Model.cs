using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SpecFeatures.Spec1819.Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;

namespace WCMS.SpecFeatures.Spec1819.SiteEdit.SpecJournalIndex
{
    /// <summary>
    /// 期刊目次表單
    /// </summary>
    public class SpecJournalIndexSet : ITSet
    {
        [LibDesc(SpecModelDisplayName.SpecJournalIndex)] public SpecJournalIndexModel SpecJournalIndex { get; set; }
        [LibDesc(SpecModelDisplayName.SpecJournalIndexDetail)] public List<SpecJournalIndexDetail> SpecJournalIndexDetail { get; set; } 
    }
    /// <summary>
    /// 期刊目次
    /// </summary>
    public class SpecJournalIndexModel : MasterDataModel
    {
        /// <summary>
        /// 期刊目次代號
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_JournalIndexId), Key, StringLength(SysLengthParam.ID)] public string IndexId { get; set; }
        /// <summary>
        /// 期刊目次名稱
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_JournalIndexName), StringLength(SysLengthParam.Name)] public string IndexName { get; set; } = string.Empty;
        #region 主子表關聯
        [InverseProperty(nameof(SpecJournalIndexDetail._SpecJournalIndex))] public List<SpecJournalIndexDetail> _SpecJournalIndexDetail { get; set; }
        #endregion
    }
    /// <summary>
    /// 期刊卷數列表
    /// </summary>
    public class SpecJournalIndexDetail : DetailRowModel
    {
        /// <summary>
        /// 期刊目次代號
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_JournalIndexId), Key, StringLength(SysLengthParam.ID)] public string IndexId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        /// <summary>
        /// 卷數
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_Volume)] public int Volume { get; set; }
        /// <summary>
        /// 期數
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_Issue), StringLength(SysLengthParam.Name)] public string Issue { get; set; } = string.Empty;
        /// <summary>
        /// 是否為特刊
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_IsSpecial)] public bool IsSpecial { get; set; }
        /// <summary>
        /// 出版日期
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_PublishDate)] public DateOnly? PublishDate { get; set; }
        /// <summary>
        /// 季號
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_SeasonNo), StringLength(SysLengthParam.Info)] public string SeasonNo { get; set; } = string.Empty;
        /// <summary>
        /// 期刊檔案(整本)
        /// </summary>
        [ForeignKey(nameof(SummaryFileId))] public FileManageModel? SummaryFile { get; set; }
        [LibDesc(SpecModelDisplayName.Spec_SummaryFileId), StringLength(SysLengthParam.InternalId)] public string? SummaryFileId { get; set; }
        /// <summary>
        /// 期刊檔案名稱
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_SummaryFileName), StringLength(SysLengthParam.FileName)] public string SummaryFileName { get; set; } = string.Empty;

        #region 主子表關聯
        [ForeignKey(nameof(IndexId))] public SpecJournalIndexModel _SpecJournalIndex { get; set; }
        #endregion
    }
}
