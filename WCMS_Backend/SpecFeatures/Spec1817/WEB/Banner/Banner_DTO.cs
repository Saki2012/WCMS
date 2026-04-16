using WCMS.SpecFeatures.Spec1817._Resx;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.Features.WEB.Banner;

public partial class BannerDetailInfo_DTO
{
    /// <summary>
    /// 最新展演
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_LatestShows)] public string? SpecLatestShows { get; set; }
    /// <summary>
    /// 展演地點
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_ShowLocation)] public string? SpecShowLocation { get; set; }
    /// <summary>
    /// 展演開始時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_ShowDate)] public string? SpecShowDate { get; set; }
}
