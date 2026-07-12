using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.IAM.RolePermission;

public sealed class PermissionCatalogModuleDTO
{
    public string ModuleCode { get; set; } = "";
    public string ModuleTitle { get; set; } = "";
    public List<PermissionCatalogProgDTO> Progs { get; set; } = [];
}

public sealed class PermissionCatalogProgDTO
{
    public string ProgId { get; set; } = "";
    public string ProgTitle { get; set; } = "";
    public FuncAction SupportMask { get; set; } = FuncAction.None;
}
