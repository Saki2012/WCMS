using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore;

namespace WCMS.Features.SiteEdit.FileArchive
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class FileArchiveController(IBizService<FileArchiveSet> service) : ApiDataController<FileArchiveSet>(service)
    {
    }
}
