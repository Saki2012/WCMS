import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement_Api";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/BannerSlider_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WebManagement/WebResource_Api";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {AnnouncementDetailFields,AnnouncementFields,BannerDetailFields,BannerDetailInfoFields,BannerFields,SpecJournalIndexDetailFields,SpecJournalIndexModelFields,WebResourceFields,WebResourceInfoFields,} from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { Lang } from "@/SysCore/i18n/lang";
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournalIndex_Api";

type QueryListParam = components["schemas"]["QueryListParam"];
type BannerSet = components["schemas"]["BannerSet_DTO"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type PublishStatus = components["schemas"]["PublishStatus"];

type ApiLoaderDataCompat<TArgs, TData> = | { args: TArgs; env: ApiResponse<TData> } | { args: TArgs; apiRes: ApiResponse<TData> };

export const PublishStatusEnum = {
    Unpublished: 0,
    Published: 1,
} as const satisfies Record<string, PublishStatus>;
export type PublishStatusValue = (typeof PublishStatusEnum)[keyof typeof PublishStatusEnum];

const getEnv = <TArgs, TData>(d: ApiLoaderDataCompat<TArgs, TData>): ApiResponse<TData> => {
    // return：兼容舊版 apiRes / 新版 env 命名
    return "env" in d ? d.env : d.apiRes;
};

export interface HomePageRawData {
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

export interface HomePageLoaderArgs {
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

export interface HomePageLoaderRes {
    rawData: HomePageRawData;
}

export interface HomePageLoaderData {
    args: HomePageLoaderArgs;
    res: HomePageLoaderRes;
}

const formatLocalIsoByMinute = (d: Date): string => {
    // 宣告變數
    const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    // return
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:00.000`;
};

const HOME_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheItem = { ts: number; data: HomePageLoaderData; };
const homeLoaderCache = new Map<string, CacheItem>();

const getCacheKey = (lang: Lang, nowIsoLocal: string): string => {
    // 宣告變數
    const day = nowIsoLocal.slice(0, 10);

    // return
    return `${lang}|${day}`;
};

const tryGetCache = (key: string): HomePageLoaderData | null => {
    // 宣告變數
    const hit = homeLoaderCache.get(key);
    if (!hit) return null;

    // 執行 function
    if (Date.now() - hit.ts > HOME_CACHE_TTL_MS) {
        homeLoaderCache.delete(key);
        return null;
    }

    // return
    return hit.data;
};

const setCache = (key: string, data: HomePageLoaderData): void => {
    // 執行 function
    homeLoaderCache.set(key, { ts: Date.now(), data });
};

const takeFirstOrNull = <T>(d: T | T[] | null | undefined): T | null => {
    // return：兼容 queryData / queryList 兩種資料型態
    if (!d) return null;
    return Array.isArray(d) ? d[0] ?? null : d;
};

const takeTopThenFill = <T>(top: T[], rest: T[], limit: number, getKey: (item: T) => string): T[] => {
    // 宣告變數
    const seen = new Set<string>();
    const out: T[] = [];

    // 執行 function
    for (const item of top) {
        const key = getKey(item);
        if (!seen.has(key) && out.length < limit) {
            seen.add(key);
            out.push(item);
        }
    }

    for (const item of rest) {
        if (out.length >= limit) break;
        const key = getKey(item);
        if (!seen.has(key)) {
            seen.add(key);
            out.push(item);
        }
    }

    // return
    return out;
};

const buildBannerByBannerIdParam = (opt: { bannerId: string; lang?: Lang; }): QueryListParam => {
    // 宣告變數
    let condition = "";
    condition = LibMerge(" And ", false, condition, `${BannerFields.BannerId} = ${opt.bannerId}`);

    if (opt.lang) {
        condition = LibMerge(" And ", false, condition, 
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang} = ${opt.lang}`,
        );
    }

    // return
    return {
        Fields: [
            BannerFields.InternalId,BannerFields.BannerId,
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

const buildSpecJournalIndexParam = (publishStatus: PublishStatus): QueryListParam => {
    // 宣告變數
    const condition = `${SpecJournalIndexModelFields.PublishStatus} = ${publishStatus}`;
    // return
    return {
        Fields: [
            SpecJournalIndexModelFields.IndexId,SpecJournalIndexModelFields.IndexName,SpecJournalIndexModelFields.InternalId,SpecJournalIndexModelFields.PublishStatus,
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

const buildNewsCondition = (opt: {lang: Lang; nowIsoLocal: string; categoryId: string; isTop: boolean; }): string => {
    // 宣告變數
    let condition = "";
    // 執行 function
    condition = LibMerge(" And ", false, condition,
        `${AnnouncementFields.Validate_Start} <= ${opt.nowIsoLocal}`,
        `(${AnnouncementFields.Validate_End} >= ${opt.nowIsoLocal} Or ${AnnouncementFields.Validate_End} is null)`,
        `${AnnouncementFields.ContentStatus} !& 4`,
        `${AnnouncementFields.Categories} HasAll ${opt.categoryId}`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${opt.lang}`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`,
    );

    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.ContentStatus} ${opt.isTop ? '&':'!&'} 1`);
    // return
    return condition;
};

const buildNewsParam = (opt: { condition: string; take: number; }): QueryListParam => {
    // return
    return {
        Fields: [
            AnnouncementFields.AnnouncementId,AnnouncementFields.InternalId,AnnouncementFields.Categories,AnnouncementFields.Tags,
            AnnouncementFields.ContentStatus,AnnouncementFields.Validate_Start,AnnouncementFields.Validate_End,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
        ],
        Condition: opt.condition,
        OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }],
        PageNumber: 1,
        PageSize: opt.take,
    };
};

const buildRelatedLinksParam = (opt: { categoryId: string; lang: Lang; }): QueryListParam => {
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

const buildDefaultArgs = (lang: Lang): HomePageLoaderArgs => {
    // 宣告變數
    const nowIsoLocal = formatLocalIsoByMinute(new Date());

    const latestIssueBgBannerId = "Banner20260113002";
    const latestIssueCoverBannerId = "Banner20260113001";
    const latestIssuePublishedParam = buildSpecJournalIndexParam(PublishStatusEnum.Published);
    const latestIssueUnpublishedParam = buildSpecJournalIndexParam(PublishStatusEnum.Unpublished);

    const indexedBannerId = "Banner20260113003";
    const indexedBannerParam = buildBannerByBannerIdParam({ bannerId: indexedBannerId, lang });

    const newsCategoryId = "Category20260113001";
    const newsTake = 5;
    const newsTopParam = buildNewsParam({
        condition: buildNewsCondition({ lang, nowIsoLocal, categoryId: newsCategoryId, isTop: true }),
        take: newsTake,
    });
    const newsListParam = buildNewsParam({
        condition: buildNewsCondition({ lang, nowIsoLocal, categoryId: newsCategoryId, isTop: false }),
        take: newsTake,
    });

    const aboutPublicationBannerId = "Banner20260113004";
    const aboutPublicationParam = buildBannerByBannerIdParam({ bannerId: aboutPublicationBannerId, lang });

    const relatedLinksCategoryId = "Category20260112001";
    const relatedLinksParam = buildRelatedLinksParam({ categoryId: relatedLinksCategoryId, lang });

    // return
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
export const HomePageLoader =
    (p: { lang: Lang; }) => async ({ request }: LoaderFunctionArgs): Promise<HomePageLoaderData> => {
        // 宣告變數
        const ssrApi = getSsrApi(request);
        const args = buildDefaultArgs(p.lang);

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
        const indexedLoader = banner.loader.createQueryListLoader({
            getCondition: () => args.indexedBannerParam,
            getApiInstance: () => ssrApi,
        });
        const newsTopLoader = announcement.loader.createQueryListLoader({
            getCondition: () => args.newsTopParam,
            getApiInstance: () => ssrApi,
        });
        const newsListLoader = announcement.loader.createQueryListLoader({
            getCondition: () => args.newsListParam,
            getApiInstance: () => ssrApi,
        });
        const aboutPublicationLoader = banner.loader.createQueryListLoader({
            getCondition: () => args.aboutPublicationParam,
            getApiInstance: () => ssrApi,
        });
        const relatedLinksLoader = webResource.loader.createQueryListLoader({
            getCondition: () => args.relatedLinksParam,
            getApiInstance: () => ssrApi,
        });

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