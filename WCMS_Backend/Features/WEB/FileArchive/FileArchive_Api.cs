using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.WEB.FileArchive
{
    [LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.FileArchive, SysEnum.FuncAction.MasterData)]
    public class FileArchiveController : ApiDataController<FileArchiveSet, FileArchiveSet_DTO>{}
}
