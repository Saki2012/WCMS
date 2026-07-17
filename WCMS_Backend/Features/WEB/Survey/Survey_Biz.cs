using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.Survey;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Survey)]
public class SurveyBiz(BizDeps bizDeps) : BizService<Survey>(bizDeps)
{
    #region Protected Virtual
    /// <summary>
    /// 保存前處理
    /// </summary>
    protected override async Task BeforeUpdate(Survey set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                AutoSetData(set);
                CheckData(set);
                break;
        }
    }
    #endregion

    #region Protected
    /// <summary>
    /// 後台保存問卷時整理欄位選項
    /// </summary>
    protected void AutoSetData(Survey set)
    {
        if (set == null) return;
        set._SurveyItem.ForEach(AutoSetOptions);
    }
    protected void CheckData(Survey set)
    {
        if (set.SurveyName.IsNullOrEmpty())
            Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<Survey>(x => x.SurveyName));
    }
    #endregion

    #region Private
    /// <summary>
    /// 後台欄位選項整理
    /// </summary>
    private void AutoSetOptions(SurveyItem item)
    {
        if (!item.InputType.In(LibInputType.Radio, LibInputType.Select, LibInputType.Checkbox)) item.Options = null;
        else
        {
            List<string> options = [.. (item.Options ?? string.Empty).Replace("\t", " ").Split(["\r\n", "\n", "\r"], StringSplitOptions.None).Select(p => p.Trim()).Where(p => !p.IsNullOrEmpty()).Distinct(StringComparer.OrdinalIgnoreCase)];
            item.Options = options.Count == 0 ? null : string.Join("\n", options);
        }
    }
    #endregion
}