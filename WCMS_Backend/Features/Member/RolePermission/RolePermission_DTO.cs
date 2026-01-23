using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.Member.RolePermission
{
    public class RolePermissionSet_DTO:ITSet_DTO
    {
        public RoleDataModel_DTO RoleData { get; set; } = new();
        public List<RolePermissionModel_DTO> RolePermission { get; set; } = [];
    }
    /// <summary>
    /// 角色權限資料
    /// </summary>
    public class RoleDataModel_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 角色權限代號
        /// </summary>
        [LibDesc(ModelDisplayName.RolePermission_RoleId), StringLength(SysLengthParam.ID)] public string? RoleId { get; set; }
        /// <summary>
        /// 角色權限名稱
        /// </summary>
        [LibDesc(ModelDisplayName.RolePermission_RoleName), StringLength(SysLengthParam.Name)] public string? RoleName { get; set; }
        /// <summary>
        /// 是否為管理者
        /// </summary>
        [LibDesc(ModelDisplayName.RolePermission_IsAdmin)] public bool? IsAdmin { get; set; }

        #region 主子表關聯
        public List<RolePermissionModel_DTO>? _RolePermission { get; set; }
        #endregion
    }

    /// <summary>
    /// 角色權限資料
    /// </summary>
    public class RolePermissionModel_DTO
    {
        /// <summary>
        /// 角色權限代號
        /// </summary>
        [LibDesc(ModelDisplayName.RolePermission_RoleId), StringLength(SysLengthParam.ID)] public string? RoleId { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }
        [LibDesc(ModelDisplayName.RolePermission_PermissionKey), StringLength(SysLengthParam.ProgId)]public string? PermissionKey { get; set; }
        [LibDesc(ModelDisplayName.RolePermission_GrantMask)] public FuncAction? GrantMask { get; set; }

        #region 主子表關聯
        public RoleDataModel_DTO? _RoleData { get; set; } = null!;
        #endregion
    }





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
}
