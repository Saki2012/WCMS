using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n.Metadata;

namespace WCMS.SysCore.Security.IdentityAccess.Authorization;


/// <summary>
/// 功能權限動作
/// 注1:不允許修改規則邏輯，僅能往下擴充
/// 注2:若大小不夠，就改其他型別
/// byte:8個
/// short:16個
/// int:32個
/// long:64個
/// </summary>
[LibDesc, Flags]
public enum FuncAction : int
{
    #region Basic Actions
    [LibDesc(DisplayName.Enum_FuncAction_None)] None = 0,
    /// <summary>
    /// 使用
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_Use)] Use = 1,
    /// <summary>
    /// 查詢清單
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_Query)] Query = 2,
    /// <summary>
    /// 查看資料
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_View)] View = 4,
    /// <summary>
    /// 新增
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_Create)] Create = 8,
    /// <summary>
    /// 修改
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_Update)] Update = 16,
    /// <summary>
    /// 刪除
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_Delete)] Delete = 32,
    /// <summary>
    /// 作廢
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_Invalid)] Invalid = 64,
    #endregion

    #region Composite Actions
    /// <summary>
    /// 基礎資料權限
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_MasterData)] MasterData = Use | Query | View | Create | Update | Delete,
    /// <summary>
    /// 流水單權限
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_BillData)] BillData = Use | Query | View | Create | Update | Delete | Invalid,
    /// <summary>
    /// 報表權限
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_Report)] Report = Use | Query | View,
    /// <summary>
    /// 功能權限
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_Report)] Function = Use | Query | View,
    /// <summary>
    /// 全部權限
    /// </summary>
    [LibDesc(DisplayName.Enum_FuncAction_All)] All = Use | Query | View | Create | Update | Delete | Invalid,
    #endregion
}