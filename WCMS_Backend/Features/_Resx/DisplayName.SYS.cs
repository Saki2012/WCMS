namespace WCMS.SysCore.FeatureDriver.Resx;

public static partial class DisplayName
{
    #region WebClient
    /// <summary>
    /// 中：瀏覽器 UserAgent
    /// 英：
    /// </summary>
    public const string WebClient_UserAgent = nameof(WebClient_UserAgent);
    /// <summary>
    /// 中：瀏覽器偏好語系
    /// 英：
    /// </summary>
    public const string WebClient_AcceptLanguage = nameof(WebClient_AcceptLanguage);
    /// <summary>
    /// 中：遮罩後用戶 IP
    /// 英：
    /// </summary>
    public const string WebClient_ClientIpMasked = nameof(WebClient_ClientIpMasked);
    /// <summary>
    /// 中：用戶 IP 雜湊值
    /// 英：
    /// </summary>
    public const string WebClient_ClientIpHash = nameof(WebClient_ClientIpHash);
    /// <summary>
    /// 中：瀏覽器名稱
    /// 英：
    /// </summary>
    public const string WebClient_BrowserName = nameof(WebClient_BrowserName);
    /// <summary>
    /// 中：瀏覽器版本
    /// 英：
    /// </summary>
    public const string WebClient_BrowserVersion = nameof(WebClient_BrowserVersion);
    /// <summary>
    /// 中：作業系統名稱
    /// 英：
    /// </summary>
    public const string WebClient_OsName = nameof(WebClient_OsName);
    /// <summary>
    /// 中：作業系統版本
    /// 英：
    /// </summary>
    public const string WebClient_OsVersion = nameof(WebClient_OsVersion);
    /// <summary>
    /// 中：裝置類型
    /// 英：
    /// </summary>
    public const string WebClient_DeviceType = nameof(WebClient_DeviceType);
    /// <summary>
    /// 中：使用者時區
    /// 英：
    /// </summary>
    public const string WebClient_TimeZone = nameof(WebClient_TimeZone);

    /// <summary>
    /// 中：資料變更日誌
    /// 英：Data Change Log
    /// </summary>
    public const string DataChangeLog = nameof(DataChangeLog);
    /// <summary>
    /// 中：資料變更日誌明細
    /// 英：Data Change Log Detail
    /// </summary>
    public const string DataChangeLogDetail = nameof(DataChangeLogDetail);
    /// <summary>
    /// 中：操作日誌
    /// 英：Operation Log
    /// </summary>
    public const string OperateLogModel = nameof(OperateLogModel);
    /// <summary>
    /// 中：檔案
    /// 英：File
    /// </summary>
    public const string FileManage = nameof(FileManage);
    /// <summary>
    /// 中：最近檔案下載紀錄
    /// 英：Recent File Download
    /// </summary>
    public const string FileManage_DownloadRecent = nameof(FileManage_DownloadRecent);
    /// <summary>
    /// 中：檔案同步資訊
    /// 英：File Synchronization
    /// </summary>
    public const string FileManage_SyncInfo = nameof(FileManage_SyncInfo);
    /// <summary>
    /// 中：檔案使用紀錄
    /// 英：File Usage
    /// </summary>
    public const string FileManage_UsedModel = nameof(FileManage_UsedModel);
    /// <summary>
    /// 中：資料庫環境識別
    /// 英：Database Profile
    /// </summary>
    public const string SysDbProfile = nameof(SysDbProfile);
    #endregion

    #region FileManagement
    /// <summary>
    /// 中：下載次數
    /// 英：Download Count
    /// </summary>
    public const string FileManage_DownloadCount = nameof(FileManage_DownloadCount);
    #endregion

    #region AACheckCode
    /// <summary>
    /// AA：圖片缺少 alt 屬性
    /// </summary>
    public const string AACheck_ImgAlt = nameof(AACheck_ImgAlt);
    /// <summary>
    /// AA：alt 空白圖片不應保留 title
    /// </summary>
    public const string AACheck_ImgEmptyAltTitle = nameof(AACheck_ImgEmptyAltTitle);
    /// <summary>
    /// AA：連結缺少可辨識名稱
    /// </summary>
    public const string AACheck_AnchorName = nameof(AACheck_AnchorName);
    /// <summary>
    /// AA：連結與內層圖片替代文字重複或衝突
    /// </summary>
    public const string AACheck_AnchorImgConflict = nameof(AACheck_AnchorImgConflict);
    /// <summary>
    /// AA：iframe 缺少 title 屬性
    /// </summary>
    public const string AACheck_IframeTitle = nameof(AACheck_IframeTitle);
    /// <summary>
    /// AA：CSS font-size 使用 px 固定單位
    /// </summary>
    public const string AACheck_FontSizePx = nameof(AACheck_FontSizePx);
    /// <summary>
    /// AA：電子郵件連結title不足，請使用姓名加電子郵件作為title
    /// </summary>
    public const string AACheck_MailtoTitle = nameof(AACheck_MailtoTitle);
    #endregion
}
