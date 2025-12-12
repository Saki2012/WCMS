using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SystemSetting.Auth
{
    public sealed class LoginDto
    {
        [Required]
        [StringLength(20, MinimumLength = 3, ErrorMessage = "account 長度需介於 3~20。")]
        [RegularExpression(@"^[A-Za-z0-9._\-@]+$", ErrorMessage = "account 僅允許英數、. _ - @。")]
        public string Account { get; set; } = "";
        [Required]
        [StringLength(64, MinimumLength = 3, ErrorMessage = "password 長度需介於 3~64。")]
        public string Password { get; set; } = "";
    }
    public sealed class User_DTO
    {
        /// <summary>
        /// 使用者編號
        /// </summary>
        [LibDesc(ModelDisplayName.User_UserID)] public string UserId { get; set; }
        /// <summary>
        /// 使用者名稱
        /// </summary>
        [LibDesc(ModelDisplayName.User_UserName)] public string UserName { get; set; }
        /// <summary>
        /// 
        /// </summary>
        [LibDesc(ModelDisplayName.Common_InternalId)]public string InternalId { get; set; } = string.Empty;
        /// <summary>
        /// 帳戶狀態
        /// </summary>
        [LibDesc(ModelDisplayName.Enum_AccountStatus)] public AccountStatus AccountStatus { get; set; }
    }
}
