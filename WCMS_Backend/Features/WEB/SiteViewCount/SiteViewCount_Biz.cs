using System.Linq.Expressions;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.WEB.SiteViewCount
{
    [LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.SiteViewCount)]
    public class SiteViewCountFunc_Biz(BizDeps bizDeps) : BizService<SiteViewCountSet>(bizDeps), IBizService<SiteViewCountSet>
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
            public const string Header = "Header";
            public const string Detail = "Detail";
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
        /// 執行主站瀏覽計數
        /// </summary>
        private async Task<TryCountResult_DTO> TryCountSiteViewAsync(string siteIndex, string visitorKey, string refererUrl, CancellationToken ct = default)
        {
            bool ownsTx = false;
            DateTime now = DateTime.Now;
            TryCountResult_DTO result = new();
            try
            {
                // 執行 function：基本檢查
                ct.ThrowIfCancellationRequested();
                if (string.IsNullOrWhiteSpace(visitorKey))
                {
                    Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, nameof(visitorKey));
                    return result;
                }
                // 執行 function：開始交易
                ownsTx = await TryBeginTransactionAsync();
                // 執行 function：先檢查去重
                var recent = await GetRecentlyInfoAsync(siteIndex, string.Empty, string.Empty, CountTargetType.Header, ViewCountActionType.PageView, visitorKey,ct);
                if (recent != null && !ShouldCount(recent.LastViewTime, now))
                {
                    result.CurrentCount = await GetSiteViewCountAsync(siteIndex, ct);
                    await TryCommitAsync(ownsTx);
                    return result;
                }
                // 執行 function：更新 recent + count
                await SaveRecentlyInfoAsync(recent, siteIndex, string.Empty, string.Empty, CountTargetType.Header, ViewCountActionType.PageView, visitorKey, refererUrl, now, ct);
                result.CurrentCount = await IncreaseSiteViewCountAsync(siteIndex, ct);
                result.IsCounted = true;
                // 執行 function：提交
                await TryCommitAsync(ownsTx);
                // return
                return result;
            }
            catch
            {
                await TryRollbackAsync(ownsTx);
                throw;
            }
        } 

        /// <summary>
        /// 執行功能/頁面個別計數
        /// </summary>
        private async Task<TryCountResult_DTO> TryCountDetailViewAsync(string siteIndex, string progId, string internalId, ViewCountActionType actionType, string visitorKey, string refererUrl, CancellationToken ct = default)
        {
            bool ownsTx = false;
            DateTime now = DateTime.Now;
            TryCountResult_DTO result = new();
            try
            {
                // 執行 function：基本檢查
                ct.ThrowIfCancellationRequested();
                if (string.IsNullOrWhiteSpace(visitorKey)) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, nameof(visitorKey));
                if (string.IsNullOrWhiteSpace(progId)) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, nameof(progId));
                if (string.IsNullOrWhiteSpace(internalId)) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, nameof(internalId));
                if (Message.HasError) return result;
                // 執行 function：開始交易
                ownsTx = await TryBeginTransactionAsync();
                // 執行 function：先檢查去重
                var recent = await GetRecentlyInfoAsync(siteIndex, progId, internalId, CountTargetType.Detail, actionType, visitorKey, ct);
                if (recent != null && !ShouldCount(recent.LastViewTime, now))
                {
                    result.CurrentCount = await GetDetailViewCountAsync(siteIndex, progId, internalId, actionType, ct);
                    await TryCommitAsync(ownsTx);
                    return result;
                }
                // 執行 function：更新 recent + count
                await SaveRecentlyInfoAsync(recent, siteIndex, progId, internalId, CountTargetType.Detail, actionType, visitorKey, refererUrl, now, ct);
                result.CurrentCount = await IncreaseDetailViewCountAsync(siteIndex, progId, internalId, actionType, ct);
                result.IsCounted = true;
                // 執行 function：提交
                await TryCommitAsync(ownsTx);
                // return
                return result;
            }
            catch
            {
                await TryRollbackAsync(ownsTx);
                throw;
            }
        }

        /// <summary>
        /// 取得最近一次成功計次紀錄
        /// </summary>
        private async Task<SiteViewCountRecentlyModel?> GetRecentlyInfoAsync(string siteIndex, string progId, string targetInternalId, string targetType, ViewCountActionType actionType, string visitorKey, CancellationToken ct = default)
        {
            // 宣告變數
            dynamic recentRepo = RepoMapProvider.EnsureRepo<SiteViewCountSet>(typeof(SiteViewCountRecentlyModel));
            // 執行 function
            ct.ThrowIfCancellationRequested();
            // return
            return await recentRepo.QueryDataAsync(siteIndex, progId, targetInternalId, targetType, actionType, visitorKey);
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
        private async Task SaveRecentlyInfoAsync(SiteViewCountRecentlyModel? currentRecent, string siteIndex, string progId, string targetInternalId, string targetType, ViewCountActionType actionType, string visitorKey, string refererUrl, DateTime now, CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();
            if (currentRecent == null)
            {
                await CreateRecentlyInfoAsync(
                    siteIndex,
                    progId,
                    targetInternalId,
                    targetType,
                    actionType,
                    visitorKey,
                    refererUrl,
                    now,
                    ct);
                return;
            }
            await UpdateRecentlyInfoAsync(currentRecent, refererUrl, now, ct);
        }

        /// <summary>
        /// 新增 Recently 紀錄
        /// </summary>
        private async Task CreateRecentlyInfoAsync(string siteIndex, string progId, string targetInternalId, string targetType, ViewCountActionType actionType, string visitorKey, string refererUrl, DateTime now, CancellationToken ct = default)
        {
            dynamic recentRepo = RepoMapProvider.EnsureRepo<SiteViewCountSet>(typeof(SiteViewCountRecentlyModel));
            SiteViewCountRecentlyModel newRecent = new()
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
            await recentRepo.CreateAsync(newRecent);
        }

        /// <summary>
        /// 更新 Recently 紀錄
        /// </summary>
        private async Task UpdateRecentlyInfoAsync(SiteViewCountRecentlyModel currentRecent, string refererUrl, DateTime now, CancellationToken ct = default)
        {
            dynamic recentRepo = RepoMapProvider.EnsureRepo<SiteViewCountSet>(typeof(SiteViewCountRecentlyModel));
            SiteViewCountRecentlyModel newRecent = currentRecent.Snapshot();
            ct.ThrowIfCancellationRequested();
            newRecent.RefererUrl = refererUrl;
            newRecent.LastViewTime = now;
            await recentRepo.UpdateAsync(currentRecent, newRecent);
        } 
        /// <summary>
        /// 取得主站目前瀏覽次數
        /// </summary>
        private async Task<int> GetSiteViewCountAsync(string siteIndex, CancellationToken ct = default)
        {
            dynamic headerRepo = RepoMapProvider.EnsureRepo<SiteViewCountSet>(typeof(SiteViewCountHeaderModel));
            ct.ThrowIfCancellationRequested();
            SiteViewCountHeaderModel? data = await headerRepo.QueryDataAsync(siteIndex);
            return data?.PublicViewCount ?? 0;
        }
        /// <summary>
        /// 累加主站瀏覽次數
        /// </summary>
        private async Task<int> IncreaseSiteViewCountAsync(string siteIndex, CancellationToken ct = default)
        {
            dynamic headerRepo = RepoMapProvider.EnsureRepo<SiteViewCountSet>(typeof(SiteViewCountHeaderModel));
            SiteViewCountHeaderModel? oldHeader = await headerRepo.QueryDataAsync(siteIndex);
            ct.ThrowIfCancellationRequested();
            if (oldHeader == null)
            {
                SiteViewCountHeaderModel newHeader = CreateHeader(siteIndex);
                newHeader.PublicViewCount = 1;
                await headerRepo.CreateAsync(newHeader);
                return newHeader.PublicViewCount;
            }
            SiteViewCountHeaderModel updateHeader = oldHeader.Snapshot();
            updateHeader.PublicViewCount += 1;
            updateHeader.ModifyTime = DateTime.Now;
            updateHeader.ModifyUserId = OperateUser?.UserId ?? string.Empty;
            await headerRepo.UpdateAsync(oldHeader, updateHeader);
            return updateHeader.PublicViewCount;
        }
        /// <summary>
        /// 取得功能/頁面目前次數
        /// </summary>
        private async Task<int> GetDetailViewCountAsync(string siteIndex, string progId, string internalId, ViewCountActionType actionType, CancellationToken ct = default)
        {
            dynamic detailRepo = RepoMapProvider.EnsureRepo<SiteViewCountSet>(typeof(SiteViewCountDetailModel));
            ct.ThrowIfCancellationRequested();
            SiteViewCountDetailModel? data = await detailRepo.QueryDataAsync(siteIndex, progId, internalId);
            return data == null ? 0 : GetDetailCount(data, actionType);
        }
        /// <summary>
        /// 累加功能/頁面個別次數
        /// </summary>
        private async Task<int> IncreaseDetailViewCountAsync(string siteIndex, string progId, string internalId, ViewCountActionType actionType, CancellationToken ct = default)
        {
            dynamic detailRepo = RepoMapProvider.EnsureRepo<SiteViewCountSet>(typeof(SiteViewCountDetailModel));
            SiteViewCountDetailModel? oldDetail = await detailRepo.QueryDataAsync(siteIndex, progId, internalId);
            ct.ThrowIfCancellationRequested();
            if (oldDetail == null)
            {
                SiteViewCountDetailModel newDetail = CreateDetail(siteIndex, progId, internalId);
                IncreaseDetailCount(newDetail, actionType);
                await detailRepo.CreateAsync(newDetail);
                return GetDetailCount(newDetail, actionType);
            }
            SiteViewCountDetailModel updateDetail = oldDetail.Snapshot();
            IncreaseDetailCount(updateDetail, actionType);
            await detailRepo.UpdateAsync(oldDetail, updateDetail);
            return GetDetailCount(updateDetail, actionType);
        }
        /// <summary>
        /// 建立 Header 初始資料
        /// </summary>
        private SiteViewCountHeaderModel CreateHeader(string siteIndex)
        {
            DateTime now = DateTime.Now;
            string userId = OperateUser?.UserId ?? string.Empty;
            return new SiteViewCountHeaderModel
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
        private SiteViewCountDetailModel CreateDetail(string siteIndex, string progId, string internalId)
        {
            return new SiteViewCountDetailModel
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
        private void IncreaseDetailCount(SiteViewCountDetailModel detail, ViewCountActionType actionType)
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
        private int GetDetailCount(SiteViewCountDetailModel detail, ViewCountActionType actionType)
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
            dynamic recentRepo = RepoMapProvider.EnsureRepo<SiteViewCountSet>(typeof(SiteViewCountRecentlyModel));
            DateTime thresholdTime = queryTime.AddMinutes(-RecentlySiteViewMinutes);
            Expression<Func<SiteViewCountRecentlyModel, bool>> whereExpr = p =>
                p.SiteIndex == siteIndex &&
                p.ProgId == string.Empty &&
                p.TargetInternalId == string.Empty &&
                p.TargetType == CountTargetType.Header &&
                p.ActionType == ViewCountActionType.PageView &&
                p.LastViewTime >= thresholdTime;

            ct.ThrowIfCancellationRequested();
            return await recentRepo.QueryListCountAsync(whereExpr);
        }
        #endregion
    }
}