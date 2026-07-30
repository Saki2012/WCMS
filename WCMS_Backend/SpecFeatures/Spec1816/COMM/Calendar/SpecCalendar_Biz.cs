using WCMS.Features.COMM.Calendar;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1816.WEB.SpecOpenScheduleRule;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1816.COMM.Calendar;

/// <summary>
/// 擴充共用行事曆的圖書館開館欄位與驗證。
/// </summary>
[LibBiz(ProgKeys.COMM.Code, ProgKeys.COMM.Calendar)]
public class SpecCalendar_Biz(BizDeps bizDeps, IHttpClientFactory httpClientFactory) : CalendarBiz(bizDeps, httpClientFactory)
{
    #region Protected Virtual
    /// <summary>
    /// 儲存前補齊客製資料並驗證開閉館時間。
    /// </summary>
    protected override async Task BeforeUpdate(Calendar set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        if (act is not (FuncAction.Create or FuncAction.Update)) return;
        PresetData(set);
        CheckData(set);
    }
    /// <summary>
    /// 套用單日客製開館欄位更新。
    /// </summary>
    protected override void SpecApplyDayInfoPatch(CalendarDetail target, CalendarDetail src)
    {
        base.SpecApplyDayInfoPatch(target, src);
        target.Spec_AcademicYearId = src.Spec_AcademicYearId;
        target.Spec_OpenTime = src.Spec_OpenTime;
        target.Spec_CloseTime = src.Spec_CloseTime;
        target.Spec_ModifyMemo = src.Spec_ModifyMemo;
    }
    #endregion

    #region Private
    /// <summary>
    /// 驗證所有每日開閉館時間。
    /// </summary>
    private void CheckData(Calendar set)
    {
        foreach (CalendarDetail detail in set._CalendarDetail)
            SpecOpenScheduleRuleBiz.ValidTimeFor(detail, item => item.Spec_OpenTime, item => item.Spec_CloseTime, Message, I18n);
    }
    /// <summary>
    /// 補齊每日人工修改備註預設值。
    /// </summary>
    private static void PresetData(Calendar set)
    {
        foreach (CalendarDetail detail in set._CalendarDetail)
            detail.Spec_ModifyMemo ??= string.Empty;
    }
    #endregion
}
