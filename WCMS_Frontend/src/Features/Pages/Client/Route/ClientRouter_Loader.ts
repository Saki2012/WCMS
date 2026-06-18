import type { AxiosInstance } from "axios";
import { useCallback, useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

import { SiteMenuAdapter } from "@/Features/Hooks/BizFunc/WEB/SiteMenu_Api";
import { SiteViewCountAdapter } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { SystemAPI } from "@/SysCore/Utils/API/APIClient";
import { LibCondition, LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { SiteMenu_IndexFields, SiteViewCountHeaderModelFields } from "@/types/SchemaFields";
import type { INormSite } from "./Site-Routing";
import { normalizeSite } from "./Site-Routing";

// #region Property
/** SiteMenu API 回傳的站台選單資料集合型別。 */
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
/** QueryList API 使用的查詢參數型別。 */
type QueryListParam = components["schemas"]["QueryListParam"];
/** SSR/CSR 建立 loader args 時使用的預設 Request URL。 */
const DEFAULT_LOADER_REQUEST_URL = "http://localhost/";
/** 擴充 window，承接 SSR 注入的前台初始狀態。 */
type ClientInitialStateWindow = Window & {
    /** SSR 注入到 window 的前台路由初始狀態。 */
    __INITIAL_STATE__?: SiteRoutingInitialState;
};
/** Footer runtime 顯示所需的站台即時資訊。 */
export interface SiteFooterRuntimeInfo
{
    /** 最近 10 分鐘內瀏覽人數 */
    recentlyViewCount: number | null;
    /** 網站總瀏覽人數 */
    viewCount: number | null;
    /** 網站更新日期 */
    siteUpdatedAt?: string | null;
    /** 前端版本 */
    feVersion?: string | null;
    /** 後端版本 */
    beVersion?: string | null;
}
/** SSR 注入前台時使用的路由初始狀態。 */
export interface SiteRoutingInitialState
{
    /** 目前語系代碼。 */
    lang?: string;
    /** 前台路由使用的站台清單。 */
    sites?: INormSite[];
    /** 依站台代碼暫存的 Footer runtime 資訊。 */
    footerRuntimeBySiteIndex?: Record<string, SiteFooterRuntimeInfo>;
}
/** useSiteFooterRuntime hook 對外提供的狀態與操作。 */
export interface UseSiteFooterRuntimeResult
{
    /** 目前站台 Footer runtime 顯示資料。 */
    runtimeInfo: SiteFooterRuntimeInfo;
    /** Footer runtime 是否正在載入。 */
    isLoading: boolean;
    /** Footer runtime 載入失敗時的錯誤訊息。 */
    errorText: string;
    /** 重新載入 Footer runtime 資訊。 */
    refresh: () => Promise<void>;
}
/** 前台路由站台清單的記憶體快取。 */
let cachedSites: INormSite[] | null = null;
/** Footer runtime 資訊的記憶體快取。 */
let cachedFooterRuntimeBySiteIndex: Record<string, SiteFooterRuntimeInfo> | null = null;
/** SiteViewCount API 回傳的站台瀏覽數資料集合型別。 */
type SiteViewCountSet = components["schemas"]["SiteViewCountSet_DTO"];

/** 最近在線人數 API 回傳資料型別。 */
type CurrentSiteOnlineCountResult = components["schemas"]["GetCurrentSiteOnlineCountResult_DTO"];

/** Loader 回傳 ApiResponse 的包裝型別。 */
type LoaderApiResult<T> = {
    env?: ApiResponse<T>;
    apiRes?: ApiResponse<T>;
};
// #endregion

// #region Public
/** 載入單一站台 Footer runtime 資訊。
 */
export const loadSiteFooterRuntime = async (opt: { request?: Request; siteIndex: string; initialState?: SiteRoutingInitialState; }): Promise<SiteFooterRuntimeInfo> =>
{
    const siteIndex = LibText.safeTrim(opt.siteIndex);
    const initial = getFooterRuntimeFromInitial({ initialState: opt.initialState, siteIndex });
    if (initial) return initial;
    const api = opt?.request ? getSsrApi(opt.request) : undefined;
    const args = buildLoaderArgs(opt?.request);
    const runtimeInfo = await fetchSiteFooterRuntime({ api, args, siteIndex });
    return mergeFooterRuntimeCache(siteIndex, runtimeInfo);
};
/** 載入前台路由站台清單並預熱 Footer runtime cache。
 */
export const loadSitesForRouting = async (opt?: { request?: Request; initialState?: SiteRoutingInitialState; }): Promise<INormSite[]> =>
{
    const fromOpt = opt?.initialState?.sites ?? null;
    const fromWindow = readInitialStateFromWindow()?.sites ?? null;
    const shouldUseCache = !isSsrRoutingRequest(opt);
    const fromCache = shouldUseCache ? getCache() : null;
    if (fromOpt && fromOpt.length > 0)
    {
        setCache(fromOpt);
        await warmFooterRuntimeCache({ request: opt?.request, initialState: opt?.initialState, sites: fromOpt });
        return fromOpt;
    }
    if (fromWindow && fromWindow.length > 0)
    {
        setCache(fromWindow);
        await warmFooterRuntimeCache({ request: opt?.request, initialState: opt?.initialState, sites: fromWindow });
        return fromWindow;
    }
    if (fromCache && fromCache.length > 0)
    {
        await warmFooterRuntimeCache({ request: opt?.request, initialState: opt?.initialState, sites: fromCache });
        return fromCache;
    }
    const api = opt?.request ? getSsrApi(opt.request) : undefined;
    const args = buildLoaderArgs(opt?.request);
    const sites = await fetchSitesByQuery({ api, args });
    setCache(sites);
    await warmFooterRuntimeCache({ request: opt?.request, initialState: opt?.initialState, sites });

    return sites;
};
/** 提供 CSR 使用的 Footer runtime 狀態與重新整理方法。
 */
export const useSiteFooterRuntime = (siteIndex: string): UseSiteFooterRuntimeResult =>
{
    const initial = getFooterRuntimeFromInitial({ siteIndex });
    const [runtimeInfo, setRuntimeInfo] = useState<SiteFooterRuntimeInfo>(() => initial ?? { recentlyViewCount: 0, viewCount: 0, siteUpdatedAt: null, feVersion: null, beVersion: null });
    const [isLoading, setIsLoading] = useState<boolean>(!initial);
    const [errorText, setErrorText] = useState<string>("");
    /** 重新載入 Footer runtime 資訊。 */
    const refresh = useCallback(async () =>
    {
        try
        {
            setIsLoading(true);
            setErrorText("");
            const next = await loadSiteFooterRuntime({ siteIndex });
            setRuntimeInfo(next);
        } catch (error)
        {
            const text = error instanceof Error ? error.message : "Load footer runtime failed.";
            setErrorText(text);
        } finally
        {
            setIsLoading(false);
        }
    }, [siteIndex]);

    useEffect(() =>
    {
        const cached = getFooterRuntimeFromInitial({ siteIndex });
        if (cached)
        {
            setRuntimeInfo(cached);
            setIsLoading(false);
            return;
        }
        void refresh();
    }, [siteIndex, refresh]);

    return { runtimeInfo, isLoading, errorText, refresh };
};
/** 建立 SSR 注入前台路由初始狀態。
 */
export const buildSiteRoutingInitialState = (lang: string): SiteRoutingInitialState =>
{
    const sites = getCache() ?? [];
    const footerRuntimeBySiteIndex = getFooterRuntimeCache();
    return { lang, sites, footerRuntimeBySiteIndex };
};
// #endregion

// #region Protected
/** 查詢單一站台 Footer runtime 原始資料並轉成前台需要的格式。 */
const fetchSiteFooterRuntime = async (opt: { api?: AxiosInstance; args: LoaderFunctionArgs; siteIndex: string; }): Promise<SiteFooterRuntimeInfo> =>
{
    const siteIndex = LibText.safeTrim(opt.siteIndex);
    const siteView = SiteViewCountAdapter(opt.api);
    const systemApi = new SystemAPI(opt.api);
    const viewCountLoader = siteView.loader.createQueryListLoader({ getApiInstance: () => opt.api, getCondition: () => buildFooterViewCountQuery(siteIndex) });
    const recentlyViewCountLoader = siteView.loader.createRecentlySiteViewCountLoader({ getApiInstance: () => opt.api, getArgs: () => ({ siteIndex }) });
    const [viewCountLD, recentlyViewCountLD, backendVersionRes] = await Promise.all([
        viewCountLoader(opt.args),
        recentlyViewCountLoader(opt.args),
        systemApi.getBackendVersion(),
    ]);
    const recentlyViewCount = getRecentlyViewCount(recentlyViewCountLD);
    const viewCount = getViewCount(viewCountLD);
    const beVersion = getBackendVersionText(backendVersionRes);
    return { recentlyViewCount, viewCount, siteUpdatedAt: null, feVersion: null, beVersion };
};
// #endregion

// #region Private
/** 取得 API loader 回傳中的 ApiResponse。 */
const getApiRes = <T>(x: LoaderApiResult<T>): ApiResponse<T> | undefined =>
{
    return x.apiRes ?? x.env;
};
/** 將 API 陣列回應轉成安全陣列。 */
const unwrapArrayOrEmpty = <T>(apiRes?: ApiResponse<T[]>): T[] =>
{
    const ok = Boolean(apiRes?.IsSuccess) && Array.isArray(apiRes?.Data);
    return ok ? apiRes.Data ?? [] : [];
};
/** 將 API 單筆回應轉成安全物件。 */
const unwrapOneOrNull = <T>(apiRes?: ApiResponse<T>): T | null =>
{
    const ok = Boolean(apiRes?.IsSuccess) && apiRes?.Data !== null && apiRes?.Data !== undefined;
    return ok ? apiRes.Data : null;
};
/** 從 CSR window 取得 SSR 注入初始狀態。 */
const readInitialStateFromWindow = (): SiteRoutingInitialState | null =>
{
    const w = typeof window === "undefined" ? null : window as ClientInitialStateWindow;
    const state = w?.__INITIAL_STATE__ ?? null;
    return state;
};
/** 寫入站台路由快取。 */
const setCache = (sites: INormSite[]): void =>
{
    cachedSites = sites;
};
/** 取得站台路由快取。 */
const getCache = (): INormSite[] | null =>
{
    return cachedSites;
};
/** 寫入 Footer runtime 快取。 */
const setFooterRuntimeCache = (map: Record<string, SiteFooterRuntimeInfo>): void =>
{
    cachedFooterRuntimeBySiteIndex = map;
};
/** 取得 Footer runtime 快取。 */
const getFooterRuntimeCache = (): Record<string, SiteFooterRuntimeInfo> =>
{
    return cachedFooterRuntimeBySiteIndex ?? {};
};
/** 合併單一站台 Footer runtime 快取。 */
const mergeFooterRuntimeCache = (siteIndex: string, runtimeInfo: SiteFooterRuntimeInfo): SiteFooterRuntimeInfo =>
{
    const next = { ...getFooterRuntimeCache(), [siteIndex]: runtimeInfo };
    setFooterRuntimeCache(next);
    return runtimeInfo;
};
/** 依站台代碼取得已存在的 Footer runtime 初始資料。 */
const getFooterRuntimeFromInitial = (opt?: { initialState?: SiteRoutingInitialState; siteIndex?: string; }): SiteFooterRuntimeInfo | null =>
{
    const siteIndex = LibText.safeTrim(opt?.siteIndex);
    const fromOpt = opt?.initialState?.footerRuntimeBySiteIndex?.[siteIndex] ?? null;
    const fromWindow = readInitialStateFromWindow()?.footerRuntimeBySiteIndex?.[siteIndex] ?? null;
    const fromCache = getFooterRuntimeCache()?.[siteIndex] ?? null;
    return fromOpt ?? fromWindow ?? fromCache ?? null;
};
/** 從 SiteMenu 清單取出可查詢明細的 InternalId 清單。 */
const getIndexIdsFromRows = (rows: SiteMenuSet[]): string[] =>
{
    const ids = LibText.toTrimmedStringArray(rows.map(row => row.SiteMenu_Index?.InternalId));
    return ids;
};
/** 透過 SiteMenu 查詢前台路由站台資料。 */
const fetchSitesByQuery = async (opt: { api?: AxiosInstance; args: LoaderFunctionArgs; }): Promise<INormSite[]> =>
{
    const adapter = SiteMenuAdapter(opt.api);
    const listLoader = adapter.loader.createQueryListLoader({ getApiInstance: () => opt.api, getCondition: () => ({ Fields: [SiteMenu_IndexFields.InternalId], Condition: "", PageNumber: 0, PageSize: 0 }) });
    const listRes = await listLoader(opt.args);
    const listApiRes = getApiRes(listRes);
    const listRows = unwrapArrayOrEmpty(listApiRes);
    const ids = getIndexIdsFromRows(listRows ?? []);
    const tasks = ids.map(async (id) =>
    {
        const dataLoader = adapter.loader.createQueryDataLoader({ getApiInstance: () => opt.api, getInternalId: () => id });
        const dataRes = await dataLoader(opt.args);
        const dataApiRes = getApiRes(dataRes);
        const row = unwrapOneOrNull(dataApiRes);
        return row ? normalizeSite(row) : null;
    });
    const normSites = await Promise.all(tasks);
    return normSites.filter((x): x is INormSite => Boolean(x));
};
/** 建立 Footer 瀏覽數查詢條件。 */
const buildFooterViewCountCondition = (siteIndex: string): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(SiteViewCountHeaderModelFields.SiteIndex, LibCondition.Operator.Equal, LibText.safeTrim(siteIndex)),
    ]);
};
/** 建立 Footer 瀏覽數 QueryList 查詢參數。 */
const buildFooterViewCountQuery = (siteIndex: string): QueryListParam =>
{
    return { Fields: [SiteViewCountHeaderModelFields.SiteIndex, SiteViewCountHeaderModelFields.PublicViewCount], Condition: buildFooterViewCountCondition(siteIndex), PageNumber: 0, PageSize: 0 };
};
/** 預熱 Footer runtime cache 並避免失敗阻斷路由載入。 */
const warmFooterRuntimeCache = async (opt: { request?: Request; initialState?: SiteRoutingInitialState; sites: INormSite[]; }): Promise<void> =>
{
    const tasks = opt.sites.map((site) => loadSiteFooterRuntime({ request: opt.request, initialState: opt.initialState, siteIndex: site.siteIndex }));
    await Promise.allSettled(tasks);
};
/** 建立 SSR/CSR 共用 loader args。 */
const buildLoaderArgs = (request?: Request): LoaderFunctionArgs =>
{
    return { request: request ?? new Request(DEFAULT_LOADER_REQUEST_URL), params: {} };
};
/** 判斷目前是否為 SSR 路由建構請求。 */
const isSsrRoutingRequest = (opt?: { request?: Request; }): boolean =>
{
    return typeof window === "undefined" && Boolean(opt?.request);
};
/** 取得 Footer 最近在線人數。 */
const getRecentlyViewCount = (loaderData: LoaderApiResult<CurrentSiteOnlineCountResult[]>): number =>
{
    const apiRes = getApiRes(loaderData);
    const rows = unwrapArrayOrEmpty(apiRes);
    const count = rows?.[0]?.CurrentOnlineCount ?? 0;
    return count;
};

/** 取得 Footer 總瀏覽人數。 */
const getViewCount = (loaderData: LoaderApiResult<SiteViewCountSet[]>): number =>
{
    const apiRes = getApiRes(loaderData);
    const rows = unwrapArrayOrEmpty(apiRes);
    const count = rows?.[0]?.SiteViewCountHeader?.PublicViewCount ?? 0;
    return count;
};

/** 取得後端版本文字。 */
const getBackendVersionText = (apiRes?: ApiResponse<string[]>): string | null =>
{
    const rows = unwrapArrayOrEmpty(apiRes);
    const version = LibText.safeTrim(rows?.[0]);
    return version || null;
};
// #endregion
