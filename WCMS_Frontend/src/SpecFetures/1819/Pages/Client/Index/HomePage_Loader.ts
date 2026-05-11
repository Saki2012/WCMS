import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WEB/WebResource_Api";
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournalIndex_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {
    AnnouncementDetailFields,
    AnnouncementFields,
    BannerDetailFields,
    BannerDetailInfoFields,
    BannerFields,
    SpecJournalIndexDetailFields,
    SpecJournalIndexModelFields,
    WebResourceFields,
    WebResourceInfoFields,
} from "@/types/SchemaFields";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type BannerSet = components["schemas"]["BannerSet_DTO"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

type ApiLoaderDataCompat<TArgs, TData> = { args: TArgs; env: ApiResponse<TData>; } | { args: TArgs; apiRes: ApiResponse<TData>; };

const getEnv = <TArgs, TData>(d: ApiLoaderDataCompat<TArgs, TData>): ApiResponse<TData> =>
{
    // return：兼容舊版 apiRes / 新版 env 命名
    return "env" in d ? d.env : d.apiRes;
};

export interface HomePageRawData
{
    latestIssueBgBanner: BannerSet | null;
    latestIssueCoverBanner: BannerSet | null;
    latestIssuePublishedList: SpecJournalIndexSet[];
    latestIssueUnpublishedList: SpecJournalIndexSet[];
    indexedBanner: BannerSet | null;
    newsTopList: AnnouncementSet[];
    newsList: AnnouncementSet[];
    newsMergedList: AnnouncementSet[];
    aboutPublicationBanner: BannerSet | null;
    relatedLinksList: WebResourceSet[];
}

export interface HomePageLoaderArgs
{
    lang: Lang;
    nowIsoLocal: string;

    latestIssueBgBannerId: string;
    latestIssueCoverBannerId: string;
    latestIssuePublishedParam: QueryListParam;
    latestIssueUnpublishedParam: QueryListParam;

    indexedBannerId: string;
    indexedBannerParam: QueryListParam;

    newsCategoryId: string;
    newsTake: number;
    newsTopParam: QueryListParam;
    newsListParam: QueryListParam;

    aboutPublicationBannerId: string;
    aboutPublicationParam: QueryListParam;

    relatedLinksCategoryId: string;
    relatedLinksParam: QueryListParam;
}

export interface HomePageLoaderRes
{
    rawData: HomePageRawData;
}

export interface HomePageLoaderData
{
    args: HomePageLoaderArgs;
    res: HomePageLoaderRes;
}

const formatLocalIsoByMinute = (d: Date): string =>
{
    // 宣告變數
    const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    // return
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:00.000`;
};

const HOME_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheItem = { ts: number; data: HomePageLoaderData; };
const homeLoaderCache = new Map<string, CacheItem>();

const getCacheKey = (lang: Lang, nowIsoLocal: string): string =>
{
    // 宣告變數
    const day = nowIsoLocal.slice(0, 10);

    // return
    return `${lang}|${day}`;
};

const tryGetCache = (key: string): HomePageLoaderData | null =>
{
    // 宣告變數
    const hit = homeLoaderCache.get(key);
    if (!hit) return null;

    // 執行 function
    if (Date.now() - hit.ts > HOME_CACHE_TTL_MS)
    {
        homeLoaderCache.delete(key);
        return null;
    }

    // return
    return hit.data;
};

const setCache = (key: string, data: HomePageLoaderData): void =>
{
    // 執行 function
    homeLoaderCache.set(key, { ts: Date.now(), data });
};

const takeFirstOrNull = <T>(d: T | T[] | null | undefined): T | null =>
{
    if (!d) return null;
    return Array.isArray(d) ? d[0] ?? null : d;
};

const takeTopThenFill = <T>(top: T[], rest: T[], limit: number, getKey: (item: T) => string): T[] =>
{
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of top)
    {
        const key = getKey(item);
        if (!seen.has(key) && out.length < limit)
        {
            seen.add(key);
            out.push(item);
        }
    }
    for (const item of rest)
    {
        if (out.length >= limit) break;
        const key = getKey(item);
        if (!seen.has(key))
        {
            seen.add(key);
            out.push(item);
        }
    }
    return out;
};
const buildBannerByBannerIdParam = (opt: { bannerId: string; lang?: Lang; }): QueryListParam =>
{
    let condition = "";
    condition = LibMerge(" And ", false, condition, `${BannerFields.BannerId} = ${opt.bannerId}`);

    if (opt.lang)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang} = ${opt.lang}`,
        );
    }

    return {
        Fields: [
            BannerFields.InternalId,
            BannerFields.BannerId,
            `${BannerFields._BannerDetail}.${BannerDetailFields.RowId}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.BannerId}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_Start}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_End}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.ParentRowId}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.RowId}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Content}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL_Open}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`, Desc: true }],
        PageNumber: 1,
        PageSize: 1,
    };
};

const buildSpecJournalIndexParam = (): QueryListParam =>
{
    // 宣告變數
    const condition = "";
    // return
    return {
        Fields: [
            SpecJournalIndexModelFields.IndexId,
            SpecJournalIndexModelFields.IndexName,
            SpecJournalIndexModelFields.InternalId,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.IndexId}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.PublishDate}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.IsSpecial}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.PublishDate}`, Desc: true }],
        PageNumber: 1,
        PageSize: 5,
    };
};

const buildNewsCondition = (opt: { lang: Lang; nowIsoLocal: string; categoryId: string; isTop: boolean; }): string =>
{
    // 宣告變數
    let condition = "";
    // 執行 function
    condition = LibMerge(
        " And ",
        false,
        condition,
        `${AnnouncementFields.Validate_Start} <= ${opt.nowIsoLocal}`,
        `(${AnnouncementFields.Validate_End} >= ${opt.nowIsoLocal} Or ${AnnouncementFields.Validate_End} is null)`,
        `${AnnouncementFields.ContentStatus} !& 4`,
        `${AnnouncementFields.Categories} HasAll ${opt.categoryId}`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${opt.lang}`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`,
    );

    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.ContentStatus} ${opt.isTop ? "&" : "!&"} 1`);
    // return
    return condition;
};

const buildNewsParam = (opt: { condition: string; take: number; }): QueryListParam =>
{
    // return
    return {
        Fields: [
            AnnouncementFields.AnnouncementId,
            AnnouncementFields.InternalId,
            AnnouncementFields.Categories,
            AnnouncementFields.Tags,
            AnnouncementFields.ContentStatus,
            AnnouncementFields.Validate_Start,
            AnnouncementFields.Validate_End,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
        ],
        Condition: opt.condition,
        OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }],
        PageNumber: 1,
        PageSize: opt.take,
    };
};

const buildRelatedLinksParam = (opt: { categoryId: string; lang: Lang; }): QueryListParam =>
{
    // 宣告變數
    let condition = "";
    condition = LibMerge(" And ", false, condition, `${WebResourceFields.Categories} HasAll ${opt.categoryId}`);
    condition = LibMerge(" And ", false, condition, `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang} = ${opt.lang}`);

    // return
    return {
        Fields: [
            WebResourceFields.InternalId,
            WebResourceFields.WebResourceId,
            WebResourceFields.PicId,
            WebResourceFields.PicDescription,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.ResUrl}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Url_OpenType}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: WebResourceFields.ModifyTime, Desc: true }],
        PageNumber: 1,
        PageSize: 8,
    };
};

const buildHomePageArgs = (lang: Lang): HomePageLoaderArgs =>
{
    const nowIsoLocal = formatLocalIsoByMinute(new Date());

    const latestIssueBgBannerId = "Banner20260113002";
    const latestIssueCoverBannerId = "Banner20260113001";
    const latestIssuePublishedParam = buildSpecJournalIndexParam();
    const latestIssueUnpublishedParam = buildSpecJournalIndexParam();

    const indexedBannerId = "Banner20260113003";
    const indexedBannerParam = buildBannerByBannerIdParam({ bannerId: indexedBannerId, lang });

    const newsCategoryId = "Category20260113001";
    const newsTake = 5;
    const newsTopParam = buildNewsParam({ condition: buildNewsCondition({ lang, nowIsoLocal, categoryId: newsCategoryId, isTop: true }), take: newsTake });
    const newsListParam = buildNewsParam({ condition: buildNewsCondition({ lang, nowIsoLocal, categoryId: newsCategoryId, isTop: false }), take: newsTake });

    const aboutPublicationBannerId = "Banner20260113004";
    const aboutPublicationParam = buildBannerByBannerIdParam({ bannerId: aboutPublicationBannerId, lang });

    const relatedLinksCategoryId = "Category20260112001";
    const relatedLinksParam = buildRelatedLinksParam({ categoryId: relatedLinksCategoryId, lang });

    return {
        lang,
        nowIsoLocal,
        latestIssueBgBannerId,
        latestIssueCoverBannerId,
        latestIssuePublishedParam,
        latestIssueUnpublishedParam,
        indexedBannerId,
        indexedBannerParam,
        newsCategoryId,
        newsTake,
        newsTopParam,
        newsListParam,
        aboutPublicationBannerId,
        aboutPublicationParam,
        relatedLinksCategoryId,
        relatedLinksParam,
    };
};
/**
 * ✅ 1819 首頁 loader
 * - 對標 1816：SSR 一次撈首頁首屏資料
 * - 先以目前 1819 Index 的 5 個 section 需求為主
 * - 後續各 section 改 hook 時，可直接吃 args + rawData
 */
export const HomePageLoader = (p: { lang: Lang; }) => async ({ request }: LoaderFunctionArgs): Promise<HomePageLoaderData> =>
{
    // 宣告變數
    const ssrApi = getSsrApi(request);
    const args = buildHomePageArgs(p.lang);

    const cacheKey = getCacheKey(args.lang, args.nowIsoLocal);
    const cached = tryGetCache(cacheKey);
    if (cached) return cached;

    const banner = BannerSliderAdapter(ssrApi);
    const journalIndex = SpecJournalIndexAdapter(ssrApi);
    const announcement = AnnouncementAdapter(ssrApi);
    const webResource = WebResourceAdapter(ssrApi);

    // 執行 function：建立 loaders
    const latestIssueBgLoader = banner.loader.createQueryListLoader({
        getCondition: () => buildBannerByBannerIdParam({ bannerId: args.latestIssueBgBannerId }),
        getApiInstance: () => ssrApi,
    });
    const latestIssueCoverLoader = banner.loader.createQueryListLoader({
        getCondition: () => buildBannerByBannerIdParam({ bannerId: args.latestIssueCoverBannerId }),
        getApiInstance: () => ssrApi,
    });
    const latestIssuePublishedLoader = journalIndex.loader.createQueryListLoader({
        getCondition: () => args.latestIssuePublishedParam,
        getApiInstance: () => ssrApi,
    });
    const latestIssueUnpublishedLoader = journalIndex.loader.createQueryListLoader({
        getCondition: () => args.latestIssueUnpublishedParam,
        getApiInstance: () => ssrApi,
    });
    const indexedLoader = banner.loader.createQueryListLoader({ getCondition: () => args.indexedBannerParam, getApiInstance: () => ssrApi });
    const newsTopLoader = announcement.loader.createQueryListLoader({ getCondition: () => args.newsTopParam, getApiInstance: () => ssrApi });
    const newsListLoader = announcement.loader.createQueryListLoader({ getCondition: () => args.newsListParam, getApiInstance: () => ssrApi });
    const aboutPublicationLoader = banner.loader.createQueryListLoader({ getCondition: () => args.aboutPublicationParam, getApiInstance: () => ssrApi });
    const relatedLinksLoader = webResource.loader.createQueryListLoader({ getCondition: () => args.relatedLinksParam, getApiInstance: () => ssrApi });

    // 執行 function：一次撈完
    const [
        latestIssueBgLD,
        latestIssueCoverLD,
        latestIssuePublishedLD,
        latestIssueUnpublishedLD,
        indexedLD,
        newsTopLD,
        newsListLD,
        aboutPublicationLD,
        relatedLinksLD,
    ] = await Promise.all([
        latestIssueBgLoader({ request } as LoaderFunctionArgs),
        latestIssueCoverLoader({ request } as LoaderFunctionArgs),
        latestIssuePublishedLoader({ request } as LoaderFunctionArgs),
        latestIssueUnpublishedLoader({ request } as LoaderFunctionArgs),
        indexedLoader({ request } as LoaderFunctionArgs),
        newsTopLoader({ request } as LoaderFunctionArgs),
        newsListLoader({ request } as LoaderFunctionArgs),
        aboutPublicationLoader({ request } as LoaderFunctionArgs),
        relatedLinksLoader({ request } as LoaderFunctionArgs),
    ]);

    // 宣告變數：整理回傳資料
    const latestIssueBgBanner = takeFirstOrNull<BannerSet>(getEnv(latestIssueBgLD).Data);
    const latestIssueCoverBanner = takeFirstOrNull<BannerSet>(getEnv(latestIssueCoverLD).Data);
    const latestIssuePublishedList = getEnv(latestIssuePublishedLD).Data ?? [];
    const latestIssueUnpublishedList = getEnv(latestIssueUnpublishedLD).Data ?? [];
    const indexedBanner = takeFirstOrNull<BannerSet>(getEnv(indexedLD).Data);
    const newsTopList = getEnv(newsTopLD).Data ?? [];
    const newsList = getEnv(newsListLD).Data ?? [];
    const newsMergedList = takeTopThenFill(
        newsTopList,
        newsList,
        args.newsTake,
        (item) => item.Announcement?.InternalId ?? String(item.Announcement?.AnnouncementId ?? ""),
    );
    const aboutPublicationBanner = takeFirstOrNull<BannerSet>(getEnv(aboutPublicationLD).Data);
    const relatedLinksList = getEnv(relatedLinksLD).Data ?? [];

    const result: HomePageLoaderData = {
        args,
        res: {
            rawData: {
                latestIssueBgBanner,
                latestIssueCoverBanner,
                latestIssuePublishedList,
                latestIssueUnpublishedList,
                indexedBanner,
                newsTopList,
                newsList,
                newsMergedList,
                aboutPublicationBanner,
                relatedLinksList,
            },
        },
    };

    // 執行 function
    setCache(cacheKey, result);

    // return
    return result;
};

// 以下Hooks

interface UseHomePageDataProps
{
    lang: Lang;
    loaderData?: HomePageLoaderData | null;
}

interface UseHomePageDataResult
{
    args: HomePageLoaderArgs;
    rawData: HomePageRawData | null;
    isLoading: boolean;
    errorText: string | null;
}

/** 建立 hook initial 成功回應 */
const toOkEnv = <T>(data: T): ApiResponse<T> =>
{
    return { IsSuccess: true, Data: data, SysMessage: [] };
};

/** 建立 QueryList initial */
const toListInitial = <T>(args: QueryListParam, data: T[]): ApiLoaderData<QueryListParam, T[]> =>
{
    return { args, apiRes: toOkEnv(data) };
};

/** 只有 loader 真有回資料時才給 initial，避免空陣列阻止 CSR 補資料 */
const toInitialByLoader = <T>(hasLoaderRaw: boolean, args: QueryListParam, data: T[]): ApiLoaderData<QueryListParam, T[]> | null =>
{
    if (!hasLoaderRaw) return null;
    return toListInitial(args, data);
};

/** 單筆 banner 轉 QueryList initial */
const toBannerList = (data?: BannerSet | null): BannerSet[] =>
{
    return data ? [data] : [];
};

/** 合併錯誤訊息 */
const joinErrorText = (errors: Array<string | null>): string | null =>
{
    const list = errors.filter((x): x is string => Boolean(x));
    return list.length > 0 ? list.join("；") : null;
};

/** 1819 首頁 CSR/SSR 共用資料 hook */
export const useHomePageData = (props: UseHomePageDataProps): UseHomePageDataResult =>
{
    const hasLoaderRaw = Boolean(props.loaderData?.res?.rawData);
    const rawInitial = props.loaderData?.res?.rawData ?? null;

    const args = useMemo(() =>
    {
        return props.loaderData?.args ?? buildHomePageArgs(props.lang);
    }, [props.loaderData?.args, props.lang]);

    const bannerAdapter = useMemo(() => BannerSliderAdapter(), []);
    const journalIndexAdapter = useMemo(() => SpecJournalIndexAdapter(), []);
    const announcementAdapter = useMemo(() => AnnouncementAdapter(), []);
    const webResourceAdapter = useMemo(() => WebResourceAdapter(), []);

    const latestIssueBgParam = useMemo(() =>
    {
        return buildBannerByBannerIdParam({ bannerId: args.latestIssueBgBannerId });
    }, [args.latestIssueBgBannerId]);

    const latestIssueCoverParam = useMemo(() =>
    {
        return buildBannerByBannerIdParam({ bannerId: args.latestIssueCoverBannerId });
    }, [args.latestIssueCoverBannerId]);

    const latestIssueBgInitial = useMemo(() =>
    {
        return toInitialByLoader(hasLoaderRaw, latestIssueBgParam, toBannerList(rawInitial?.latestIssueBgBanner));
    }, [hasLoaderRaw, latestIssueBgParam, rawInitial?.latestIssueBgBanner]);

    const latestIssueCoverInitial = useMemo(() =>
    {
        return toInitialByLoader(hasLoaderRaw, latestIssueCoverParam, toBannerList(rawInitial?.latestIssueCoverBanner));
    }, [hasLoaderRaw, latestIssueCoverParam, rawInitial?.latestIssueCoverBanner]);

    const latestIssuePublishedInitial = useMemo(() =>
    {
        return toInitialByLoader(hasLoaderRaw, args.latestIssuePublishedParam, rawInitial?.latestIssuePublishedList ?? []);
    }, [hasLoaderRaw, args.latestIssuePublishedParam, rawInitial?.latestIssuePublishedList]);

    const latestIssueUnpublishedInitial = useMemo(() =>
    {
        return toInitialByLoader(hasLoaderRaw, args.latestIssueUnpublishedParam, rawInitial?.latestIssueUnpublishedList ?? []);
    }, [hasLoaderRaw, args.latestIssueUnpublishedParam, rawInitial?.latestIssueUnpublishedList]);

    const indexedInitial = useMemo(() =>
    {
        return toInitialByLoader(hasLoaderRaw, args.indexedBannerParam, toBannerList(rawInitial?.indexedBanner));
    }, [hasLoaderRaw, args.indexedBannerParam, rawInitial?.indexedBanner]);

    const newsTopInitial = useMemo(() =>
    {
        return toInitialByLoader(hasLoaderRaw, args.newsTopParam, rawInitial?.newsTopList ?? []);
    }, [hasLoaderRaw, args.newsTopParam, rawInitial?.newsTopList]);

    const newsListInitial = useMemo(() =>
    {
        return toInitialByLoader(hasLoaderRaw, args.newsListParam, rawInitial?.newsList ?? []);
    }, [hasLoaderRaw, args.newsListParam, rawInitial?.newsList]);

    const aboutPublicationInitial = useMemo(() =>
    {
        return toInitialByLoader(hasLoaderRaw, args.aboutPublicationParam, toBannerList(rawInitial?.aboutPublicationBanner));
    }, [hasLoaderRaw, args.aboutPublicationParam, rawInitial?.aboutPublicationBanner]);

    const relatedLinksInitial = useMemo(() =>
    {
        return toInitialByLoader(hasLoaderRaw, args.relatedLinksParam, rawInitial?.relatedLinksList ?? []);
    }, [hasLoaderRaw, args.relatedLinksParam, rawInitial?.relatedLinksList]);

    const latestIssueBgQuery = bannerAdapter.hooks.useQueryList({
        condition: latestIssueBgParam,
        initial: latestIssueBgInitial,
        deps: [latestIssueBgParam.Condition ?? ""],
    });

    const latestIssueCoverQuery = bannerAdapter.hooks.useQueryList({
        condition: latestIssueCoverParam,
        initial: latestIssueCoverInitial,
        deps: [latestIssueCoverParam.Condition ?? ""],
    });

    const latestIssuePublishedQuery = journalIndexAdapter.hooks.useQueryList({
        condition: args.latestIssuePublishedParam,
        initial: latestIssuePublishedInitial,
        deps: [args.latestIssuePublishedParam.Condition ?? ""],
    });

    const latestIssueUnpublishedQuery = journalIndexAdapter.hooks.useQueryList({
        condition: args.latestIssueUnpublishedParam,
        initial: latestIssueUnpublishedInitial,
        deps: [args.latestIssueUnpublishedParam.Condition ?? ""],
    });

    const indexedQuery = bannerAdapter.hooks.useQueryList({
        condition: args.indexedBannerParam,
        initial: indexedInitial,
        deps: [args.indexedBannerParam.Condition ?? "", props.lang],
    });

    const newsTopQuery = announcementAdapter.hooks.useQueryList({
        condition: args.newsTopParam,
        initial: newsTopInitial,
        deps: [args.newsTopParam.Condition ?? "", props.lang],
    });

    const newsListQuery = announcementAdapter.hooks.useQueryList({
        condition: args.newsListParam,
        initial: newsListInitial,
        deps: [args.newsListParam.Condition ?? "", props.lang],
    });

    const aboutPublicationQuery = bannerAdapter.hooks.useQueryList({
        condition: args.aboutPublicationParam,
        initial: aboutPublicationInitial,
        deps: [args.aboutPublicationParam.Condition ?? "", props.lang],
    });

    const relatedLinksQuery = webResourceAdapter.hooks.useQueryList({
        condition: args.relatedLinksParam,
        initial: relatedLinksInitial,
        deps: [args.relatedLinksParam.Condition ?? "", props.lang],
    });

    const hasAnyResponse = useMemo(() =>
    {
        return hasLoaderRaw
            || Boolean(latestIssueBgQuery.apiRes)
            || Boolean(latestIssueCoverQuery.apiRes)
            || Boolean(latestIssuePublishedQuery.apiRes)
            || Boolean(latestIssueUnpublishedQuery.apiRes)
            || Boolean(indexedQuery.apiRes)
            || Boolean(newsTopQuery.apiRes)
            || Boolean(newsListQuery.apiRes)
            || Boolean(aboutPublicationQuery.apiRes)
            || Boolean(relatedLinksQuery.apiRes);
    }, [
        hasLoaderRaw,
        latestIssueBgQuery.apiRes,
        latestIssueCoverQuery.apiRes,
        latestIssuePublishedQuery.apiRes,
        latestIssueUnpublishedQuery.apiRes,
        indexedQuery.apiRes,
        newsTopQuery.apiRes,
        newsListQuery.apiRes,
        aboutPublicationQuery.apiRes,
        relatedLinksQuery.apiRes,
    ]);

    const rawData = useMemo<HomePageRawData | null>(() =>
    {
        if (!hasAnyResponse) return null;

        const newsTopList = newsTopQuery.data ?? [];
        const newsList = newsListQuery.data ?? [];

        return {
            latestIssueBgBanner: takeFirstOrNull<BannerSet>(latestIssueBgQuery.data),
            latestIssueCoverBanner: takeFirstOrNull<BannerSet>(latestIssueCoverQuery.data),
            latestIssuePublishedList: latestIssuePublishedQuery.data ?? [],
            latestIssueUnpublishedList: latestIssueUnpublishedQuery.data ?? [],
            indexedBanner: takeFirstOrNull<BannerSet>(indexedQuery.data),
            newsTopList,
            newsList,
            newsMergedList: takeTopThenFill(newsTopList, newsList, args.newsTake, item =>
            {
                return item.Announcement?.InternalId ?? String(item.Announcement?.AnnouncementId ?? "");
            }),
            aboutPublicationBanner: takeFirstOrNull<BannerSet>(aboutPublicationQuery.data),
            relatedLinksList: relatedLinksQuery.data ?? [],
        };
    }, [
        hasAnyResponse,
        latestIssueBgQuery.data,
        latestIssueCoverQuery.data,
        latestIssuePublishedQuery.data,
        latestIssueUnpublishedQuery.data,
        indexedQuery.data,
        newsTopQuery.data,
        newsListQuery.data,
        aboutPublicationQuery.data,
        relatedLinksQuery.data,
        args.newsTake,
    ]);

    const isLoading = latestIssueBgQuery.isLoading
        || latestIssueCoverQuery.isLoading
        || latestIssuePublishedQuery.isLoading
        || latestIssueUnpublishedQuery.isLoading
        || indexedQuery.isLoading
        || newsTopQuery.isLoading
        || newsListQuery.isLoading
        || aboutPublicationQuery.isLoading
        || relatedLinksQuery.isLoading;

    const errorText = useMemo(() =>
    {
        return joinErrorText([
            latestIssueBgQuery.errorText,
            latestIssueCoverQuery.errorText,
            latestIssuePublishedQuery.errorText,
            latestIssueUnpublishedQuery.errorText,
            indexedQuery.errorText,
            newsTopQuery.errorText,
            newsListQuery.errorText,
            aboutPublicationQuery.errorText,
            relatedLinksQuery.errorText,
        ]);
    }, [
        latestIssueBgQuery.errorText,
        latestIssueCoverQuery.errorText,
        latestIssuePublishedQuery.errorText,
        latestIssueUnpublishedQuery.errorText,
        indexedQuery.errorText,
        newsTopQuery.errorText,
        newsListQuery.errorText,
        aboutPublicationQuery.errorText,
        relatedLinksQuery.errorText,
    ]);

    return { args, rawData, isLoading, errorText };
};
