using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.COMM.Person;

[LibBiz(ProgKeys.COMM.Code, ProgKeys.COMM.Person)]
public class PersonBiz(BizDeps bizDeps) : BizService<Person>(bizDeps), IBizService<Person>
{
    #region Protected
    protected override async Task BeforeUpdate(Person set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
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
    private void CheckData(Person set)
    {
        CheckIsEmpty(set);
    }
    private void CheckIsEmpty(Person header)
    {
        if(header.PersonName.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<Person>(x => x.PersonName));
    }
    #endregion
}
