namespace WCMS.SysCore.PlatformServices.FileManagement;

/// <summary>
/// 檔案狀態
/// </summary>
public enum FileStatus : byte
{
    None = 0,       // 尚未處理（理論上不應出現，或是刪除失敗(找不到檔案時）)
    Pending = 1,    // 預上傳完成，尚未正式儲存
    Success = 2,    // 已完成儲存與轉移（正式檔案）
    Deleted = 3,    // 標記已刪除（保留資料庫紀錄，可後續追溯）
    InProgress = 4,   // 傳輸中
    Failed = 5,     // 傳輸失敗
    Skipped = 6,    // 來源目的地相同、已存在可跳過
    Canceled = 7,   // 取消上傳
}
/// <summary>
/// 檔案格式
/// </summary>
public static class FileExtensions
{
    #region 文字檔案
    public const string PDF = "pdf";
    public const string DOCX = "docx";
    public const string DOC = "doc";
    public const string ODT = "odt";
    public const string XLSX = "xlsx";
    public const string XLS = "xls";
    public const string PPTX = "pptx";
    public const string TXT = "txt";
    public const string CSV = "csv";
    #endregion
    #region 圖片
    public const string JPG = "jpg";
    public const string JPEG = "jpeg";
    public const string PNG = "png";
    public const string GIF = "gif";
    public const string BMP = "bmp";
    public const string WEBP = "webp";
    public const string SVG = "svg";
    #endregion
    #region 壓縮檔案
    public const string ZIP = "zip";
    public const string RAR = "rar";
    public const string _7Z = "7z";
    #endregion
    #region 影音
    public const string MP3 = "mp3";
    public const string WAV = "wav";
    public const string MP4 = "mp4";
    public const string MOV = "mov";
    public const string MKV = "mkv";
    public const string M4A = "m4a";
    #endregion
}
/// <summary>
/// 網際網路媒體類型
/// </summary>
public static class MimeTypes
{
    #region 文字檔案
    public const string APPLICATION_PDF = "application/pdf";
    public const string APPLICATION_MSWORD = "application/msword";
    public const string APPLICATION_ODT = "application/vnd.oasis.opendocument.text";
    public const string APPLICATION_VND_OPENXML_WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    public const string APPLICATION_VND_EXCEL = "application/vnd.ms-excel";
    public const string APPLICATION_VND_OPENXML_EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public const string APPLICATION_VND_POWERPOINT = "application/vnd.ms-powerpoint";
    public const string APPLICATION_VND_OPENXML_POWERPOINT = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    public const string TEXT_PLAIN = "text/plain";
    public const string TEXT_CSV = "text/csv";
    public const string APPLICATION_EXCEL = "application/excel";
    public const string APPLICATION_X_EXCEL = "application/x-excel";
    public const string APPLICATION_X_MSEXCEL = "application/x-msexcel";
    #endregion
    #region 圖片
    public const string IMAGE_JPEG = "image/jpeg";
    public const string IMAGE_PNG = "image/png";
    public const string IMAGE_GIF = "image/gif";
    public const string IMAGE_BMP = "image/bmp";
    public const string IMAGE_WEBP = "image/webp";
    public const string IMAGE_SVG_XML = "image/svg+xml";
    #endregion
    #region 壓縮檔案
    public const string APPLICATION_ZIP = "application/zip";
    public const string APPLICATION_VND_RAR = "application/vnd.rar";
    public const string APPLICATION_X_7Z_COMPRESSED = "application/x-7z-compressed";
    #endregion
    #region 影音
    public const string AUDIO_MPEG = "audio/mpeg";
    public const string AUDIO_WAV = "audio/wav";
    public const string AUDIO_MP4 = "audio/mp4";
    public const string VIDEO_QUICKTIME = "video/quicktime";
    public const string VIDEO_MP4 = "video/mp4";
    #endregion
}
