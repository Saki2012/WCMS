using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.Banner
{
    public partial class BannerDetailInfo
    {
        /// <summary>
        /// 最新展演
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string SpecLatestShows { get; set; }
        /// <summary>
        /// 展演地點
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string SpecShowLocation { get; set; }
        /// <summary>
        /// 展演時間
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string SpecShowDate { get; set; } = string.Empty;
    }
}
