using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using WCMS.Features.Member.Personnel;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.Security;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.Member.Account
{
    public class AccountBiz(BizDeps bizDeps, IBizService<PersonSet>biz) : BizService<AccountSet>(bizDeps), IBizService<AccountSet>
    {
        #region Property
        protected IBizService<PersonSet> personBiz = biz;
        protected override bool IsAutoGenerateId { get => false; }
        #endregion

        #region Public
        /// <summary>
        /// 檢查密碼合法性
        /// </summary>
        /// <param name="newPassword"></param>
        /// <returns></returns>
        public static bool CheckPasswordLegal(string newPassword,out List<SysMessageModel> messages)
        {
            messages = [];
            return !string.IsNullOrEmpty(newPassword) && newPassword.Length >= 6;
        }
        /// <summary>
        /// 轉換密碼
        /// </summary>
        /// <param name="set"></param>
        /// <param name="dto"></param>
        public static void ConvertPassword(AccountSet set, string password)
        {
            (byte[] hash, byte[] salt, int ver) = PasswordHasher.Hash(password ?? "");
            set.Account.PasswordHash = hash;
            set.Account.PasswordSalt = salt;
            set.Account.PasswordAlgoVer = ver;
        }
        /// <summary>
        /// 執行修改密碼
        /// </summary>
        /// <returns></returns>
        public async Task ChangePassword(string internalId,string oldPassword,string newPassword, CancellationToken ct)
        {
            bool ownsTx = false;
            try
            {
                ownsTx = await TryBeginTransactionAsync();
                if (Message.HasError) return ;
                AccountSet oldSet = await DoQuerySetAsync(internalId);
                var ok = PasswordHasher.Verify(oldPassword, oldSet.Account.PasswordHash, oldSet.Account.PasswordSalt, oldSet.Account.PasswordAlgoVer);
                if (ok) 
                { 
                    AccountSet newSet = oldSet.DeepClone();
                    ConvertPassword(newSet, newPassword);
                    await DoUpdateAsync(oldSet, newSet);
                    if (Message.HasError) return ;
                }
                await TryCommitAsync(ownsTx);
            }
            catch
            {
                await TryRollbackAsync(ownsTx);
                throw;
            }
        }
        /// <summary>
        /// 執行重置密碼
        /// </summary>
        /// <returns></returns>
        public async Task ResetPassword(string internalId, string newPassword, CancellationToken ct)
        {
            bool ownsTx = false;
            try
            {
                ownsTx = await TryBeginTransactionAsync();
                if (Message.HasError) return;
                AccountSet oldSet = await DoQuerySetAsync(internalId);
                AccountSet newSet = oldSet.DeepClone();
                ConvertPassword(newSet, newPassword);
                await DoUpdateAsync(oldSet, newSet);
                if (Message.HasError) return;
                await TryCommitAsync(ownsTx);
            }
            catch
            {
                await TryRollbackAsync(ownsTx);
                throw;
            }
        }
        #endregion

        #region Protected Virtual
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

        #region Protected
        protected void CheckData(AccountSet set)
        {
            if (set.Account.AccountId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<AccountModel>(x => x.AccountId));
            if(set.Account.RoleId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<AccountModel>(x => x.RoleId));
        }
        protected void SetData(AccountSet set)
        {
            if (set.Account.PersonId.IsNullOrEmpty()) set.Account.PersonId = set.Account.AccountId;
            if (set.Account.AccountName.IsNullOrEmpty()) set.Account.AccountName = set.Account.Person.PersonName;
        }
        #endregion

        #region Private

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
