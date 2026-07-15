using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.FileArchive;

[LibApiController(ProgKeys.WEB.Code, ProgKeys.WEB.FileArchive, FuncAction.MasterData)]
public class FileArchiveController : ApiDataController<FileArchive>{}
