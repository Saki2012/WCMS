using WCMS.Features.Member.Account;
using WCMS.Features.SystemSetting.Auth;

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
        /// 
        /// </summary>
        public const string ServiceRptRoute = $"Service/[controller]Rpt";
        /// <summary>
        /// 系統操作
        /// </summary>
        public static readonly User_DTO SysOperator = new() { UserId= "SysOperator"};
        /// <summary>
        /// 搜尋清單快取 
        /// (Program設定時長)
        /// </summary>
        public const string ListCache = "ListCache";
        /// <summary>
        /// 搜尋明細快取 
        /// (Program設定時長)
        /// </summary>
        public const string DetailCache = "DetailCache";
        /// <summary>
        /// 永久快取 
        /// </summary>
        public const string PermanentCache = "PermanentCache";


        /// <summary>
        /// Cookie 名稱常數
        /// </summary>
        public static class CookieNames
        {
            /// <summary>
            /// 前台匿名訪客識別碼
            /// </summary>
            public const string VisitorKey = "wcms.visitor";
        }
    }
}
