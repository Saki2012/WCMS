using System.ComponentModel.DataAnnotations;
using WCMS.Features._Resx;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.IAM.Auth
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
        /// <summary>使用者編號。</summary>
        [LibDesc(ModelDisplayName.User_UserID)] public string UserId { get; set; } = string.Empty;

        /// <summary>使用者名稱。</summary>
        [LibDesc(ModelDisplayName.User_UserName)] public string UserName { get; set; } = string.Empty;

        /// <summary>資料內部識別碼。</summary>
        [LibDesc(ModelDisplayName.Common_InternalId)] public string InternalId { get; set; } = string.Empty;

        /// <summary>帳戶狀態。</summary>
        [LibDesc(ModelDisplayName.Enum_AccountStatus)] public AccountStatus AccountStatus { get; set; }
    }

    /// <summary>
    /// 目前登入者與完整有效權限內容。
    /// </summary>
    public sealed class CurrentUserContext_DTO
    {
        /// <summary>目前登入者。</summary>
        public User_DTO User { get; set; } = new();

        /// <summary>是否為系統管理者。</summary>
        public bool IsAdmin { get; set; }

        /// <summary>功能代碼與有效權限遮罩。</summary>
        public Dictionary<string, FuncAction> Permissions { get; set; }
            = new(StringComparer.OrdinalIgnoreCase);
    }
}
