using WCMS.Features.COMM.Calendar;
using WCMS.Features._Resx;
using WCMS.Features.SystemSetting.Calendar;
using WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1816.COMM.Calendar;

[LibBiz(ProgKeys.COMM.Code,ProgKeys.COMM.Calendar)]
public class SpecCalendar_Biz(BizDeps bizDeps, IHttpClientFactory httpClientFactory):CalendarBiz(bizDeps, httpClientFactory)
{
    //private readonly SpecOpenSchedule_Biz _specOS_Biz = specOS_Biz;
    #region Protected Virtual
    protected override async Task BeforeUpdate(Calendar set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                PresetData(set);
                CheckData(set);
                break;
        }
    }
    protected override void SpecApplyDayInfoPatch(CalendarDetail target, CalendarDetail src)
    {
        base.SpecApplyDayInfoPatch(target, src);
        target.Spec_AcademicYearId = src.Spec_AcademicYearId;
        target.Spec_OpenTime = src.Spec_OpenTime;
        target.Spec_CloseTime = src.Spec_CloseTime;
        target.Spec_ModifyMemo = src.Spec_ModifyMemo;
    }
    #endregion

    #region Protected
    protected void CheckData(Calendar set)
    {
        foreach (var detail in set.CalendarDetail)
        {
            SpecOpenScheduleRuleBiz.ValidTimeFor(detail, x => x.Spec_OpenTime, x => x.Spec_CloseTime, Message, I18n);
        }
    }
    #endregion

    #region Private
    private void PresetData(Calendar set)
    {
        set.CalendarDetail.ForEach(p=> { p.Spec_ModifyMemo ??= string.Empty; });
    }
    #endregion
}
