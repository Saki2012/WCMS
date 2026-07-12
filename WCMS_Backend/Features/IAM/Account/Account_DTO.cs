namespace WCMS.Features.IAM.Account;

public class ChangePassword
{
    public string OldPassword { get; set; }
    public string NewPassword { get; set; }
}

public class ResetPassword
{
    public string UserInternalId { get; set; }
    public string NewPassword { get; set; }
}
