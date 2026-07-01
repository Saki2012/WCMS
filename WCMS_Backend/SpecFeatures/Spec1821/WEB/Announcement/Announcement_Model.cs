using WCMS.SpecFeatures.Spec1821._Resx;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;

namespace WCMS.Features.WEB.Announcement
{
    
    public partial class Announcement: MasterDataModel
    {
        /// <summary>
        /// 學年度
        /// </summary>
        [LibDesc(SpecModelDisplayName.SpecSchoolYear)]public int SpecSchoolYear { get; set; }
    }
 
}
