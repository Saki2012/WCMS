using WCMS.SpecFeatures.Spec1817.Resx;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.Banner
{
    public partial class BannerDetail_DTO
    {
        /// <summary>
        /// 展演開始時間
        /// </summary>
        [LibDesc(SpecModelDisplayName.Spec_ShowDate)] public string? SpecShowDate { get; set; }
    }
}
