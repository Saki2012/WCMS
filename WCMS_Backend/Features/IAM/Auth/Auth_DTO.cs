using System.ComponentModel.DataAnnotations;
namespace WCMS.Features.IAM.Auth;

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
