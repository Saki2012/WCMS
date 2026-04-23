using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.SysCore;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.Features.MAT.MatCategory;

/// <summary>
/// MatCategory Biz
/// </summary>
[LibBiz(ProgKeys.MAT.Code, ProgKeys.MAT.MatCategory)]
public class MatCategoryBiz(BizDeps bizDeps) : CategoryBizBase<MatCategoryDataSet>(bizDeps) { }