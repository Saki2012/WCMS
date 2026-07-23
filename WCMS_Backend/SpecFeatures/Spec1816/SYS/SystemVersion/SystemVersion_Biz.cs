using WCMS.SysCore.Configuration;
using SystemVersionBase = WCMS.SysCore.Configuration;
namespace WCMS.SpecFeatures.Spec1816.SYS.SystemVersion;

/// <summary>
/// 提供 Spec1816 後端客製版本資訊。
/// </summary>
public class SpecSystemVersion_Biz : SystemVersionBase.SystemVersion
{
    #region Protected Virtual
    /// <summary>
    /// 設定 Spec1816 功能與模型版本。
    /// </summary>
    protected override void SetSpecVersion(SystemVersion_DTO data)
    {
        base.SetSpecVersion(data);
        data.SpecCode = "1816";
        data.SpecTitle = "國立臺灣藝術大學圖書館網站";
        data.SpecFeatVersion = 1;
        data.SpecModelVersion = 1;
    }
    #endregion
}
