using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1819._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using WCMS.SysCore.FeatureDriver.Resx;
namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournalIndex;

/// <summary>
/// 期刊目次表單
/// </summary>
public class SpecJournalIndexSet : ITSet
{
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecJournalIndex)]
public SpecJournalIndexModel SpecJournalIndex { get; set; }
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.SpecJournalIndexDetail)]
public List<SpecJournalIndexDetail> SpecJournalIndexDetail { get; set; } = [];
}
/// <summary>
/// 期刊目次
/// </summary>
public class SpecJournalIndexModel : MasterDataModel
{
    /// <summary>
    /// 期刊目次代號
    /// </summary>
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_JournalIndexId)]
public string IndexId { get; set; } = string.Empty;
    /// <summary>
    /// 期刊目次名稱
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Name, SpecDisplayName.Spec_JournalIndexName)]
public string IndexName { get; set; }= string.Empty;
    #region 主子表關聯
[InverseProperty(nameof(SpecJournalIndexDetail._SpecJournalIndex))]
[LibField(ApiFieldMode.ReadWrite)]
public List<SpecJournalIndexDetail> _SpecJournalIndexDetail { get; set; } = [];
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
[LibStr(ApiFieldMode.ReadOnly, SysLengthParam.ID, SpecDisplayName.Spec_JournalIndexId)]
public string IndexId { get; set; } = string.Empty;
    /// <summary>
    /// 行主鍵
    /// </summary>
[LibField(ApiFieldMode.ReadOnly, DisplayName.Common_RowId)]
public int RowId { get; set; }
    /// <summary>
    /// 卷數
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_Volume)]
public int Volume { get; set; }
    /// <summary>
    /// 期數
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Name, SpecDisplayName.Spec_Issue)]
public string Issue { get; set; }= string.Empty;
    /// <summary>
    /// 是否為特刊
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_IsSpecial)]
public bool IsSpecial { get; set; }
    /// <summary>
    /// 出版日期
    /// </summary>
[LibField(ApiFieldMode.ReadWrite, SpecDisplayName.Spec_PublishDate)]
public DateOnly PublishDate { get; set; }
    /// <summary>
    /// 季號
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Info, SpecDisplayName.Spec_SeasonNo)]
public string SeasonNo { get; set; }= string.Empty;
    /// <summary>
    /// 期刊檔案(整本)
    /// </summary>
[ForeignKey(nameof(SummaryFileId))]
[LibField(ApiFieldMode.ReadOnly)]
public FileManageModel? SummaryFile { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.InternalId, SpecDisplayName.Spec_SummaryFileId)]
public string? SummaryFileId { get; set; }
    /// <summary>
    /// 期刊檔案名稱
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.FileName, SpecDisplayName.Spec_SummaryFileName)]
public string SummaryFileName { get; set; }= string.Empty;

    #region 主子表關聯
[ForeignKey(nameof(IndexId))]
[LibField(ApiFieldMode.ReadOnly)]
public SpecJournalIndexModel _SpecJournalIndex { get; set; }
    #endregion
}
