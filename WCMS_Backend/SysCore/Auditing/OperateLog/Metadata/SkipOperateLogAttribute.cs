namespace WCMS.SysCore.Observability.OperateLog.Metadata;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class SkipOperateLogAttribute : Attribute { }