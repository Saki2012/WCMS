using System.ComponentModel.DataAnnotations;

namespace WCMS.SysCore.Model
{
    /// <summary>
    /// DB 環境識別資料，用來避免 SpecCode 與 DB 對錯。
    /// </summary>
    public class SysDbProfile
    {
        /// <summary>
        /// 設定鍵。
        /// </summary>
        [Key, StringLength(100)] public string ProfileKey { get; set; } = string.Empty;

        /// <summary>
        /// 設定值。
        /// </summary>
        [StringLength(200)] public string ProfileValue { get; set; } = string.Empty;

        /// <summary>
        /// 建立時間。
        /// </summary>
        public DateTime CreateTime { get; set; }

        /// <summary>
        /// 異動時間。
        /// </summary>
        public DateTime? ModifyTime { get; set; }
    }
}
