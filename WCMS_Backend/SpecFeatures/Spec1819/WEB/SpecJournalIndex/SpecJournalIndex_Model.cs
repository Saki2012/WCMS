using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1819._Resx;
using WCMS.SysCore.PlatformServices.FileManagement;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournalIndex;

/// <summary>
/// 期刊目次
/// </summary>
public class SpecJournalIndex : HeaderModel
{
    /// <summary>
    /// 期刊目次代號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.Spec_JournalIndexId)]
    [Key]
    public string IndexId { get; set; } = string.Empty;
    /// <summary>
    /// 期刊目次名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, SpecModelDisplayName.Spec_JournalIndexName)]
    public string IndexName { get; set; } = string.Empty;
    #region 主子表關聯
    [InverseProperty(nameof(SpecJournalIndexDetail._SpecJournalIndex))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<SpecJournalIndexDetail> _SpecJournalIndexDetail { get; set; } = [];
    #endregion
}
/// <summary>
/// 期刊卷數列表
/// </summary>
public class SpecJournalIndexDetail : FormDetailModel
{
    /// <summary>
    /// 期刊目次代號
    /// </summary>
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, SpecModelDisplayName.Spec_JournalIndexId)]
    [Key]
    public string IndexId { get; set; } = string.Empty;
    /// <summary>
    /// 卷數
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_Volume)]
    public int Volume { get; set; }
    /// <summary>
    /// 期數
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, SpecModelDisplayName.Spec_Issue)]
    public string Issue { get; set; } = string.Empty;
    /// <summary>
    /// 是否為特刊
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_IsSpecial)]
    public bool IsSpecial { get; set; }
    /// <summary>
    /// 出版日期
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, SpecModelDisplayName.Spec_PublishDate)]
    public DateOnly PublishDate { get; set; }
    /// <summary>
    /// 季號
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Info, SpecModelDisplayName.Spec_SeasonNo)]
    public string SeasonNo { get; set; } = string.Empty;
    /// <summary>
    /// 期刊檔案(整本)
    /// </summary>
    [ForeignKey(nameof(SummaryFileId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? SummaryFile { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, SpecModelDisplayName.Spec_SummaryFileId)]
    public string? SummaryFileId { get; set; }
    /// <summary>
    /// 期刊檔案名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.FileName, SpecModelDisplayName.Spec_SummaryFileName)]
    public string SummaryFileName { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(IndexId))]
    [LibField(ApiFieldMode.Ignore)]
    public SpecJournalIndex? _SpecJournalIndex { get; set; }
    #endregion
}
