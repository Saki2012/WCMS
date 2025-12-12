using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.Security;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.Member.Personnel
{
    [ProgId("Person")]
    public class PersonBiz(BizDeps bizDeps) : BizService<PersonSet>(bizDeps), IBizService<PersonSet>
    {
        #region Protected
        protected override async Task BeforeUpdate(PersonSet set, FuncAction act)
        {
            await base.BeforeUpdate(set, act);
            switch (act)
            {
                case FuncAction.Create:
                case FuncAction.Update:
                    CheckData(set);
                    break;
            }
        }
        #endregion

        #region Private
        private void CheckData(PersonSet set)
        {
            CheckIsEmpty(set.Person);
        }
        private void CheckIsEmpty(PersonModel header)
        {
            if(header.PersonName.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<PersonModel_DTO>(x => x.PersonName));
        }
        #endregion
    }
}
