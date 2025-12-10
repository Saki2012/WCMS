using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Enum;

namespace WCMS.Features.SiteEdit.Banner
{
    public partial class BannerDetail
    {
        /// <summary>
        /// 展演時間
        /// </summary>
        [StringLength(SysLengthParam.Name)] public string SpecShowDate { get; set; } = string.Empty;
    }
}
