using WCMS.Features._Resx;
using WCMS.Features.WEB.Timeline;
using WCMS.Features.WEB.WebResource;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.Survey;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Survey)]
public class SurveyBiz(BizDeps bizDeps) : BizService<SurveySet>(bizDeps), IBizService<SurveySet>
{
    #region Protected Virtual
    /// <summary>
    /// 保存前處理
    /// </summary>
    protected override async Task BeforeUpdate(SurveySet set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                AutoSetData(set);
                if (!CheckData(set)) return;
                break;
        }
    }
    #endregion

    #region Protected
    /// <summary>
    /// 後台保存問卷時整理欄位選項
    /// </summary>
    protected void AutoSetData(SurveySet set)
    {
        if (set == null) return;
        set.SurveyItem.ForEach(item => AutoSetOptions(item));
    }
    protected bool CheckData(SurveySet set)
    {
        if (set.Survey.SurveyName.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<Survey_DTO>(x => x.SurveyName));
        return Message.HasError;
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