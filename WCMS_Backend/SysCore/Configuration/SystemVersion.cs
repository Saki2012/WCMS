using WCMS.SysCore.Library;
namespace WCMS.SysCore.Configuration;

public class SystemVersion_DTO
{
    public int FeatVersion { get; set; }
    public int ModelVersion { get; set; }
    public int Patch { get; set; }
    public string? SpecCode { get; set; }
    public string? SpecTitle { get; set; }
    public int? SpecFeatVersion { get; set; }
    public int? SpecModelVersion { get; set; }
}

public class SystemVersion
{
    #region Public
    public string GetBackendVersion()
    {
        SystemVersion_DTO data = new()
        {
            FeatVersion = 6,
            ModelVersion = 2,
            Patch = 0,
        };
        SetSpecVersion(data);
        string version = $@"1.{data.FeatVersion}.{data.ModelVersion}.{data.Patch}";
        if (data.SpecCode != null && data.SpecTitle != null && data.SpecFeatVersion != null && data.SpecModelVersion != null)
            version = LibData.Merge("-", false, version, $@"R{data.SpecFeatVersion}.{data.SpecModelVersion}");
        return version;
    }
    #endregion

    #region Protected Virtual
    protected virtual void SetSpecVersion(SystemVersion_DTO data) { }
    #endregion
}

