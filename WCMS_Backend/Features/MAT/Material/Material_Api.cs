using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Api.Controllers;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.MAT.Material;

[LibApiController(ProgKeys.MAT.Code, ProgKeys.MAT.Material, FuncAction.BillData)]
public class MaterialController : ApiDataController<Material>
{
  
}

