import type { AxiosInstance } from "axios";
import type { LoaderFunctionArgs } from "react-router-dom";

import { SiteMenuAdapter } from "@/Features/Hooks/BizFunc/Dashboard/SiteMenu/SiteInfo_Api";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { SiteMenu_IndexFields } from "@/types/SchemaFields";

import { type INormSite, normalizeSite } from "./Site-Routing";

export interface SiteRoutingInitialState
{
    lang?: string;
    sites?: INormSite[];
}

let cachedSites: INormSite[] | null = null;

const getApiRes = <T>(x: { env?: ApiResponse<T>; apiRes?: ApiResponse<T>; }): ApiResponse<T> | undefined =>
{
    // return
    return x.apiRes ?? x.env;
};

const unwrapArrayOrEmpty = <T>(apiRes?: ApiResponse<T[]>) =>
{
    // 宣告變數
    const ok = Boolean(apiRes?.IsSuccess) && Array.isArray(apiRes?.Data);

    // return
    return ok ? apiRes!.Data : [];
};

const unwrapOneOrNull = <T>(apiRes?: ApiResponse<T>): T | null =>
{
    // 宣告變數
    const ok = Boolean(apiRes?.IsSuccess) && apiRes?.Data !== null && apiRes?.Data !== undefined;

    // return
    return ok ? apiRes!.Data : null;
};

const readInitialStateFromWindow = (): SiteRoutingInitialState | null =>
{
    // 宣告變數
    const w = typeof window === "undefined" ? null : (window as any);
    const state = w?.__INITIAL_STATE__ as SiteRoutingInitialState | undefined;

    // return
    return state ?? null;
};

const setCache = (sites: INormSite[]): void =>
{
    // 宣告變數
    cachedSites = sites;

    // return
};

const getCache = (): INormSite[] | null =>
{
    // return
    return cachedSites;
};

const getIndexIdsFromRows = (rows: any[]): string[] =>
{
    // 宣告變數：這裡 rows 來自 QueryList（只撈 InternalId），所以取 SiteMenu_Index.InternalId
    const ids = rows
        .map(x => x?.SiteMenu_Index?.InternalId ?? "")
        .filter((x): x is string => Boolean(x));

    // return
    return ids;
};

const fetchSitesByQuery = async (opt: { api?: AxiosInstance; args: LoaderFunctionArgs; }): Promise<INormSite[]> =>
{
    // 宣告變數
    const adapter = SiteMenuAdapter(opt.api);

    // 1) QueryList：只拿 InternalId（透過 base loader）
    const listLoader = adapter.loader.createQueryListLoader({
        getApiInstance: () => opt.api,
        getCondition: () => ({
            Fields: [SiteMenu_IndexFields.InternalId],
            Condition: "",
            PageNumber: 0,
            PageSize: 0,
        }),
    });

    const listRes = await listLoader(opt.args);
    const listApiRes = getApiRes(listRes);
    const listRows = unwrapArrayOrEmpty(listApiRes);
    const ids = getIndexIdsFromRows(listRows as any[]);

    // 2) QueryData：逐筆撈完整 SiteMenuSet，再 normalize
    const tasks = ids.map(async (id) =>
    {
        const dataLoader = adapter.loader.createQueryDataLoader({
            getApiInstance: () => opt.api,
            getInternalId: () => id,
        });

        const dataRes = await dataLoader(opt.args);
        const dataApiRes = getApiRes(dataRes);
        const row = unwrapOneOrNull(dataApiRes);

        // return
        return row ? normalizeSite(row as any) : null;
    });

    const normSites = await Promise.all(tasks);

    // return
    return normSites.filter((x): x is INormSite => Boolean(x));
};

/**
 * ✅ SSR/CSR 共用：取得 sites（只打一次）
 * - 優先：opt.initialState.sites
 * - 次優先：window.__INITIAL_STATE__.sites（CSR）
 * - 再來：cache
 * - 最後：QueryList + QueryData 打 API（SSR 用 request → ssrApi；CSR 用 default api）
 */
export const loadSitesForRouting = async (
    opt?: { request?: Request; initialState?: SiteRoutingInitialState; },
): Promise<INormSite[]> =>
{
    // 宣告變數
    const fromOpt = opt?.initialState?.sites ?? null;
    const fromWindow = readInitialStateFromWindow()?.sites ?? null;
    const fromCache = getCache();

    // 執行 function
    if (fromOpt && fromOpt.length > 0)
    {
        setCache(fromOpt);
        return fromOpt;
    }
    if (fromWindow && fromWindow.length > 0)
    {
        setCache(fromWindow);
        return fromWindow;
    }
    if (fromCache && fromCache.length > 0) return fromCache;

    // SSR: 用 request 建 ssrApi；CSR: api 為 undefined（沿用 default）
    const api = opt?.request ? getSsrApi(opt.request) : undefined;

    // 注意：createQueryListLoader / createQueryDataLoader 需要 LoaderFunctionArgs
    // 這裡在 SSR 端我們會由呼叫端傳入 args；若呼叫端沒提供，就造一個最小的 args（只用到 request）
    const args: LoaderFunctionArgs = { request: opt?.request ?? new Request("http://localhost/") } as any;

    const sites = await fetchSitesByQuery({ api, args });
    setCache(sites);

    // return
    return sites;
};

export const buildSiteRoutingInitialState = (lang: string): SiteRoutingInitialState =>
{
    // 宣告變數
    const sites = getCache() ?? [];

    // return
    return { lang, sites };
};
