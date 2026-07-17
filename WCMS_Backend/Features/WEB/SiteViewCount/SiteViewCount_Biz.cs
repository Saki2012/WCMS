using System.Linq.Expressions;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.FeatureDriver.Repo;
using WCMS.SysCore.Library;
namespace WCMS.Features.WEB.SiteViewCount;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.SiteViewCount)]
public class SiteViewCountFunc_Biz(BizDeps bizDeps) : BizService<SiteViewCountHeader>(bizDeps)
{
    #region Property
    /// <summary>
    /// 去重時間窗
    /// </summary>
    private static readonly TimeSpan RecentWindow = TimeSpan.FromMinutes(10);
    /// <summary>
    /// Recently 的 TargetType 常數
    /// </summary>
    private static class CountTargetType
    {
        public const string Header = nameof(Header);
        public const string Detail = nameof(Detail);
    }
    /// <summary>
    /// 同時在線人數統計的時間窗(分鐘)
    /// </summary>
    private const int RecentlySiteViewMinutes = 10;
    #endregion

    #region Public
    /// <summary>
    /// 更新主站整體瀏覽次數
    /// </summary>
    public async Task<TryCountResult_DTO> BizUpdateSiteViewCount(string siteIndex, string visitorKey, string refererUrl, CancellationToken ct = default)
    {
        return await TryCountSiteViewAsync(siteIndex?.Trim() ?? string.Empty, visitorKey?.Trim() ?? string.Empty, refererUrl?.Trim() ?? string.Empty, ct);
    }
    /// <summary>
    /// 更新功能/頁面個別次數
    /// </summary>
    public async Task<TryCountResult_DTO> BizUpdatePageViewCount(string siteIndex, string progId, string internalId, ViewCountActionType actionType, string visitorKey, string refererUrl, CancellationToken ct = default)
    {
        return await TryCountDetailViewAsync(siteIndex?.Trim() ?? string.Empty, progId?.Trim() ?? string.Empty, internalId?.Trim() ?? string.Empty, actionType, visitorKey?.Trim() ?? string.Empty, refererUrl?.Trim() ?? string.Empty, ct);
    }
    /// <summary>
    /// 查詢最近 10 分鐘內站台瀏覽人數
    /// </summary>
    public async Task<GetCurrentSiteOnlineCountResult_DTO> BizGetRecentlySiteViewCount(string siteIndex, CancellationToken ct = default)
    {
        string currentSiteIndex = siteIndex?.Trim() ?? string.Empty;
        DateTime queryTime = DateTime.Now;
        int currentCount = await GetRecentlySiteViewCountAsync(currentSiteIndex, queryTime, ct);
        return new GetCurrentSiteOnlineCountResult_DTO { SiteIndex = currentSiteIndex, Minutes = RecentlySiteViewMinutes, CurrentOnlineCount = currentCount, QueryTime = queryTime, };
    }
    #endregion

    #region Private
    /// <summary>
    /// 執行主站瀏覽計數。
    /// </summary>
    private async Task<TryCountResult_DTO> TryCountSiteViewAsync(
        string siteIndex,
        string visitorKey,
        string refererUrl,
        CancellationToken ct = default)
    {
        TryCountResult_DTO result = new();
        ct.ThrowIfCancellationRequested();
        if (!ValidateSiteCountInput(visitorKey)) return result;
        DateTime now = DateTime.Now;
        return await ExecTransactionAsync(
            token => CountSiteViewInTransactionAsync(
                siteIndex,
                visitorKey,
                refererUrl,
                now,
                result,
                token),
            ct: ct);
    }
    /// <summary>
    /// 在交易內完成主站去重與累加。
    /// </summary>
    private async Task<TryCountResult_DTO> CountSiteViewInTransactionAsync(
        string siteIndex,
        string visitorKey,
        string refererUrl,
        DateTime now,
        TryCountResult_DTO result,
        CancellationToken ct)
    {
        SiteViewCountRecently? recent = await GetRecentlyInfoAsync(
            siteIndex,
            string.Empty,
            string.Empty,
            CountTargetType.Header,
            ViewCountActionType.PageView,
            visitorKey,
            ct);
        if (recent != null && !ShouldCount(recent.LastViewTime, now))
        {
            result.CurrentCount = await GetSiteViewCountAsync(siteIndex, ct);
            return result;
        }
        await SaveRecentlyInfoAsync(
            recent,
            siteIndex,
            string.Empty,
            string.Empty,
            CountTargetType.Header,
            ViewCountActionType.PageView,
            visitorKey,
            refererUrl,
            now,
            ct);
        result.CurrentCount = await IncreaseSiteViewCountAsync(siteIndex, ct);
        result.IsCounted = true;
        return result;
    }
    /// <summary>
    /// 執行功能或頁面個別計數。
    /// </summary>
    private async Task<TryCountResult_DTO> TryCountDetailViewAsync(
        string siteIndex,
        string progId,
        string internalId,
        ViewCountActionType actionType,
        string visitorKey,
        string refererUrl,
        CancellationToken ct = default)
    {
        TryCountResult_DTO result = new();
        ct.ThrowIfCancellationRequested();
        ValidateDetailCountInput(progId, internalId, visitorKey);
        if (Message.HasError) return result;
        DateTime now = DateTime.Now;
        return await ExecTransactionAsync(
            token => CountDetailViewInTransactionAsync(
                siteIndex,
                progId,
                internalId,
                actionType,
                visitorKey,
                refererUrl,
                now,
                result,
                token),
            ct: ct);
    }
    /// <summary>
    /// 在交易內完成功能頁面去重與累加。
    /// </summary>
    private async Task<TryCountResult_DTO> CountDetailViewInTransactionAsync(
        string siteIndex,
        string progId,
        string internalId,
        ViewCountActionType actionType,
        string visitorKey,
        string refererUrl,
        DateTime now,
        TryCountResult_DTO result,
        CancellationToken ct)
    {
        SiteViewCountRecently? recent = await GetRecentlyInfoAsync(
            siteIndex,
            progId,
            internalId,
            CountTargetType.Detail,
            actionType,
            visitorKey,
            ct);
        if (recent != null && !ShouldCount(recent.LastViewTime, now))
        {
            result.CurrentCount = await GetDetailViewCountAsync(
                siteIndex,
                progId,
                internalId,
                actionType,
                ct);
            return result;
        }
        await SaveRecentlyInfoAsync(
            recent,
            siteIndex,
            progId,
            internalId,
            CountTargetType.Detail,
            actionType,
            visitorKey,
            refererUrl,
            now,
            ct);
        result.CurrentCount = await IncreaseDetailViewCountAsync(
            siteIndex,
            progId,
            internalId,
            actionType,
            ct);
        result.IsCounted = true;
        return result;
    }
    /// <summary>
    /// 驗證主站計次必要參數。
    /// </summary>
    private bool ValidateSiteCountInput(string visitorKey)
    {
        if (!string.IsNullOrWhiteSpace(visitorKey)) return true;
        Message.AddMessage(
            MessageStatus.Error,
            SysMessageCode.BECode00012,
            nameof(visitorKey));
        return false;
    }
    /// <summary>
    /// 驗證功能頁面計次必要參數。
    /// </summary>
    private void ValidateDetailCountInput(
        string progId,
        string internalId,
        string visitorKey)
    {
        if (string.IsNullOrWhiteSpace(visitorKey))
            Message.AddMessage(
                MessageStatus.Error,
                SysMessageCode.BECode00012,
                nameof(visitorKey));
        if (string.IsNullOrWhiteSpace(progId))
            Message.AddMessage(
                MessageStatus.Error,
                SysMessageCode.BECode00012,
                nameof(progId));
        if (string.IsNullOrWhiteSpace(internalId))
            Message.AddMessage(
                MessageStatus.Error,
                SysMessageCode.BECode00012,
                nameof(internalId));
    }

    /// <summary>
    /// 取得最近一次成功計次紀錄
    /// </summary>
    private async Task<SiteViewCountRecently?> GetRecentlyInfoAsync(string siteIndex, string progId, string targetInternalId, string targetType, ViewCountActionType actionType, string visitorKey, CancellationToken ct = default)
    {
        // 宣告變數
        dynamic recentRepo = DbRepositoryProvider.GetRepo(typeof(SiteViewCountRecently));
        // 執行 function
        ct.ThrowIfCancellationRequested();
        // return
        return await recentRepo.FindByKeyAsync(ct, siteIndex, progId, targetInternalId, targetType, actionType, visitorKey);
    }
    /// <summary>
    /// 判斷是否應正式計次
    /// </summary>
    private static bool ShouldCount(DateTime lastViewTime, DateTime now)
    {
        return now - lastViewTime >= RecentWindow;
    }

    /// <summary>
    /// 新增或更新 Recently 紀錄
    /// </summary>
    private async Task SaveRecentlyInfoAsync(SiteViewCountRecently? currentRecent, string siteIndex, string progId, string targetInternalId, string targetType, ViewCountActionType actionType, string visitorKey, string refererUrl, DateTime now, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        if (currentRecent == null)
        {
            await CreateRecentlyInfoAsync(siteIndex, progId, targetInternalId, targetType, actionType, visitorKey, refererUrl, now, ct);
            return;
        }
        await UpdateRecentlyInfoAsync(currentRecent, refererUrl, now, ct);
    }

    /// <summary>
    /// 新增 Recently 紀錄
    /// </summary>
    private async Task CreateRecentlyInfoAsync(string siteIndex, string progId, string targetInternalId, string targetType, ViewCountActionType actionType, string visitorKey, string refererUrl, DateTime now, CancellationToken ct = default)
    {
        dynamic recentRepo = DbRepositoryProvider.GetRepo(typeof(SiteViewCountRecently));
        SiteViewCountRecently newRecent = new()
        {
            SiteIndex = siteIndex,
            ProgId = progId,
            TargetInternalId = targetInternalId,
            TargetType = targetType,
            ActionType = actionType,
            VisitorKey = visitorKey,
            LastViewTime = now,
            RefererUrl = refererUrl,
        };
        ct.ThrowIfCancellationRequested();
        await recentRepo.CreateAsync(newRecent, ct);
    }

    /// <summary>
    /// 更新 Recently 紀錄
    /// </summary>
    private async Task UpdateRecentlyInfoAsync(SiteViewCountRecently currentRecent, string refererUrl, DateTime now, CancellationToken ct = default)
    {
        dynamic recentRepo = DbRepositoryProvider.GetRepo(typeof(SiteViewCountRecently));
        SiteViewCountRecently newRecent = currentRecent.Snapshot();
        ct.ThrowIfCancellationRequested();
        newRecent.RefererUrl = refererUrl;
        newRecent.LastViewTime = now;
        await recentRepo.UpdateAsync(currentRecent, newRecent, ct);
    }
    /// <summary>
    /// 取得主站目前瀏覽次數
    /// </summary>
    private async Task<int> GetSiteViewCountAsync(string siteIndex, CancellationToken ct = default)
    {
        dynamic headerRepo = DbRepositoryProvider.GetRepo(typeof(SiteViewCountHeader));
        ct.ThrowIfCancellationRequested();
        SiteViewCountHeader? data = await headerRepo.FindByKeyAsync(ct, siteIndex);
        return data?.PublicViewCount ?? 0;
    }
    /// <summary>
    /// 累加主站瀏覽次數
    /// </summary>
    private async Task<int> IncreaseSiteViewCountAsync(string siteIndex, CancellationToken ct = default)
    {
        dynamic headerRepo = DbRepositoryProvider.GetRepo(typeof(SiteViewCountHeader));
        SiteViewCountHeader? oldHeader = await headerRepo.FindByKeyAsync(ct, siteIndex);
        ct.ThrowIfCancellationRequested();
        if (oldHeader == null)
        {
            SiteViewCountHeader newHeader = CreateHeader(siteIndex);
            newHeader.PublicViewCount = 1;
            await headerRepo.CreateAsync(newHeader, ct);
            return newHeader.PublicViewCount;
        }
        SiteViewCountHeader updateHeader = oldHeader.Snapshot();
        updateHeader.PublicViewCount += 1;
        updateHeader.ModifyTime = DateTime.Now;
        updateHeader.ModifyUserId = OperateUser?.UserId ?? string.Empty;
        await headerRepo.UpdateAsync(oldHeader, updateHeader, ct);
        return updateHeader.PublicViewCount;
    }
    /// <summary>
    /// 取得功能/頁面目前次數
    /// </summary>
    private async Task<int> GetDetailViewCountAsync(string siteIndex, string progId, string internalId, ViewCountActionType actionType, CancellationToken ct = default)
    {
        dynamic detailRepo = DbRepositoryProvider.GetRepo(typeof(SiteViewCountDetail));
        ct.ThrowIfCancellationRequested();
        SiteViewCountDetail? data = await detailRepo.FindByKeyAsync(ct, siteIndex, progId, internalId);
        return data == null ? 0 : GetDetailCount(data, actionType);
    }
    /// <summary>
    /// 累加功能/頁面個別次數
    /// </summary>
    private async Task<int> IncreaseDetailViewCountAsync(string siteIndex, string progId, string internalId, ViewCountActionType actionType, CancellationToken ct = default)
    {
        dynamic detailRepo = DbRepositoryProvider.GetRepo(typeof(SiteViewCountDetail));
        SiteViewCountDetail? oldDetail = await detailRepo.FindByKeyAsync(ct, siteIndex, progId, internalId);
        ct.ThrowIfCancellationRequested();
        if (oldDetail == null)
        {
            SiteViewCountDetail newDetail = CreateDetail(siteIndex, progId, internalId);
            IncreaseDetailCount(newDetail, actionType);
            await detailRepo.CreateAsync(newDetail, ct);
            return GetDetailCount(newDetail, actionType);
        }
        SiteViewCountDetail updateDetail = oldDetail.Snapshot();
        IncreaseDetailCount(updateDetail, actionType);
        await detailRepo.UpdateAsync(oldDetail, updateDetail, ct);
        return GetDetailCount(updateDetail, actionType);
    }
    /// <summary>
    /// 建立 Header 初始資料
    /// </summary>
    private SiteViewCountHeader CreateHeader(string siteIndex)
    {
        DateTime now = DateTime.Now;
        string userId = OperateUser?.UserId ?? string.Empty;
        return new SiteViewCountHeader
        {
            SiteIndex = siteIndex,
            InternalId = Guid.NewGuid().ToString(),
            CreateTime = now,
            ModifyTime = now,
            CreateUserId = userId,
            ModifyUserId = userId,
            FormStatus = FormStatus.Saved,
            DataStatus = DataStatus.Valid,
            PublicViewCount = 0,
        };
    }
    /// <summary>
    /// 建立 Detail 初始資料
    /// </summary>
    private SiteViewCountDetail CreateDetail(string siteIndex, string progId, string internalId)
    {
        return new SiteViewCountDetail
        {
            SiteIndex = siteIndex,
            ProgId = progId,
            TargetInternalId = internalId,
            PageViewCount = 0,
            FilePreviewCount = 0,
            FileDownloadCount = 0,
            LinkClickCount = 0,
        };
    }
    /// <summary>
    /// 累加對應 Detail 欄位
    /// </summary>
    private void IncreaseDetailCount(SiteViewCountDetail detail, ViewCountActionType actionType)
    {
        switch (actionType)
        {
            case ViewCountActionType.PageView:
                detail.PageViewCount += 1;
                break;
            case ViewCountActionType.FilePreview:
                detail.FilePreviewCount += 1;
                break;
            case ViewCountActionType.FileDownload:
                detail.FileDownloadCount += 1;
                break;
            case ViewCountActionType.LinkClick:
                detail.LinkClickCount += 1;
                break;
        }
    }
    /// <summary>
    /// 取得對應 Detail 欄位目前值
    /// </summary>
    private int GetDetailCount(SiteViewCountDetail detail, ViewCountActionType actionType)
    {
        return actionType switch
        {
            ViewCountActionType.PageView => detail.PageViewCount,
            ViewCountActionType.FilePreview => detail.FilePreviewCount,
            ViewCountActionType.FileDownload => detail.FileDownloadCount,
            ViewCountActionType.LinkClick => detail.LinkClickCount,
            _ => 0,
        };
    }
    /// <summary>
    /// 取得最近 10 分鐘內主站 Header PageView 的人數
    /// </summary>
    private async Task<int> GetRecentlySiteViewCountAsync(string siteIndex, DateTime queryTime, CancellationToken ct = default)
    {
        dynamic recentRepo = DbRepositoryProvider.GetRepo(typeof(SiteViewCountRecently));
        DateTime thresholdTime = queryTime.AddMinutes(-RecentlySiteViewMinutes);
        Expression<Func<SiteViewCountRecently, bool>> whereExpr = p =>
            p.SiteIndex == siteIndex &&
            p.ProgId == string.Empty &&
            p.TargetInternalId == string.Empty &&
            p.TargetType == CountTargetType.Header &&
            p.ActionType == ViewCountActionType.PageView &&
            p.LastViewTime >= thresholdTime;
        ct.ThrowIfCancellationRequested();
        return await recentRepo.QueryListCountAsync(whereExpr, ct);
    }
    #endregion
}