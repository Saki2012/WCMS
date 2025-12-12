using Microsoft.AspNetCore.Mvc;
using WCMS.SysCore;
using WCMS.SysCore.Enum;

namespace WCMS.Features.SiteEdit.FileArchive
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class FileArchiveController : ApiDataController<FileArchiveSet, FileArchiveSet_DTO>{}
}
