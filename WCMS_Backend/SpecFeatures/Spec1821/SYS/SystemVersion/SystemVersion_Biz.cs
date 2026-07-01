using WCMS.SysCore.SystemFunc.SystemVersion;

namespace WCMS.SpecFeatures.Spec1821.SYS.SystemVersion;

public class SpecSystemVersion_Biz: SystemVersion_Biz
{
    #region Protected Virtual
    protected override void SetSpecVersion(SystemVersion_DTO data)
    {
        base.SetSpecVersion(data);
        data.SpecCode = "1821";
        data.SpecTitle = "國立臺灣藝術大學招生資訊服務網站";
        data.SpecFeatVersion = 2;
        data.SpecModelVersion = 2;
    }
    #endregion
}
