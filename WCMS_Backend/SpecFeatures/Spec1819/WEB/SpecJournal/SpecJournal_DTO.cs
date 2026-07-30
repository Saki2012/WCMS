using System.ComponentModel.DataAnnotations;
using WCMS.SpecFeatures.Spec1819._Resx;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;

namespace WCMS.SpecFeatures.Spec1819.WEB.SpecJournal;

/// <summary>
/// ORCID資料
/// </summary>
public sealed class ORCIDData
{
    public string ORCID { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorName_en { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string Unit_en { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}
/// <summary>
/// 出版(轉為期刊)要求資料
/// </summary>
public sealed class PublishReq
{
    /// <summary>
    /// 期刊-內部唯一標識號
    /// </summary>
    [LibDesc(DisplayName.Common_InternalId)] public string InternalId { get; set; }
    /// <summary>
    /// 期刊目次代號
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalIndexId), StringLength(DbStrLen.ID)] public string JournalIndexId { get; set; }
    /// <summary>
    /// 期刊目次明細行主鍵
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_JournalIndexRowId)] public int? JournalIndexRowId { get; set; }
}