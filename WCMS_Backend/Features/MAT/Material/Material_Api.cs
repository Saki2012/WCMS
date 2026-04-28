using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.MAT.Material;

[LibApiController(ProgKeys.MAT.Code, ProgKeys.MAT.Material, SysEnum.FuncAction.BillData)]
public class MaterialController : ApiDataController<MaterialSet,MaterialSet_DTO>
{
  
}

