using WCMS.SysCore.I18n.Metadata;

namespace WCMS.SysCore.FeatureDriver.Model.Base;

/// <summary>
/// 資料狀態
/// </summary>
[LibDesc] public enum DataStatus : byte
{
    /// <summary>
    /// 作廢
    /// </summary>
    [LibDesc] Invalid = 0,
    /// <summary>
    /// 生效
    /// </summary>
    [LibDesc] Valid = 1
}

/// <summary>
/// 單據狀態
/// </summary>
[LibDesc] public enum FormStatus : byte
{
    /// <summary>
    /// 保存
    /// </summary>
    [LibDesc] Saved = 0,
    /// <summary>
    /// 審核
    /// </summary>
    [LibDesc] Approved = 1,
    /// <summary>
    /// 結案
    /// </summary>
    [LibDesc] EndCase = 2,
    /// <summary>
    /// 作廢
    /// </summary>
    [LibDesc] Obsoleted = 3,
}

/// <summary>
/// 行狀態
/// </summary>
[LibDesc] public enum RowState : byte
{
    /// <summary>
    /// 無異動
    /// </summary>
    [LibDesc] None = 0,
    /// <summary>
    /// 新增
    /// </summary>
    [LibDesc] Insert = 1,
    /// <summary>
    /// 修改
    /// </summary>
    [LibDesc] Update = 2,
    /// <summary>
    /// 刪除
    /// </summary>
    [LibDesc] Delete = 3,
}