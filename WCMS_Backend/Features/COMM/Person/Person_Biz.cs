using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.COMM.Person;

[LibBiz(ProgKeys.COMM.Code, ProgKeys.COMM.Person)]
public class PersonBiz(BizDeps bizDeps) : BizService<PersonModel>(bizDeps), IBizService<PersonModel>
{
    #region Protected
    protected override async Task BeforeUpdate(PersonModel set, FuncAction act, CancellationToken ct = default)
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
    private void CheckData(PersonModel set)
    {
        CheckIsEmpty(set);
    }
    private void CheckIsEmpty(PersonModel header)
    {
        if(header.PersonName.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<PersonModel>(x => x.PersonName));
    }
    #endregion
}
