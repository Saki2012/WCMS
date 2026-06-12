using System.ComponentModel.DataAnnotations;
using WCMS.SpecFeatures.Spec1817._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.Features.WEB.Banner;

public partial class BannerDetailInfo_DTO
{
    /// <summary>
    /// 最新展演
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_LatestShows), StringLength(SysLengthParam.Title)] public string? SpecLatestShows { get; set; }
    /// <summary>
    /// 展演地點
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_ShowLocation), StringLength(SysLengthParam.Title)] public string? SpecShowLocation { get; set; }
    /// <summary>
    /// 展演開始時間
    /// </summary>
    [LibDesc(SpecModelDisplayName.Spec_ShowDate), StringLength(SysLengthParam.Name)] public string? SpecShowDate { get; set; }
}
