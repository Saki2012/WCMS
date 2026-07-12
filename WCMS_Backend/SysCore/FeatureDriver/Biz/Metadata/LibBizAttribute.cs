using WCMS.Features._Resx;
namespace WCMS.SysCore.FeatureDriver.Biz.Metadata;

[AttributeUsage(AttributeTargets.Class, Inherited = true, AllowMultiple = false)]
public class LibBizAttribute(ModuleCodeEnum moduleCode, string progId) : Attribute
{
    public ModuleCodeEnum ModuleCode { get; } = moduleCode;
    public string ProgId { get; } = progId;
}
