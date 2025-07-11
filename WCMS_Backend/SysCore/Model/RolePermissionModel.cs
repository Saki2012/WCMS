using Microsoft.OpenApi.Any;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using System.Security.AccessControl;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SysCore.Model
{
    /// <summary>
    /// 角色權限資料
    /// </summary>
    [LibDesc]
    public class RoleModel : MasterDataModel
    {
        /// <summary>
        /// 角色權限代號
        /// </summary>
        [LibDesc, Key] public string RoleId { get; set; }
        /// <summary>
        /// 角色權限名稱
        /// </summary>
        [LibDesc] public string RoleName { get; set; }
        /// <summary>
        /// 前/後台
        /// </summary>
        [LibDesc] public EndType EndType { get; set; }
        /// <summary>
        /// 是否為管理者
        /// </summary>
        [LibDesc] public bool IsAdmin { get; set; }
    }
    /// <summary>
    /// 功能權限設置
    /// </summary>
    //[Description(SysParam.DESC_RolePermission)]
    //public class RolePermissionModel : DetailRowState
    //{
    //    /// <summary>
    //    /// 角色權限
    //    /// </summary>
    //    [ForeignKey(nameof(RoleId))] public RoleModel Role { get; set; }
    //    /// <summary>
    //    /// 角色權限代號
    //    /// </summary>
    //    [Description(SysParam.DESC_RoleId), Key] public string RoleId { get; set; }
    //    /// <summary>
    //    /// 行序號
    //    /// </summary>
    //    [Description(SysParam.DESC_RowId), Key] public int RowId { get; set; }
    //    /// <summary>
    //    /// 功能名稱
    //    /// </summary>
    //    [Description(SysParam.DESC_FuncName)] public string FuncName { get; set; }
    //    /// <summary>
    //    /// 權限
    //    /// /*FuncAction*/
    //    /// </summary>
    //    [Description(SysParam.DESC_FuncAction)] public int FuncAction { get; set; }
    //}

    /// <summary>
    /// 權限Token
    /// </summary>
    public class PermissionTokenModel
    {
        public string FuncName { get; set; }
        public string Token { get; set; }
    }
}
