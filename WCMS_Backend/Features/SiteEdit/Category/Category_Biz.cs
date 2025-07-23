using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore.Interface;
using WCMS.SysCore;
using WCMS.SysCore.Library;
using System.Runtime.InteropServices;

namespace WCMS.Features.SiteEdit.Category
{
    [ProgId("Category")]
    public class CategoryBiz(IRepositoryMapProvider repo) : BizService<CategoryDataSet>(repo), IBizService<CategoryDataSet> 
    {
    }
}
