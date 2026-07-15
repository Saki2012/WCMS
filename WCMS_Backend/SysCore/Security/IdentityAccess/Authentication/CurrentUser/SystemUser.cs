namespace WCMS.SysCore.Security.IdentityAccess.Authentication.CurrentUser;

/// <summary>
/// 定義非登入流程使用的系統操作帳號。
/// </summary>
public static class SystemUser
{
    /// <summary>
    /// 系統操作帳號的固定識別值。
    /// </summary>
    public const string OperatorId = "SysOperator";
    /// <summary>
    /// 系統操作帳號資料。
    /// </summary>
    public static readonly User_DTO Operator = new() { UserId = OperatorId };
}
