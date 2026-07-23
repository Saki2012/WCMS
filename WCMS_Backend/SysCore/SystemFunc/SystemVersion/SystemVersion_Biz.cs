using WCMS.SysCore.Library;

namespace WCMS.SysCore.SystemFunc.SystemVersion;

public class SystemVersion_Biz
{
    #region Public
    public string GetBackendVersion()
    {
        SystemVersion_DTO data = new()
        {
            FeatVersion = 0,
            ModelVersion = 0,
            Patch = 8,
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
