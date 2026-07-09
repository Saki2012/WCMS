using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SpecFeatures.Spec1817._Resx;
using WCMS.SysCore.FeatureDriver.Resx;

namespace WCMS.Features.WEB.Banner;

public partial class BannerDetailInfo
{
    /// <summary>
    /// 最新展演
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Spec_LatestShows)]
public string SpecLatestShows { get; set; }= string.Empty;
    /// <summary>
    /// 展演地點
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Title, SpecDisplayName.Spec_ShowLocation)]
public string SpecShowLocation { get; set; }= string.Empty;
    /// <summary>
    /// 展演時間
    /// </summary>
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.Name, SpecDisplayName.Spec_ShowDate)]
public string SpecShowDate { get; set; }= string.Empty;
}
