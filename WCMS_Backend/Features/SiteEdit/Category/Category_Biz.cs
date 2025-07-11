using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.Features.SiteEdit.Category
{
    public class CategoryBiz(IRepositoryMapProvider repo) : BizService<CategoryDataSet>(repo), IBizService<CategoryDataSet> { }
}
