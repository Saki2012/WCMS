using Microsoft.Identity.Client;
using WCMS.SysCore.SystemFunc.UserRolePermission.User;

namespace WCMS.SysCore.Enum
{
    /// <summary>
    /// 固定參數
    /// </summary>
    public static class SysParam
    {
        /// <summary>
        /// 組態檔名
        /// </summary>
        public const string AppSettingsJson = "appsettings.json";
        /// <summary>
        /// SQL連線組態名
        /// </summary>
        public const string SqlConnection = "SqlConnection";
        /// <summary>
        /// Redis連線組態名
        /// </summary>
        public const string RedisConnection = "RedisConnection";
        /// <summary>
        /// Log默認路徑
        /// </summary>
        public const string LogDefaultPath = @"./Log/";
        /// <summary>
        /// 
        /// </summary>
        public const string DbSet = "Data";
        /// <summary>
        /// 
        /// </summary>
        public const string RowId = "RowId";
        /// <summary>
        /// 
        /// </summary>
        public const string Model = "Model";
        /// <summary>
        /// 
        /// </summary>
        public const string ServiceRoute = $"Service/[controller]";
        /// <summary>
        /// 系統操作
        /// </summary>
        public static readonly UserModel SysOperator = new() { UserId = "SysOperator", UserName = "系統操作" };

    }
}
