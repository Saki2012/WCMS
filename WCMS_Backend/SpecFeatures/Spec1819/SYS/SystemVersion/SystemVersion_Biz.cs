using WCMS.SysCore.Configuration;
using SystemVersionBase = WCMS.SysCore.Configuration;

namespace WCMS.SpecFeatures.Spec1819.SYS.SystemVersion;

public class SpecSystemVersion_Biz: SystemVersionBase.SystemVersion
{
    #region Protected Virtual
    protected override void SetSpecVersion(SystemVersion_DTO data)
    {
        base.SetSpecVersion(data);
        data.SpecCode = "1819";
        data.SpecTitle = "淡江大學教育資料與圖書館學";
        data.SpecFeatVersion = 0;
        data.SpecModelVersion = 0;
    }
    #endregion
}
