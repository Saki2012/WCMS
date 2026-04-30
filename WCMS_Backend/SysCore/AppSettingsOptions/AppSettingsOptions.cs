namespace WCMS.SysCore.AppSettingsOptions
{

    /// <summary>
    /// 白名單連線設定
    /// </summary>
    public class WhitelistOptions
    {
        public List<string> Frontend { get; set; } = [];
        public List<string> Backend { get; set; } = [];
        public List<string> ExternalApis { get; set; } = [];
    }
    /// <summary>
    /// 實體檔案放置位置
    /// </summary>
    public class FilePathOptions
    {
        public string Root { get; set; }
        public string Pending { get; set; }
        public string Permanent { get; set; }
        public string Import { get; set; }
    }

}
