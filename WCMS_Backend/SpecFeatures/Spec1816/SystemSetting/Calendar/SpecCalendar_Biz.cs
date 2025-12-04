using System.Runtime.InteropServices;
using WCMS.Features.SystemSetting.Calendar;
using WCMS.SysCore;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.Spec1816.SystemSetting.Calendar
{
    [ProgId("Calendar")]
    public class SpecCalendar_Biz(BizDeps bizDeps, IHttpClientFactory httpClientFactory):CalendarBiz(bizDeps, httpClientFactory)
    {
        //private readonly SpecOpenSchedule_Biz _specOS_Biz = specOS_Biz;
        #region Protected

        protected override async Task BeforeUpdate(CalendarSet set, FuncAction act)
        {
            await base.BeforeUpdate(set, act);
            switch (act)
            {
                case FuncAction.Create:
                case FuncAction.Update:
                    PresetData(set);
                    break;
            }
        }
        #endregion

        #region Private
        private void PresetData(CalendarSet set)
        {
            set.CalendarDetail.ForEach(p=> { p.Spec_ModifyMemo ??= string.Empty; });
        }
        #endregion
    }
}
