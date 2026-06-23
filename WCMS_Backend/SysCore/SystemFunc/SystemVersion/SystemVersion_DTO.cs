namespace WCMS.SysCore.SystemFunc.SystemVersion;

public class SystemVersion_DTO
{
    public int FeatVersion { get; set; }

    public int ModelVersion { get; set; }

    public int Patch { get; set; }

    public string? SpecCode { get; set; }

    public string? SpecTitle { get; set; }

    public int? SpecFeatVersion {  get; set; }

    public int? SpecModelVersion { get; set; }
}
