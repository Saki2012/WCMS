import { SiteViewCountAdapter, type TryCountDetailViewRequest, type TryCountResultDto } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { AxiosInstance } from "axios";
import { useCallback, useEffect, useMemo, useRef } from "react";

const SITE_VIEW_COUNT_STORAGE_PREFIX = "wcms:site-view-count";
const DEFAULT_COOLDOWN_MS = 2 * 60 * 1000;
const pendingMap = new Map<string, boolean>();

/** 共用 count hook 參數 */
interface UseCountGuardOptions
{
    enabled?: boolean;
    auto?: boolean;
    storageKey: string;
    cooldownMs?: number;
    action: () => Promise<ApiResponse<TryCountResultDto | null>>;
}

/** SiteView 專用 hook 參數 */
export interface UseSiteViewCountOptions
{
    enabled?: boolean;
    cooldownMs?: number;
    siteIndex?: string | null;
    apiInstance?: AxiosInstance;
}

/** Form / Detail 頁專用 hook 參數 */
export interface UseFormDetailViewCountOptions
{
    enabled?: boolean;
    cooldownMs?: number;
    contentKey?: string | number | null;
    request?: TryCountDetailViewRequest | null;
    apiInstance?: AxiosInstance;
}

/** Link Click 專用 hook 參數 */
export interface UseLinkClickCountOptions
{
    enabled?: boolean;
    cooldownMs?: number;
    featureKey: string;
    targetKey?: string | number | null;
    request?: TryCountDetailViewRequest | null;
    apiInstance?: AxiosInstance;
}

/** 判斷是否為瀏覽器環境 */
const isBrowser = (): boolean =>
{
    return typeof window !== "undefined";
};

/** 組 sessionStorage key */
const buildStorageKey = (key: string): string =>
{
    return `${SITE_VIEW_COUNT_STORAGE_PREFIX}:${key}`;
};

/** 讀取上次成功送出時間 */
const getLastCountTime = (key: string): number =>
{
    if (!isBrowser()) return 0;

    const rawValue = window.sessionStorage.getItem(buildStorageKey(key));
    const lastTime = Number(rawValue);

    return Number.isFinite(lastTime) ? lastTime : 0;
};

/** 判斷是否仍在冷卻時間內 */
const isCoolingDown = (key: string, cooldownMs: number): boolean =>
{
    const lastTime = getLastCountTime(key);
    if (lastTime <= 0) return false;

    return Date.now() - lastTime < cooldownMs;
};

/** 記錄成功送出時間 */
const saveCountTime = (key: string): void =>
{
    if (!isBrowser()) return;

    window.sessionStorage.setItem(buildStorageKey(key), String(Date.now()));
};

/** 建立失敗用的空回應 */
const buildFailedResponse = (): ApiResponse<TryCountResultDto | null> =>
{
    return { IsSuccess: false, Data: null, SysMessage: [] };
};

/** 執行真正的 count，內含 pending + cooldown 防重送 */
const executeCountAsync = async (key: string, cooldownMs: number, action: () => Promise<ApiResponse<TryCountResultDto | null>>): Promise<boolean> =>
{
    if (pendingMap.get(key)) return false;
    if (isCoolingDown(key, cooldownMs)) return false;

    pendingMap.set(key, true);

    try
    {
        const apiRes = await action();
        const isSuccess = apiRes.IsSuccess === true;

        if (isSuccess) saveCountTime(key);

        return isSuccess;
    } catch
    {
        return false;
    } finally
    {
        pendingMap.delete(key);
    }
};

/** 最底層共用 hook：Site / Page / Link 都走這裡 */
const useCountGuard = (options: UseCountGuardOptions) =>
{
    const actionRef = useRef(options.action);

    useEffect(() =>
    {
        actionRef.current = options.action;
    }, [options.action]);

    const runCount = useCallback(async (): Promise<boolean> =>
    {
        if (options.enabled === false) return false;

        return await executeCountAsync(options.storageKey, options.cooldownMs ?? DEFAULT_COOLDOWN_MS, async () => await actionRef.current());
    }, [options.enabled, options.storageKey, options.cooldownMs]);

    useEffect(() =>
    {
        if (options.auto === false) return;

        void runCount();
    }, [options.auto, runCount]);

    return { runCount };
};

/** Index / 站台層瀏覽次數 */
export const useSiteViewCount = (options: UseSiteViewCountOptions) =>
{
    const adapter = useMemo(() => SiteViewCountAdapter(options.apiInstance), [options.apiInstance]);
    const { isCounting, tryCountSiteViewAsync } = adapter.hooks.useCountActions({ apiInstance: options.apiInstance });

    const siteIndex = options.siteIndex ?? "";
    const enabled = options.enabled !== false;

    const storageKey = useMemo(() =>
    {
        return `site:${siteIndex}`;
    }, [siteIndex]);

    const { runCount } = useCountGuard({
        enabled,
        auto: true,
        storageKey,
        cooldownMs: options.cooldownMs,
        action: async (): Promise<ApiResponse<TryCountResultDto | null>> =>
        {
            return await tryCountSiteViewAsync(siteIndex);
        },
    });

    return { isCounting, runCount };
};

/** Form / Detail 頁瀏覽次數 */
export const useFormDetailViewCount = (options: UseFormDetailViewCountOptions) =>
{
    const adapter = useMemo(() => SiteViewCountAdapter(options.apiInstance), [options.apiInstance]);
    const { isCounting, tryCountPageViewAsync } = adapter.hooks.useCountActions({ apiInstance: options.apiInstance });

    const contentKey = `${options.contentKey ?? ""}`.trim();
    const enabled = Boolean(contentKey) && Boolean(options.request) && options.enabled !== false;

    const storageKey = useMemo(() =>
    {
        return `page:${contentKey}`;
    }, [contentKey]);

    const { runCount } = useCountGuard({
        enabled,
        auto: true,
        storageKey,
        cooldownMs: options.cooldownMs,
        action: async (): Promise<ApiResponse<TryCountResultDto | null>> =>
        {
            if (!options.request) return buildFailedResponse();
            return await tryCountPageViewAsync(options.request);
        },
    });

    return { isCounting, runCount };
};

/** Link Click 計數 */
export const useLinkClickCount = (options: UseLinkClickCountOptions) =>
{
    const adapter = useMemo(() => SiteViewCountAdapter(options.apiInstance), [options.apiInstance]);
    const { isCounting, tryCountLinkClickAsync } = adapter.hooks.useCountActions({ apiInstance: options.apiInstance });

    const targetKey = `${options.targetKey ?? ""}`.trim();
    const enabled = Boolean(options.featureKey) && Boolean(targetKey) && Boolean(options.request) && options.enabled !== false;

    const storageKey = useMemo(() =>
    {
        return `link:${options.featureKey}:${targetKey}`;
    }, [options.featureKey, targetKey]);

    const { runCount } = useCountGuard({
        enabled,
        auto: false,
        storageKey,
        cooldownMs: options.cooldownMs,
        action: async (): Promise<ApiResponse<TryCountResultDto | null>> =>
        {
            if (!options.request) return buildFailedResponse();
            return await tryCountLinkClickAsync(options.request);
        },
    });

    return { isCounting, runCount };
};
