using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.Features.WEB.Timeline;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Timeline)]
public class TimelineBiz(BizDeps bizDeps) : BizService<TimelineSet>(bizDeps), IBizService<TimelineSet>
{
    #region Protected
 
    #endregion

    #region Private
    
    #endregion
}
