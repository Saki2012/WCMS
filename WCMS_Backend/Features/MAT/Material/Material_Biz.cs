using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.MAT.Material;

[LibBiz(ProgKeys.MAT.Code, ProgKeys.MAT.Material)]
public class MaterialBiz(BizDeps bizDeps) : BizService<Material>(bizDeps), IBizService<Material>
{
    #region Protected

    #endregion

    #region Private

    #endregion
}
