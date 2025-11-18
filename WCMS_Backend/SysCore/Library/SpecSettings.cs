namespace WCMS.SysCore.Library
{
    public static class SpecSettings
    {
        // 只讀屬性，整個程式都可以用
        public static string SpecCode { get; private set; } = string.Empty;

        // 在 Program.cs 一開始初始化一次
        public static void Init(IConfiguration configuration)
        {
            SpecCode = configuration["SpecCode"] ?? string.Empty;
        }
    }
}
