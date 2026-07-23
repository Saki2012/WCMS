using WCMS.SysCore.Configuration;
using SystemVersionBase = WCMS.SysCore.Configuration.SystemVersion;

namespace WCMS.SpecFeatures.Spec1820.SYS.SystemVersion;

public class SpecSystemVersion_Biz : SystemVersionBase
{
    #region Protected Virtual
    protected override void SetSpecVersion(SystemVersion_DTO data)
    {
        base.SetSpecVersion(data);
        data.SpecCode = "1820";
        data.SpecTitle = "新化林場";
        data.SpecFeatVersion = 0;
        data.SpecModelVersion = 0;
    }
    #endregion
}
