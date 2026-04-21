using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SpecFeatures.Spec1820.WEB.SpecHomePage;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.HomePageSetting)]
public class SpecJournalIndex_Biz(BizDeps bizDeps) : BizService<SpecHomePage1820Set>(bizDeps), IBizService<SpecHomePage1820Set> {}
