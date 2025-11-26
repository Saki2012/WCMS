using Microsoft.IdentityModel.Tokens;
using WCMS.Features.Member.Personnel;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Resx;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.Member.Account
{

    public class AccountBiz(BizDeps bizDeps, IBizService<PersonSet>biz) : BizService<AccountSet>(bizDeps), IBizService<AccountSet>
    {
        #region Property
        protected IBizService<PersonSet> personBiz = biz;
        protected override bool IsAutoGenerateId { get => false; }
        #endregion

        #region Protected
        protected override async Task BeforeUpdate(AccountSet set, FuncAction act)
        {
            await base.BeforeUpdate(set, act);
            switch (act)
            {
                case FuncAction.Create:
                case FuncAction.Update:
                    CheckData(set);
                    SetData(set);
                    break;
            }
        }

        protected override async Task AfterUpdate(AccountSet? oldSet, AccountSet? newSet, FuncAction act, TransStatus status)
        {
            await base.AfterUpdate(oldSet, newSet, act, status);
            switch(act)
            {
                case FuncAction.Create:
                    await AutoCreatePersonData(newSet.Account.PersonId, newSet.Account.AccountName);
                    break;
                case FuncAction.Update:
                    LetPasswordNoUpdate(oldSet,newSet);
                    break;
            }
        }
        #endregion
        #region Private
        private void CheckData(AccountSet set)
        {
            if (set.Account.AccountId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<AccountModel>(x => x.AccountId));
        }
        private void SetData(AccountSet set)
        {
            if (set.Account.PersonId.IsNullOrEmpty()) set.Account.PersonId = set.Account.AccountId;
            //TODO: 這邊得確定Person要有資料，如果沒有的話還是得檢查要輸入名稱，順帶建立人員資料
            if (set.Account.AccountName.IsNullOrEmpty()) set.Account.AccountName = set.Account.Person.PersonName;
        }
        private async Task AutoCreatePersonData(string personId,string personName)
        {
            if(await this.personBiz.BizQueryTotalCounts([nameof(PersonModel.PersonId)], $"{nameof(PersonModel.PersonId)} = {personId}") == 0)
            {
                await personBiz.BizCreateSetAsync(new PersonSet()
                {
                    Person = new()
                    {
                        PersonId = personId, PersonName = personName,
                        Gender = Gender.NotKnown, Email = string.Empty,
                        MobilePhone=string.Empty, HomePhone=string.Empty,
                    }
                }); 
            }
        }
        /// <summary>
        /// 修改保存時不改變密碼設定，保持原狀
        /// (只在需要修改密碼時才會更新)
        /// </summary>
        /// <param name="oldSet"></param>
        /// <param name="newSet"></param>
        private static void LetPasswordNoUpdate(AccountSet oldSet, AccountSet newSet)
        {
            newSet.Account.PasswordHash = oldSet.Account.PasswordHash;
            newSet.Account.PasswordSalt = oldSet.Account.PasswordSalt;
            newSet.Account.PasswordAlgoVer = oldSet.Account.PasswordAlgoVer;
        }
        #endregion
    }
}
