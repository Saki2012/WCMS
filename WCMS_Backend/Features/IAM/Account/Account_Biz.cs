using Microsoft.IdentityModel.Tokens;
using WCMS.Features._Resx;
using WCMS.Features.COMM.Person;
using WCMS.SysCore.Constants;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authentication;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.IAM.Account;

public class AccountBiz(BizDeps bizDeps, IBizService<PersonModel> biz, IPermissionCache permissionCache) : BizService<AccountModel>(bizDeps), IBizService<AccountModel>
{
    #region Property
    /// <summary>
    /// 人員資料 Biz 服務。
    /// </summary>
    protected IBizService<PersonModel> personBiz = biz;
    /// <summary>
    /// 帳號主鍵由使用者指定，不自動產生。
    /// </summary>
    protected override bool IsAutoGenerateId { get => false; }
    /// <summary>
    /// 使用者有效權限 Cache。
    /// </summary>
    private IPermissionCache PermissionCache { get; } = permissionCache;
    /// <summary>
    /// 本次交易提交後需失效權限的帳號。
    /// </summary>
    private HashSet<string> PendingPermissionUserIds { get; } = new(StringComparer.OrdinalIgnoreCase);
    #endregion

    #region Public
    /// <summary>
    /// 檢查密碼合法性
    /// </summary>
    /// <param name="newPassword"></param>
    /// <returns></returns>
    public static bool CheckPasswordLegal(string newPassword, out List<SysMessageModel> messages)
    {
        messages = [];
        return !string.IsNullOrEmpty(newPassword) && newPassword.Length >= 6;
    }
    /// <summary>
    /// 轉換密碼
    /// </summary>
    /// <param name="set"></param>
    /// <param name="dto"></param>
    public static void ConvertPassword(AccountModel account, string password)
    {
        (byte[] hash, byte[] salt, int ver) = PasswordHasher.Hash(password ?? "");
        account.PasswordHash = hash;
        account.PasswordSalt = salt;
        account.PasswordAlgoVer = ver;
    }
    /// <summary>
    /// 執行修改密碼
    /// </summary>
    /// <returns></returns>
    public async Task ChangePassword(string internalId, string oldPassword, string newPassword, CancellationToken ct = default)
    {
        bool ownsTx = false;
        try
        {
            ownsTx = await TryBeginTransactionAsync();
            if (Message.HasError) return;
            AccountModel oldSet = await DoQueryDataAsync(internalId);
            var ok = PasswordHasher.Verify(oldPassword, oldSet.PasswordHash, oldSet.PasswordSalt, oldSet.PasswordAlgoVer);
            if (ok)
            {
                AccountModel newSet = oldSet.Snapshot();
                ConvertPassword(newSet, newPassword);
                await DoUpdateAsync(oldSet, newSet);
                if (Message.HasError) return;
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
    public async Task ResetPassword(string internalId, string newPassword, CancellationToken ct = default)
    {
        bool ownsTx = false;
        try
        {
            ownsTx = await TryBeginTransactionAsync();
            if (Message.HasError) return;
            AccountModel oldSet = await DoQueryDataAsync(internalId);
            AccountModel newSet = oldSet.Snapshot();
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
    /// <summary>
    /// 帳號新增或更新前執行欄位驗證與預設值整理。
    /// </summary>
    protected override async Task BeforeUpdate(AccountModel set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                await CheckData(set, act, ct);
                SetData(set);
                break;
        }
    }
    /// <summary>
    /// 帳號資料異動後處理人員建立、密碼保留與權限失效登記。
    /// </summary>
    protected override async Task AfterUpdate(AccountModel? oldSet, AccountModel? newSet, FuncAction act, TransStatus status, CancellationToken ct = default)
    {
        await base.AfterUpdate(oldSet, newSet, act, status, ct);
        switch (act)
        {
            case FuncAction.Create:
                await AutoCreatePersonData(newSet.PersonId, newSet.AccountName, ct);
                break;
            case FuncAction.Update:
                LetPasswordNoUpdate(oldSet, newSet);
                break;
        }
        TrackPermissionInvalidation(oldSet, newSet, act);
    }
    /// <summary>
    /// 交易成功提交後失效本次異動帳號的權限 Cache。
    /// </summary>
    protected override async Task AfterSaveChanges(FuncAction action, CancellationToken ct = default)
    {
        await base.AfterSaveChanges(action, ct);
        await PermissionCache.InvalidateUsersAsync(PendingPermissionUserIds, CancellationToken.None);
        PendingPermissionUserIds.Clear();
    }
    #endregion

    #region Protected
    /// <summary>
    /// 驗證帳號必要欄位與人員編號唯一性。
    /// </summary>
    protected async Task CheckData(AccountModel set, FuncAction act, CancellationToken ct = default)
    {
        if (set.AccountId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<AccountModel>(x => x.AccountId));
        if (set.RoleId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<AccountModel>(x => x.RoleId));
        await CheckPersonIdIsUniqueAsync(set, act, ct);
    }
    /// <summary>
    /// 補齊帳號的人員編號與顯示名稱。
    /// </summary>
    protected void SetData(AccountModel set)
    {
        if (set.PersonId.IsNullOrEmpty()) set.PersonId = set.AccountId;
        if (set.AccountName.IsNullOrEmpty()) set.AccountName = set.Person?.PersonName ?? string.Empty;
    }
    #endregion

    #region Private
    /// <summary>
    /// 記錄本次帳號異動完成後需要失效權限的使用者。
    /// </summary>
    private void TrackPermissionInvalidation(AccountModel? oldSet, AccountModel? newSet, FuncAction action)
    {
        string? userId = action == FuncAction.Delete ? oldSet?.AccountId : newSet?.AccountId ?? oldSet?.AccountId;
        if (!string.IsNullOrWhiteSpace(userId)) PendingPermissionUserIds.Add(userId);
    }

    /// <summary>
    /// 帳號新增時自動建立尚不存在的人員資料。
    /// </summary>
    private async Task AutoCreatePersonData(string personId, string personName, CancellationToken ct)
    {
        if (await personBiz.BizQueryTotalCounts($"{nameof(PersonModel.PersonId)} = {personId}", ct) == 0)
        {
            await personBiz.BizCreateDataAsync(new PersonModel() { PersonId = personId, PersonName = personName, Gender = Gender.NotKnown, Email = string.Empty, MobilePhone = string.Empty, HomePhone = string.Empty, }, ct);
        }
    }
    /// <summary>
    /// 修改保存時不改變密碼設定，保持原狀
    /// (只在需要修改密碼時才會更新)
    /// </summary>
    /// <param name="oldSet"></param>
    /// <param name="newSet"></param>
    private static void LetPasswordNoUpdate(AccountModel oldSet, AccountModel newSet)
    {
        newSet.PasswordHash = oldSet.PasswordHash;
        newSet.PasswordSalt = oldSet.PasswordSalt;
        newSet.PasswordAlgoVer = oldSet.PasswordAlgoVer;
    }
    /// <summary>
    /// 檢查人員編號是否已被其他帳號使用
    /// </summary>
    protected async Task CheckPersonIdIsUniqueAsync(AccountModel account, FuncAction act, CancellationToken ct = default)
    {
        // 宣告變數
        string personId = account.PersonId?.Trim() ?? string.Empty;
        string condition = BuildPersonIdUniqueCondition(account, act);
        // 執行：空值不檢查
        if (personId.IsNullOrEmpty()) return;
        // 執行：查詢是否已有其他帳號使用此人員編號
        int count = await BizQueryTotalCounts(condition, ct);
        // 執行：重複時提示錯誤
        if (count > 0) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00036, personId);
    }
    /// <summary>
    /// 建立人員編號唯一檢查條件
    /// </summary>
    private static string BuildPersonIdUniqueCondition(AccountModel account, FuncAction act)
    {
        // 宣告變數
        string personId = account.PersonId?.Trim();
        string internalId = account.InternalId?.Trim();
        string accountId = account.AccountId?.Trim();
        // 宣告變數：基本查詢條件
        string condition = $"{nameof(AccountModel.PersonId)} = '{personId}'";
        if (act == FuncAction.Update && !internalId.IsNullOrEmpty())
            condition = LibData.Merge(SysParam.QueryOperators.And, false, condition, $"{nameof(AccountModel.InternalId)} != '{internalId}'");
        else if (act == FuncAction.Update && !accountId.IsNullOrEmpty())
            condition = LibData.Merge(SysParam.QueryOperators.And, false, condition, $"{nameof(AccountModel.AccountId)} != '{accountId}'");
        return condition;
    }
    #endregion
}
