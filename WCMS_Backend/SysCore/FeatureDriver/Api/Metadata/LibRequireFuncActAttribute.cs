using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SysCore.FeatureDriver.Api.Metadata;

/// <summary>
/// Action 需要的權限動作（Query/Create/Update/Delete/Invalid/Use）
/// </summary>
[AttributeUsage(AttributeTargets.Method, Inherited = true, AllowMultiple = false)]
public sealed class LibRequireFuncActAttribute(FuncAction requiredAct) : Attribute
{
    public FuncAction RequiredAct { get; } = requiredAct;
}