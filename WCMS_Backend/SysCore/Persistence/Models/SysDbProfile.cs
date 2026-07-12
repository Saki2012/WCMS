using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model.MetaData;

namespace WCMS.SysCore.Persistence.Models
{
    /// <summary>
    /// DB 環境識別資料，用來避免 SpecCode 與 DB 對錯。
    /// </summary>
    public class SysDbProfile
    {
        /// <summary>
        /// 設定鍵。
        /// </summary>
        [Key, StringLength(100)]
        [LibField(ApiFieldMode.ReadOnly)]
        public string ProfileKey { get; set; } = string.Empty;

        /// <summary>
        /// 設定值。
        /// </summary>
        [StringLength(200)]
        [LibField(ApiFieldMode.ReadWrite)]
        public string ProfileValue { get; set; } = string.Empty;

        /// <summary>
        /// 建立時間。
        /// </summary>
        [LibField(ApiFieldMode.ReadOnly)]
        public DateTime CreateTime { get; set; }

        /// <summary>
        /// 異動時間。
        /// </summary>
        [LibField(ApiFieldMode.ReadOnly)]
        public DateTime? ModifyTime { get; set; }
    }
}
