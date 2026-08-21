// #region Property
export interface IAuthRefreshRunResult
{
    /** 此 Tab 是否真的送出 Refresh Request。 */
    Performed: boolean;
    /** Browser 最近一次成功完成 Refresh 的時間。 */
    CompletedAt: number;
}

const REFRESH_LOCK_NAME = "wcms:auth:refresh";
const LAST_REFRESH_COMPLETED_KEY = "wcms:auth:refresh:last-completed-at";
let refreshInFlight: Promise<IAuthRefreshRunResult> | null = null;
// #endregion

// #region Public
/** 以同 Tab Single-flight 與 Browser Web Lock 協調 Refresh。 */
export const runAuthRefresh = (refreshRequest: () => Promise<void>): Promise<IAuthRefreshRunResult> =>
{
    if (refreshInFlight) return refreshInFlight;

    const startedAt = Date.now();
    refreshInFlight = runBrowserCoordinatedRefresh(startedAt, refreshRequest).finally(() =>
    {
        refreshInFlight = null;
    });

    return refreshInFlight;
};

/** 讀取同 Origin Browser 最近一次成功 Refresh 的時間。 */
export const getLastAuthRefreshCompletedAt = (): number | null =>
{
    if (typeof window === "undefined") return null;
    return readSharedRefreshCompletedAt();
};
// #endregion

// #region Private
/** 有 Web Locks 時跨 Tab 序列化 Refresh；不支援時退回同 Tab Single-flight。 */
const runBrowserCoordinatedRefresh = async (startedAt: number, refreshRequest: () => Promise<void>): Promise<IAuthRefreshRunResult> =>
{
    const lockManager = getBrowserLockManager();
    if (!lockManager) return executeRefreshRequest(refreshRequest);

    return lockManager.request(REFRESH_LOCK_NAME, async () =>
    {
        const completedAt = readSharedRefreshCompletedAt();
        if (completedAt !== null && completedAt >= startedAt) return buildSkippedResult(completedAt);

        return executeRefreshRequest(refreshRequest);
    });
};

/** 執行真正 Refresh Request，成功後只共享完成時間，不共享 Token 原文。 */
const executeRefreshRequest = async (refreshRequest: () => Promise<void>): Promise<IAuthRefreshRunResult> =>
{
    await refreshRequest();
    const completedAt = Date.now();
    writeSharedRefreshCompletedAt(completedAt);
    return { Performed: true, CompletedAt: completedAt };
};

/** 取得 Browser Web Locks 管理器；SSR 或不支援 Browser 直接回傳 null。 */
const getBrowserLockManager = (): LockManager | null =>
{
    if (typeof navigator === "undefined" || !("locks" in navigator)) return null;
    return navigator.locks;
};

/** 建立已由其他 Tab 完成 Refresh 的協調結果。 */
const buildSkippedResult = (completedAt: number): IAuthRefreshRunResult =>
{
    return { Performed: false, CompletedAt: completedAt };
};

/** 讀取 Browser Shared Refresh 完成時間。 */
const readSharedRefreshCompletedAt = (): number | null =>
{
    try
    {
        return parseTimestamp(window.localStorage.getItem(LAST_REFRESH_COMPLETED_KEY));
    }
    catch
    {
        return null;
    }
};

/** 寫入 Browser Shared Refresh 完成時間。 */
const writeSharedRefreshCompletedAt = (completedAt: number): void =>
{
    try
    {
        window.localStorage.setItem(LAST_REFRESH_COMPLETED_KEY, String(completedAt));
    }
    catch
    {
        // Storage 不可用時仍保留同 Tab Single-flight 與 Backend Atomic Rotation 防線。
    }
};

/** 將 Storage timestamp 轉為有效 Browser 時間。 */
const parseTimestamp = (value: string | null): number | null =>
{
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
// #endregion
