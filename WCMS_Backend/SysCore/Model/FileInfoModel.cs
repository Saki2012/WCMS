using WCMS.SysCore.Library;
using System.ComponentModel;

namespace WCMS.SysCore.Model
{
    /// <summary>
    /// 
    /// </summary>
    public class FileInfoModel
    {
        /// <summary>
        /// 檔案識別碼
        /// </summary>
        [LibDesc]public string FileId { get; set; }
        /// <summary>
        /// 檔案名稱
        /// </summary>
        [Description("檔案名稱")] public string FileName { get; set; }
        /// <summary>
        /// 路徑
        /// </summary>
        [Description("路徑")] public string Path { get; set; }
        /// <summary>
        /// 網際網路媒體型式
        /// </summary>
        [Description("網際網路媒體型式")] public string MimeType { get; set; }
        /// <summary>
        /// 檔案SHA256值 
        /// 用來檢查Server是否已有該檔案，若有就不用再次上傳)
        /// </summary>
        [Description("檔案SHA256值")] public string FileSHA256 { get; set; }
        /// <summary>
        /// 檔案大小
        /// </summary>
        public long FileSize { get; set; } // 檔案大小
        /// <summary>
        /// 
        /// </summary>
        public DateTime UploadedAt { get; set; }
        public string UploadedUser { get; set; }
    }
}
