using WCMS.Features._Resx;
using WCMS.Features.WEB.Survey;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.Timeline;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Timeline)]
public class TimelineBiz(BizDeps bizDeps) : BizService<TimelineSet>(bizDeps), IBizService<TimelineSet>
{
    #region Protected Virtual
    protected override Task BeforeUpdate(TimelineSet set, FuncAction act, CancellationToken ct = default)
    {
        var result = base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                CheckData(set);
                break;
        }
        return result;
    }
    #endregion

    #region Protected

    protected bool CheckData(TimelineSet set)
    {
        if (set.Timeline.TimelineName.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<Timeline_DTO>(x => x.TimelineName));
        return Message.HasError;
    }
    #endregion

    #region Private
    
    #endregion
}
