using GraphQL.Validation.Errors;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.PageManagement
{
    [ProgId("PageManagement")]
    public class PageManagementBiz(IRepositoryMapProvider repoMapProvider) : BizService<PageManagementSet>(repoMapProvider), IBizService<PageManagementSet>
    {
        protected override void BeforeUpdate(PageManagementSet set, FuncAction act)
        {
            base.BeforeUpdate(set, act);
        }
    }
}
