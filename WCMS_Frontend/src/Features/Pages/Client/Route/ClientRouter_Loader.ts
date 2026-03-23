import { useCallback, useEffect, useState } from "react";
import type { AxiosInstance } from "axios";
import type { LoaderFunctionArgs } from "react-router-dom";

import { SiteMenuAdapter } from "@/Features/Hooks/BizFunc/SystemSetting/SiteMenu_Api";
import { SiteViewCountAdapter } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Api";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { SiteMenu_IndexFields, SiteViewCountHeaderModelFields } from "@/types/SchemaFields";
import type { INormSite } from "./Site-Routing";
import { normalizeSite } from "./Site-Routing";
import type { components } from "@/types/api";
type QueryListParam = components["schemas"]["QueryListParam"];
export interface SiteFooterRuntimeInfo
{
    /** 網站瀏覽人數 */
    viewCount: number | null;
    /** 網站更新日期 */
    siteUpdatedAt?: string | null;
    /** 前端版本 */
    feVersion?: string | null;
    /** 後端版本 */
    beVersion?: string | null;
}
export interface SiteRoutingInitialState
{
    lang?: string;
    sites?: INormSite[];
    footerRuntimeBySiteIndex?: Record<string, SiteFooterRuntimeInfo>;
}
export interface UseSiteFooterRuntimeResult
{
    runtimeInfo: SiteFooterRuntimeInfo;
    isLoading: boolean;
    errorText: string;
    refresh: () => Promise<void>;
}

let cachedSites: INormSite[] | null = null;
let cachedFooterRuntimeBySiteIndex: Record<string, SiteFooterRuntimeInfo> | null = null;

const getApiRes = <T>(x: { env?: ApiResponse<T>; apiRes?: ApiResponse<T>; }): ApiResponse<T> | undefined =>
{
    return x.apiRes ?? x.env;
};

const unwrapArrayOrEmpty = <T>(apiRes?: ApiResponse<T[]>) =>
{
    const ok = Boolean(apiRes?.IsSuccess) && Array.isArray(apiRes?.Data);
    return ok ? apiRes!.Data : [];
};

const unwrapOneOrNull = <T>(apiRes?: ApiResponse<T>): T | null =>
{
    const ok = Boolean(apiRes?.IsSuccess) && apiRes?.Data !== null && apiRes?.Data !== undefined;
    return ok ? apiRes!.Data : null;
};

const readInitialStateFromWindow = (): SiteRoutingInitialState | null =>
{
    const w = typeof window === "undefined" ? null : (window as any);
    const state = w?.__INITIAL_STATE__ as SiteRoutingInitialState | undefined;
    return state ?? null;
};

const setCache = (sites: INormSite[]): void =>
{
    cachedSites = sites;
};

const getCache = (): INormSite[] | null =>
{
    return cachedSites;
};

const setFooterRuntimeCache = (map: Record<string, SiteFooterRuntimeInfo>): void =>
{
    cachedFooterRuntimeBySiteIndex = map;
};

const getFooterRuntimeCache = (): Record<string, SiteFooterRuntimeInfo> =>
{
    return cachedFooterRuntimeBySiteIndex ?? {};
};

const mergeFooterRuntimeCache = (siteIndex: string, runtimeInfo: SiteFooterRuntimeInfo): SiteFooterRuntimeInfo =>
{
    const next = {
        ...getFooterRuntimeCache(),
        [siteIndex]: runtimeInfo,
    };

    setFooterRuntimeCache(next);
    return runtimeInfo;
};

const getFooterRuntimeFromInitial = (opt?: {
    initialState?: SiteRoutingInitialState;
    siteIndex?: string;
}): SiteFooterRuntimeInfo | null =>
{
    const siteIndex = `${opt?.siteIndex ?? ""}`.trim();
    const fromOpt = opt?.initialState?.footerRuntimeBySiteIndex?.[siteIndex] ?? null;
    const fromWindow = readInitialStateFromWindow()?.footerRuntimeBySiteIndex?.[siteIndex] ?? null;
    const fromCache = getFooterRuntimeCache()?.[siteIndex] ?? null;

    return fromOpt ?? fromWindow ?? fromCache ?? null;
};

const getIndexIdsFromRows = (rows: any[]): string[] =>
{
    const ids = rows
        .map(x => x?.SiteMenu_Index?.InternalId ?? "")
        .filter((x): x is string => Boolean(x));

    return ids;
};

const fetchSitesByQuery = async (opt: {
    api?: AxiosInstance;
    args: LoaderFunctionArgs;
}): Promise<INormSite[]> =>
{
    const adapter = SiteMenuAdapter(opt.api);

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

    const tasks = ids.map(async (id) =>
    {
        const dataLoader = adapter.loader.createQueryDataLoader({
            getApiInstance: () => opt.api,
            getInternalId: () => id,
        });

        const dataRes = await dataLoader(opt.args);
        const dataApiRes = getApiRes(dataRes);
        const row = unwrapOneOrNull(dataApiRes);

        return row ? normalizeSite(row as any) : null;
    });

    const normSites = await Promise.all(tasks);

    return normSites.filter((x): x is INormSite => Boolean(x));
};
const escapeQueryValue = (value: string): string =>
{
    // return
    return value.replace(/"/g, `""`);
};

const buildQuotedValue = (value: string): string =>
{
    // 宣告變數
    const text = `${value ?? ""}`.trim();

    // return
    return text ? `"${escapeQueryValue(text)}"` : "";
};
const buildFooterViewCountCondition = (siteIndex: string): string =>
{
    // 宣告變數
    const siteKey = buildQuotedValue(siteIndex);
    if (!siteKey) return "1=0";

    // return
    return `${SiteViewCountHeaderModelFields.SiteIndex} = ${siteKey}`;
};

const buildFooterViewCountQuery = (siteIndex: string): QueryListParam =>
{
    // return
    return {
        Fields: [SiteViewCountHeaderModelFields.SiteIndex,SiteViewCountHeaderModelFields.PublicViewCount,],
        Condition: buildFooterViewCountCondition(siteIndex),
        PageNumber: 0,
        PageSize: 0,
    };
};

/** 這裡先統一保留 Footer runtime 抓取入口 */
const fetchSiteFooterRuntime = async (opt: {
    api?: AxiosInstance;
    args: LoaderFunctionArgs;
    siteIndex: string;
}): Promise<SiteFooterRuntimeInfo> =>
{
    const siteIndex = `${opt.siteIndex ?? ""}`.trim();

    const siteView = SiteViewCountAdapter(opt.api);

    const viewCountLoader = siteView.loader.createQueryListLoader({
        getApiInstance: () => opt.api,
        getCondition: () => buildFooterViewCountQuery(siteIndex),
    });
    const viewCountLD = await viewCountLoader(opt.args);
    const viewCountApiRes = getApiRes(viewCountLD);
    const viewCountRows = unwrapArrayOrEmpty(viewCountApiRes);
    const viewCount = viewCountRows?.[0]?.SiteViewCountHeader?.PublicViewCount ?? 0;
    return { viewCount: viewCount, siteUpdatedAt: null, feVersion: null, beVersion: null,};
};

export const loadSiteFooterRuntime = async (opt: {
    request?: Request;
    siteIndex: string;
    initialState?: SiteRoutingInitialState;
}): Promise<SiteFooterRuntimeInfo> =>
{
    const siteIndex = `${opt.siteIndex ?? ""}`.trim();
    const initial = getFooterRuntimeFromInitial({
        initialState: opt.initialState,
        siteIndex,
    });

    if (initial) return initial;

    const api = opt?.request ? getSsrApi(opt.request) : undefined;
    const args: LoaderFunctionArgs = {
        request: opt?.request ?? new Request("http://localhost/"),
    } as any;

    const runtimeInfo = await fetchSiteFooterRuntime({api, args, siteIndex,});

    return mergeFooterRuntimeCache(siteIndex, runtimeInfo);
};

const warmFooterRuntimeCache = async (opt: {
    request?: Request;
    initialState?: SiteRoutingInitialState;
    sites: INormSite[];
}): Promise<void> =>
{
    const tasks = opt.sites.map((site) =>
    {
        return loadSiteFooterRuntime({
            request: opt.request,
            initialState: opt.initialState,
            siteIndex: site.siteIndex,
        });
    });

    await Promise.all(tasks);
};

/**
 * ✅ SSR/CSR 共用：取得 sites（只打一次）
 * 並順手預熱 footer runtime cache
 */
export const loadSitesForRouting = async (
    opt?: { request?: Request; initialState?: SiteRoutingInitialState; },
): Promise<INormSite[]> =>
{
    const fromOpt = opt?.initialState?.sites ?? null;
    const fromWindow = readInitialStateFromWindow()?.sites ?? null;
    const fromCache = getCache();

    if (fromOpt && fromOpt.length > 0)
    {
        setCache(fromOpt);
        await warmFooterRuntimeCache({
            request: opt?.request,
            initialState: opt?.initialState,
            sites: fromOpt,
        });
        return fromOpt;
    }

    if (fromWindow && fromWindow.length > 0)
    {
        setCache(fromWindow);
        await warmFooterRuntimeCache({
            request: opt?.request,
            initialState: opt?.initialState,
            sites: fromWindow,
        });
        return fromWindow;
    }

    if (fromCache && fromCache.length > 0)
    {
        await warmFooterRuntimeCache({
            request: opt?.request,
            initialState: opt?.initialState,
            sites: fromCache,
        });
        return fromCache;
    }

    const api = opt?.request ? getSsrApi(opt.request) : undefined;
    const args: LoaderFunctionArgs = {
        request: opt?.request ?? new Request("http://localhost/"),
    } as any;

    const sites = await fetchSitesByQuery({ api, args });
    setCache(sites);

    await warmFooterRuntimeCache({
        request: opt?.request,
        initialState: opt?.initialState,
        sites,
    });

    return sites;
};

export const useSiteFooterRuntime = (siteIndex: string): UseSiteFooterRuntimeResult =>
{
    const initial = getFooterRuntimeFromInitial({ siteIndex });

    const [runtimeInfo, setRuntimeInfo] = useState<SiteFooterRuntimeInfo>(() =>
    {
        return initial ?? {
            viewCount: 0,
            siteUpdatedAt: null,
            feVersion: null,
            beVersion: null,
        };
    });

    const [isLoading, setIsLoading] = useState<boolean>(!initial);
    const [errorText, setErrorText] = useState<string>("");

    const refresh = useCallback(async () =>
    {
        try
        {
            setIsLoading(true);
            setErrorText("");

            const next = await loadSiteFooterRuntime({ siteIndex });
            setRuntimeInfo(next);
        }
        catch (error)
        {
            const text = error instanceof Error ? error.message : "Load footer runtime failed.";
            setErrorText(text);
        }
        finally
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

    return {
        runtimeInfo,
        isLoading,
        errorText,
        refresh,
    };
};

export const buildSiteRoutingInitialState = (lang: string): SiteRoutingInitialState =>
{
    const sites = getCache() ?? [];
    const footerRuntimeBySiteIndex = getFooterRuntimeCache();

    return {
        lang,
        sites,
        footerRuntimeBySiteIndex,
    };
};