using WCMS.SysCore.SystemFunc.SystemVersion;

namespace WCMS.SpecFeatures.Spec1810.SYS.SystemVersion;

public class SpecSystemVersion_Biz: SystemVersion_Biz
{
    #region Protected Virtual
    protected override void SetSpecVersion(SystemVersion_DTO data)
    {
        base.SetSpecVersion(data);
        data.SpecCode = "1810";
        data.SpecTitle = "國立臺灣藝術大學研究發展處";
        data.SpecFeatVersion = 1;
        data.SpecModelVersion = 0;
    }
    #endregion
}
