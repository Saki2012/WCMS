using WCMS.SysCore.Configuration;

namespace WCMS.SysCore.Constants;

/// <summary>
/// 定義 WCMS 系統與跨模組共用的固定參數名稱。
/// </summary>
public static class SysParam
{
    /// <summary>
    /// 定義組態檔、連線名稱與共用組態路徑。
    /// </summary>
    public static class Configuration
    {
        public const string AppSettingsFile = "appsettings.json";
        /// <summary>
        /// 定義 ConnectionStrings 節點名稱。
        /// </summary>
        public static class ConnectionStrings
        {
            public const string SqlConnection = nameof(SqlConnection);
            /// <summary>
            /// 舊資料匯入使用的資料庫連線名稱。
            /// </summary>
            public const string OldSqlConnection = "OldDb";
        }
        /// <summary>
        /// 定義一般組態節點名稱。
        /// </summary>
        public static class Sections
        {
            public const string FilePaths = nameof(FilePaths);
            public const string Captcha = nameof(Captcha);
        }
        /// <summary>
        /// 定義 JWT 組態路徑。
        /// </summary>
        public static class Jwt
        {
            public const string Section = nameof(Jwt);
            public const string Key = nameof(Key);
            public const string Issuer = nameof(Issuer);
            public const string Audience = nameof(Audience);
            public const string AccessTokenMinutes = nameof(AccessTokenMinutes);
            public const string RefreshTokenDays = nameof(RefreshTokenDays);
            public const string KeyPath = $"{Section}:{Key}";
            public const string IssuerPath = $"{Section}:{Issuer}";
            public const string AudiencePath = $"{Section}:{Audience}";
            public const string AccessTokenMinutesPath = $"{Section}:{AccessTokenMinutes}";
            public const string RefreshTokenDaysPath = $"{Section}:{RefreshTokenDays}";
        }
        /// <summary>
        /// 定義來源白名單組態路徑。
        /// </summary>
        public static class Whitelist
        {
            public const string Section = nameof(Whitelist);
            public const string Frontend = nameof(Frontend);
            public const string Backend = nameof(Backend);
            public const string ExternalApis = nameof(ExternalApis);
            public const string FrontendPath = $"{Section}:{Frontend}";
            public const string BackendPath = $"{Section}:{Backend}";
            public const string ExternalApisPath = $"{Section}:{ExternalApis}";
        }
        /// <summary>
        /// 定義資料庫初始化組態路徑。
        /// </summary>
        public static class DbInit
        {
            public const string Section = nameof(DbInit);
            public const string Enabled = nameof(Enabled);
            public const string Account = nameof(Account);
            public const string SysOperator = nameof(SysOperator);
            public const string UdfPath = nameof(UdfPath);
            public const string EnabledPath = $"{Section}:{Enabled}";
            public const string AccountPath = $"{Section}:{Account}";
            public const string SysOperatorPath = $"{AccountPath}:{SysOperator}";
            public const string UdfPathPath = $"{Section}:{UdfPath}";
        }
    }
    /// <summary>
    /// 定義跨模組共用的執行環境變數名稱。
    /// </summary>
    public static class EnvironmentVariables
    {
        public const string AspNetCoreEnvironment = "ASPNETCORE_ENVIRONMENT";
    }
    /// <summary>
    /// 定義應用程式執行階段開關名稱。
    /// </summary>
    public static class RuntimeSwitches
    {
        public const string JsonReflectionEnabled = "System.Text.Json.JsonSerializer.IsReflectionEnabledByDefault";
    }
    /// <summary>
    /// 定義共用 API Route Template。
    /// </summary>
    public static class ApiRoutes
    {
        public const string Service = "Service/[controller]";
        public const string ServiceReport = "Service/[controller]Rpt";
        /// <summary>
        /// 保留既有 SystemAPI 路徑的明確 Route。
        /// </summary>
        public const string SystemService = "Service/SystemAPI";
    }
    /// <summary>
    /// 定義 Output Cache Policy 名稱。
    /// </summary>
    public static class OutputCachePolicies
    {
        public const string ListCache = nameof(ListCache);
        public const string DetailCache = nameof(DetailCache);
        public const string PermanentCache = nameof(PermanentCache);
    }
    /// <summary>
    /// 定義 Output Cache Tag 名稱。
    /// </summary>
    public static class OutputCacheTags
    {
        public const string List = "set:list";
        public const string Detail = "set:detail";
        public const string Permanent = "perm";
        public const string DataList = "data:list";
        public const string DataDetail = "data:detail";
    }
    /// <summary>
    /// 定義 WCMS 模組 Namespace 前綴。
    /// </summary>
    public static class NamespacePrefixes
    {
        public const string Features = $"{nameof(WCMS)}.{nameof(Features)}.";
        public const string SpecFeatures = $"{nameof(WCMS)}.{SpecSettings.SpecFeatures}.";
    }
    /// <summary>
    /// 定義跨模組共用的 HTTP Header 名稱。
    /// </summary>
    public static class HttpHeaders
    {
        public const string AcceptLanguage = "Accept-Language";
        public const string Authorization = nameof(Authorization);
        public const string ContentType = "Content-Type";
        public const string ClientIp = "HTTP_CLIENT_IP";
        public const string ForwardedFor = "X-Forwarded-For";
        public const string ForwardedHost = "X-Forwarded-Host";
        public const string RealIp = "X-Real-IP";
        public const string UserAgent = "User-Agent";
        public const string XsrfToken = "X-XSRF-TOKEN";
        public const string RequestedWith = "X-Requested-With";
        public const string AccessControlAllowOrigin = "Access-Control-Allow-Origin";
    }
    /// <summary>
    /// 定義系統共用 Cookie 名稱。
    /// </summary>
    public static class CookieNames
    {
        public const string AccessToken = "access";
        public const string RefreshTokenId = "rtid";
        public const string XsrfToken = "XSRF-TOKEN";
        public const string VisitorKey = "wcms.visitor";
    }
    /// <summary>
    /// 定義跨模組共用的 Cookie 路徑。
    /// </summary>
    public static class CookiePaths
    {
        public const string Root = "/";
    }
    /// <summary>
    /// 定義跨模組共用的格式字串。
    /// </summary>
    public static class Formats
    {
        public const string GuidCompact = "N";
    }
    /// <summary>
    /// 定義動態查詢條件的共用連接字。
    /// </summary>
    public static class QueryOperators
    {
        public const string And = " And ";
    }
    /// <summary>
    /// 定義跨模組共用的媒體類型。
    /// </summary>
    public static class MediaTypes
    {
        public const string ApplicationJson = "application/json";
        public const string TextJson = "text/json";
        public const string TextHtml = "text/html";
    }
    /// <summary>
    /// 定義共用 API QueryString 名稱。
    /// </summary>
    public static class ApiQuery
    {
        public const string InternalId = "internalId";
    }
    /// <summary>
    /// 定義跨模組共用的萬用字元。
    /// </summary>
    public static class Wildcards
    {
        public const string All = "*";
    }
}
