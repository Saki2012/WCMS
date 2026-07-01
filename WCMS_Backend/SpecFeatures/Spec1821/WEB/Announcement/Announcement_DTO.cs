using WCMS.SpecFeatures.Spec1821._Resx;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;

namespace WCMS.Features.WEB.Announcement
{
    /// <summary>
    /// 公告主表
    /// </summary>
    public partial class Announcement_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 學年度
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecSchoolYear)] public int SpecSchoolYear { get; set; }
    }
}
