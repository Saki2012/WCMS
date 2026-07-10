using WCMS.Features._Resx;
using WCMS.Features.WEB.Survey;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.Timeline;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Timeline)]
public class TimelineBiz(BizDeps bizDeps) : BizService<Timeline>(bizDeps), IBizService<Timeline>
{
    #region Protected Virtual
    protected override Task BeforeUpdate(Timeline set, FuncAction act, CancellationToken ct = default)
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

    protected bool CheckData(Timeline set)
    {
        if (set.TimelineName.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<Timeline>(x => x.TimelineName));
        return Message.HasError;
    }
    #endregion

    #region Private
    
    #endregion
}
