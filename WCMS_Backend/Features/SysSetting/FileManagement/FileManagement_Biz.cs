using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SysSetting.FileManagement
{
    [ProgId("FileManagement")]
    public class FileManagementBiz(IRepositoryMapProvider repoMapProvider) : BizService<FileManagementSet>(repoMapProvider), IBizService<FileManagementSet>
    {
        
    }
}
