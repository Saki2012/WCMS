using WCMS.SysCore.SystemFunc.SystemVersion;

namespace WCMS.SpecFeatures.Spec1820.SYS.SystemVersion;

public class SpecSystemVersion_Biz: SystemVersion_Biz
{
    #region Protected Virtual
    protected override void SetSpecVersion(SystemVersion_DTO data)
    {
        base.SetSpecVersion(data);
        data.SpecCode = "1820";
        data.SpecTitle = "中興新化林場";
        data.SpecFeatVersion = 0;
        data.SpecModelVersion = 0;
    }
    #endregion
}
