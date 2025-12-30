using Microsoft.AspNetCore.Mvc;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.SiteEdit.FileArchive
{
    [LibApiController(ModuleCode.WebManagement, PGID.FileArchive, SysEnum.FuncAction.MasterData)]
    public class FileArchiveController : ApiDataController<FileArchiveSet, FileArchiveSet_DTO>{}
}
