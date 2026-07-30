using System.ComponentModel.DataAnnotations;
using WCMS.SpecFeatures.Spec1817._Resx;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;

namespace WCMS.Features.WEB.Banner;

/// <summary>
/// Spec1817 Banner 展演擴充欄位。
/// </summary>
public partial class BannerDetailInfo
{
    #region Property
    /// <summary>
    /// 最新展演。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecDisplayName.Spec_LatestShows)]
    public string SpecLatestShows { get; set; } = string.Empty;
    /// <summary>
    /// 展演地點。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, SpecDisplayName.Spec_ShowLocation)]
    public string SpecShowLocation { get; set; } = string.Empty;
    /// <summary>
    /// 展演時間。
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, SpecDisplayName.Spec_ShowDate)]
    public string SpecShowDate { get; set; } = string.Empty;
    #endregion
}
