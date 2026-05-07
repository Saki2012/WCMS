import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WEB/WebResource_Api";
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
    CategoryDetailFields,
    CategoryFields,
    GalleryFields,
    GalleryInfoFields,
    PGID,
    TagDataFields,
    TagDetailFields,
    WebResourceFields,
    WebResourceInfoFields,
} from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import { type LoaderFunctionArgs, redirect } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type BannerSet = components["schemas"]["BannerSet_DTO"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];
type GallerySet = components["schemas"]["GallerySet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

const BANNER_SLIDER_FIELDS: string[] = [
    BannerFields.InternalId,
    BannerFields.BannerId,
    BannerFields.BannerCategoryName,
    `${BannerFields._BannerDetail}.${BannerDetailFields.BannerId}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields.RowId}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields.FontColor}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_Start}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_End}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.BannerId}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.ParentRowId}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.RowId}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Content}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL}`,
    `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL_Open}`,
];

const CATEGORY_TABS_NEWS_FIELDS: string[] = [
    AnnouncementFields.AnnouncementId,
    AnnouncementFields.InternalId,
    AnnouncementFields.Categories,
    AnnouncementFields.Tags,
    AnnouncementFields.ContentStatus,
    AnnouncementFields.Validate_Start,
    `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
    `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
];

const EVENT_FIELDS: string[] = [
    AnnouncementFields.AnnouncementId,
    AnnouncementFields.InternalId,
    AnnouncementFields.Tags,
    AnnouncementFields.Validate_Start,
    AnnouncementFields.PictureId,
    AnnouncementFields.PicDescription,
    AnnouncementFields.ContentStatus,
    `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
    `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
];

const CATEGORY_FIELDS: string[] = [
    CategoryFields.CategoryId,
    `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
    `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
];

const TAG_FIELDS: string[] = [
    TagDataFields.TagId,
    `${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
    `${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
];

const GALLERY_FIELDS: string[] = [
    GalleryFields.GalleryId,
    GalleryFields.InternalId,
    GalleryFields.Categories,
    GalleryFields.CoverPicSrcId,
    GalleryFields.CreateTime,
    GalleryFields.Validate_Start,
    `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
    `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
];

const VIDEO_FIELDS: string[] = [
    WebResourceFields.InternalId,
    WebResourceFields.WebResourceId,
    WebResourceFields.Categories,
    `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
    `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
    `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.ResUrl}`,
    `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Url_OpenType}`,
];

const shouldRedirectEnHome = (request: Request, lang: Lang): boolean =>
{
    // 宣告變數
    const pathname = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    // 執行 function
    if (lang !== "en") return false;

    // return
    return pathname === "/en";
};
export interface HomePageRawData
{
    bannerSliderBanner: BannerSet | null;

    categoryTabsTopAllNews: AnnouncementSet[];
    categoryTabsTopProjectNews: AnnouncementSet[];
    categoryTabsTopLegalNews: AnnouncementSet[];
    categoryTabsTopEventNews: AnnouncementSet[];
    categoryTabsTopAwardNews: AnnouncementSet[];
    categoryTabsTopMediaNews: AnnouncementSet[];

    categoryTabsAllNews: AnnouncementSet[];
    categoryTabsProjectNews: AnnouncementSet[];
    categoryTabsLegalNews: AnnouncementSet[];
    categoryTabsEventNews: AnnouncementSet[];
    categoryTabsAwardNews: AnnouncementSet[];
    categoryTabsMediaNews: AnnouncementSet[];

    categoryTabsCategories: CategoryDataSet[];
    categoryTabsTags: TagSet[];

    eventAnnouncements: AnnouncementSet[];
    eventTags: TagSet[];

    galleryList: GallerySet[];
    galleryCategories: CategoryDataSet[];

    videoList: WebResourceSet[];
}

export interface HomePageLoaderArgs
{
    lang: Lang;
    nowIsoLocal: string;

    bannerSliderParam: QueryListParam;

    categoryTabsTopAllNewsParam: QueryListParam;
    categoryTabsTopProjectNewsParam: QueryListParam;
    categoryTabsTopLegalNewsParam: QueryListParam;
    categoryTabsTopEventNewsParam: QueryListParam;
    categoryTabsTopAwardNewsParam: QueryListParam;
    categoryTabsTopMediaNewsParam: QueryListParam;

    categoryTabsAllNewsParam: QueryListParam;
    categoryTabsProjectNewsParam: QueryListParam;
    categoryTabsLegalNewsParam: QueryListParam;
    categoryTabsEventNewsParam: QueryListParam;
    categoryTabsAwardNewsParam: QueryListParam;
    categoryTabsMediaNewsParam: QueryListParam;

    categoryTabsCategoryParam: QueryListParam;
    categoryTabsTagParam: QueryListParam;

    eventListParam: QueryListParam;
    eventTagParam: QueryListParam;

    galleryListParam: QueryListParam;
    galleryCategoryParam: QueryListParam;

    videoListParam: QueryListParam;
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

export interface HomePageCategoryTabsHookResult
{
    topAllNewsData: AnnouncementSet[];
    topProjectData: AnnouncementSet[];
    topLegalData: AnnouncementSet[];
    topEventData: AnnouncementSet[];
    topAwardData: AnnouncementSet[];
    topMediaData: AnnouncementSet[];

    allNewsData: AnnouncementSet[];
    projectData: AnnouncementSet[];
    legalData: AnnouncementSet[];
    eventData: AnnouncementSet[];
    awardData: AnnouncementSet[];
    mediaData: AnnouncementSet[];

    allNewsRawData: AnnouncementSet[];
    projectRawData: AnnouncementSet[];
    legalRawData: AnnouncementSet[];
    eventRawData: AnnouncementSet[];
    awardRawData: AnnouncementSet[];
    mediaRawData: AnnouncementSet[];

    categoryData: CategoryDataSet[];
    tagData: TagSet[];
    categoryDict: Record<string, string>;
    tagDict: Record<string, string>;
    loadingList: boolean[];
    errorList: Array<string | null>;
}

export interface HomePageEventHookResult
{
    announcementData: AnnouncementSet[];
    tagData: TagSet[];
    tagDict: Record<string, string>;
    loadingList: boolean[];
    errorList: Array<string | null>;
}

export interface HomePageGalleryHookResult
{
    galleryData: GallerySet[];
    categoryData: CategoryDataSet[];
    categoryDict: Record<string, string>;
    loadingList: boolean[];
    errorList: Array<string | null>;
}

export interface HomePageVideoHookResult
{
    webResourceData: WebResourceSet[];
    loadingList: boolean[];
    errorList: Array<string | null>;
}

const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

const formatLocalIso = (date: Date): string =>
{
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    const ms = `${date.getMilliseconds()}`.padStart(3, "0");

    return `${y}-${m}-${d}T${h}:${mm}:${s}.${ms}`;
};

const toOkEnv = <T>(data: T): ApiResponse<T> => ({ IsSuccess: true, Data: data, SysMessage: [] });

const toListInitial = <TItem>(args: QueryListParam, data: TItem[]): ApiLoaderData<QueryListParam, TItem[]> => ({ args, apiRes: toOkEnv(data) });

const takeFirstOrNull = <T>(data: T[] | T | null | undefined): T | null =>
{
    if (!data) return null;

    return Array.isArray(data) ? data[0] ?? null : data;
};

const takeTopThenFill = <T>(top: T[] | undefined, rest: T[] | undefined, limit: number, getKey: (item: T) => string): T[] =>
{
    const seen = new Set<string>();
    const result: T[] = [];

    for (const item of top ?? [])
    {
        const key = getKey(item);
        if (!seen.has(key) && result.length < limit)
        {
            seen.add(key);
            result.push(item);
        }
    }

    for (const item of rest ?? [])
    {
        const key = getKey(item);
        if (seen.has(key) || result.length >= limit) continue;
        seen.add(key);
        result.push(item);
    }

    return result;
};

const buildCategoryDict = (list: CategoryDataSet[], lang: Lang): Record<string, string> =>
{
    const pairs = list.map((item) =>
    {
        const id = item.Category?.CategoryId ?? "";
        const name = item.CategoryDetail?.find((p) => p.Lang === lang)?.CategoryName ?? "";

        return [id, name] as const;
    }).filter(([id]) => Boolean(id));

    return Object.fromEntries(pairs);
};

const buildTagDict = (list: TagSet[], lang: Lang): Record<string, string> =>
{
    const pairs = list.map((item) =>
    {
        const id = item.TagData?.TagId ?? "";
        const name = item.TagDetail?.find((p) => p.Lang === lang)?.TagName ?? "";

        return [id, name] as const;
    }).filter(([id]) => Boolean(id));

    return Object.fromEntries(pairs);
};

const buildBannerSliderParam = (): QueryListParam => ({
    Fields: BANNER_SLIDER_FIELDS,
    Condition: `${BannerFields.BannerId} = 1`,
    OrderBy: [{ Col: `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`, Desc: false }],
    PageNumber: 1,
    PageSize: 1,
});

const buildCategoryTabsTopCondition = (nowIsoLocal: string, categories?: string): string =>
{
    let condition = `${AnnouncementFields.ContentStatus} & 1`;
    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Validate_Start} <= ${nowIsoLocal}`);
    condition = LibMerge(" And ", false, condition, categories ? `${AnnouncementFields.Categories} HasAny [${categories}]` : "");

    return condition;
};

const buildCategoryTabsListCondition = (nowIsoLocal: string, categories?: string): string =>
{
    let condition = `${AnnouncementFields.ContentStatus} !& 4 And ${AnnouncementFields.ContentStatus} !& 1`;
    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Validate_Start} <= ${nowIsoLocal}`);
    condition = LibMerge(" And ", false, condition, categories ? `${AnnouncementFields.Categories} HasAny [${categories}]` : "");

    return condition;
};

const buildCategoryTabsNewsParam = (condition: string): QueryListParam => ({
    Fields: CATEGORY_TABS_NEWS_FIELDS,
    Condition: condition,
    OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }],
    PageNumber: 1,
    PageSize: 6,
});

const buildCategoryTabsCategoryParam = (): QueryListParam => ({
    Fields: CATEGORY_FIELDS,
    Condition: `${CategoryFields.ProgId} = Announcement`,
    PageNumber: 0,
    PageSize: 0,
});

const buildAnnouncementTagParam = (): QueryListParam => ({
    Fields: TAG_FIELDS,
    Condition: `${TagDataFields.ProgId} = ${PGID.Announcement}`,
    PageNumber: 0,
    PageSize: 0,
});

const buildEventListCondition = (nowIsoLocal: string): string =>
{
    let condition = "";
    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Validate_Start} <= ${nowIsoLocal}`);
    condition = LibMerge(" And ", false, condition, `(${AnnouncementFields.Validate_End} >= ${nowIsoLocal} Or ${AnnouncementFields.Validate_End} is null)`);
    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Categories} HasAny [8]`);
    condition = LibMerge(" And ", false, condition, `${AnnouncementFields.ContentStatus} !&4`);

    return condition;
};

const buildEventListParam = (nowIsoLocal: string): QueryListParam => ({
    Fields: EVENT_FIELDS,
    Condition: buildEventListCondition(nowIsoLocal),
    RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
    OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }],
    PageNumber: 1,
    PageSize: 6,
});

const buildGalleryListParam = (): QueryListParam => ({
    Fields: GALLERY_FIELDS,
    // Condition: `${GalleryFields.Categories} In [25,26,27,28]`,
    OrderBy: [{ Col: GalleryFields.Validate_Start, Desc: true }],
    PageNumber: 1,
    PageSize: 10,
});

const buildGalleryCategoryParam = (): QueryListParam => ({
    Fields: CATEGORY_FIELDS,
    Condition: `${CategoryFields.ProgId} = Gallery`,
    PageNumber: 0,
    PageSize: 0,
});

const buildVideoListParam = (): QueryListParam => ({
    Fields: VIDEO_FIELDS,
    Condition: `${WebResourceFields.Categories} HasAny [29,30,31,32]`,
    OrderBy: [{ Col: WebResourceFields.CreateTime, Desc: true }],
    PageNumber: 1,
    PageSize: 10,
});

const createEmptyRawData = (): HomePageRawData => ({
    bannerSliderBanner: null,

    categoryTabsTopAllNews: [],
    categoryTabsTopProjectNews: [],
    categoryTabsTopLegalNews: [],
    categoryTabsTopEventNews: [],
    categoryTabsTopAwardNews: [],
    categoryTabsTopMediaNews: [],

    categoryTabsAllNews: [],
    categoryTabsProjectNews: [],
    categoryTabsLegalNews: [],
    categoryTabsEventNews: [],
    categoryTabsAwardNews: [],
    categoryTabsMediaNews: [],

    categoryTabsCategories: [],
    categoryTabsTags: [],

    eventAnnouncements: [],
    eventTags: [],

    galleryList: [],
    galleryCategories: [],

    videoList: [],
});

export const buildHomePageLoaderArgs = (lang: Lang, nowIsoLocal: string = formatLocalIso(new Date())): HomePageLoaderArgs => ({
    lang,
    nowIsoLocal,

    bannerSliderParam: buildBannerSliderParam(),

    categoryTabsTopAllNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsTopCondition(nowIsoLocal)),
    categoryTabsTopProjectNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsTopCondition(nowIsoLocal, "3,4,5")),
    categoryTabsTopLegalNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsTopCondition(nowIsoLocal, "6")),
    categoryTabsTopEventNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsTopCondition(nowIsoLocal, "8,10")),
    categoryTabsTopAwardNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsTopCondition(nowIsoLocal, "45")),
    categoryTabsTopMediaNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsTopCondition(nowIsoLocal, "46")),

    categoryTabsAllNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsListCondition(nowIsoLocal)),
    categoryTabsProjectNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsListCondition(nowIsoLocal, "3,4,5")),
    categoryTabsLegalNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsListCondition(nowIsoLocal, "6")),
    categoryTabsEventNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsListCondition(nowIsoLocal, "8,10")),
    categoryTabsAwardNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsListCondition(nowIsoLocal, "45")),
    categoryTabsMediaNewsParam: buildCategoryTabsNewsParam(buildCategoryTabsListCondition(nowIsoLocal, "46")),

    categoryTabsCategoryParam: buildCategoryTabsCategoryParam(),
    categoryTabsTagParam: buildAnnouncementTagParam(),

    eventListParam: buildEventListParam(nowIsoLocal),
    eventTagParam: buildAnnouncementTagParam(),

    galleryListParam: buildGalleryListParam(),
    galleryCategoryParam: buildGalleryCategoryParam(),

    videoListParam: buildVideoListParam(),
});

export const HomePageLoader = (props: { lang: Lang; }) => async ({ request }: LoaderFunctionArgs): Promise<HomePageLoaderData> =>
{
    if (shouldRedirectEnHome(request, props.lang))
    {
        throw redirect("/en/About-ORD-en/Introduction-en", 302);
    }

    const ssrApi = getSsrApi(request);
    const args = buildHomePageLoaderArgs(props.lang);

    const bannerAdapter = BannerSliderAdapter(ssrApi);
    const announcementAdapter = AnnouncementAdapter(ssrApi);
    const categoryAdapter = CategoryAdapter(ssrApi);
    const tagAdapter = TagAdapter(ssrApi);
    const galleryAdapter = GalleryAdapter(ssrApi);
    const webResourceAdapter = WebResourceAdapter(ssrApi);

    const bannerSliderLoader = bannerAdapter.loader.createQueryListLoader({ getCondition: () => args.bannerSliderParam, getApiInstance: () => ssrApi });

    const categoryTabsTopAllNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsTopAllNewsParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsTopProjectNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsTopProjectNewsParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsTopLegalNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsTopLegalNewsParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsTopEventNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsTopEventNewsParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsTopAwardNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsTopAwardNewsParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsTopMediaNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsTopMediaNewsParam,
        getApiInstance: () => ssrApi,
    });

    const categoryTabsAllNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsAllNewsParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsProjectNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsProjectNewsParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsLegalNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsLegalNewsParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsEventNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsEventNewsParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsAwardNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsAwardNewsParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsMediaNewsLoader = announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsMediaNewsParam,
        getApiInstance: () => ssrApi,
    });

    const categoryTabsCategoryLoader = categoryAdapter.loader.createQueryListLoader({
        getCondition: () => args.categoryTabsCategoryParam,
        getApiInstance: () => ssrApi,
    });
    const categoryTabsTagLoader = tagAdapter.loader.createQueryListLoader({ getCondition: () => args.categoryTabsTagParam, getApiInstance: () => ssrApi });

    const eventListLoader = announcementAdapter.loader.createQueryListLoader({ getCondition: () => args.eventListParam, getApiInstance: () => ssrApi });
    const eventTagLoader = tagAdapter.loader.createQueryListLoader({ getCondition: () => args.eventTagParam, getApiInstance: () => ssrApi });

    const galleryListLoader = galleryAdapter.loader.createQueryListLoader({ getCondition: () => args.galleryListParam, getApiInstance: () => ssrApi });
    const galleryCategoryLoader = categoryAdapter.loader.createQueryListLoader({ getCondition: () => args.galleryCategoryParam, getApiInstance: () => ssrApi });

    const videoListLoader = webResourceAdapter.loader.createQueryListLoader({ getCondition: () => args.videoListParam, getApiInstance: () => ssrApi });

    const [
        bannerSliderLoaderData,
        categoryTabsTopAllNewsLoaderData,
        categoryTabsTopProjectNewsLoaderData,
        categoryTabsTopLegalNewsLoaderData,
        categoryTabsTopEventNewsLoaderData,
        categoryTabsTopAwardNewsLoaderData,
        categoryTabsTopMediaNewsLoaderData,
        categoryTabsAllNewsLoaderData,
        categoryTabsProjectNewsLoaderData,
        categoryTabsLegalNewsLoaderData,
        categoryTabsEventNewsLoaderData,
        categoryTabsAwardNewsLoaderData,
        categoryTabsMediaNewsLoaderData,
        categoryTabsCategoryLoaderData,
        categoryTabsTagLoaderData,
        eventListLoaderData,
        eventTagLoaderData,
        galleryListLoaderData,
        galleryCategoryLoaderData,
        videoListLoaderData,
    ] = await Promise.all([
        bannerSliderLoader({ request } as LoaderFunctionArgs),
        categoryTabsTopAllNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsTopProjectNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsTopLegalNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsTopEventNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsTopAwardNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsTopMediaNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsAllNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsProjectNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsLegalNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsEventNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsAwardNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsMediaNewsLoader({ request } as LoaderFunctionArgs),
        categoryTabsCategoryLoader({ request } as LoaderFunctionArgs),
        categoryTabsTagLoader({ request } as LoaderFunctionArgs),
        eventListLoader({ request } as LoaderFunctionArgs),
        eventTagLoader({ request } as LoaderFunctionArgs),
        galleryListLoader({ request } as LoaderFunctionArgs),
        galleryCategoryLoader({ request } as LoaderFunctionArgs),
        videoListLoader({ request } as LoaderFunctionArgs),
    ]);

    return {
        args,
        res: {
            rawData: {
                bannerSliderBanner: takeFirstOrNull<BannerSet>(bannerSliderLoaderData.apiRes.Data),

                categoryTabsTopAllNews: categoryTabsTopAllNewsLoaderData.apiRes.Data ?? [],
                categoryTabsTopProjectNews: categoryTabsTopProjectNewsLoaderData.apiRes.Data ?? [],
                categoryTabsTopLegalNews: categoryTabsTopLegalNewsLoaderData.apiRes.Data ?? [],
                categoryTabsTopEventNews: categoryTabsTopEventNewsLoaderData.apiRes.Data ?? [],
                categoryTabsTopAwardNews: categoryTabsTopAwardNewsLoaderData.apiRes.Data ?? [],
                categoryTabsTopMediaNews: categoryTabsTopMediaNewsLoaderData.apiRes.Data ?? [],

                categoryTabsAllNews: categoryTabsAllNewsLoaderData.apiRes.Data ?? [],
                categoryTabsProjectNews: categoryTabsProjectNewsLoaderData.apiRes.Data ?? [],
                categoryTabsLegalNews: categoryTabsLegalNewsLoaderData.apiRes.Data ?? [],
                categoryTabsEventNews: categoryTabsEventNewsLoaderData.apiRes.Data ?? [],
                categoryTabsAwardNews: categoryTabsAwardNewsLoaderData.apiRes.Data ?? [],
                categoryTabsMediaNews: categoryTabsMediaNewsLoaderData.apiRes.Data ?? [],

                categoryTabsCategories: categoryTabsCategoryLoaderData.apiRes.Data ?? [],
                categoryTabsTags: categoryTabsTagLoaderData.apiRes.Data ?? [],

                eventAnnouncements: eventListLoaderData.apiRes.Data ?? [],
                eventTags: eventTagLoaderData.apiRes.Data ?? [],

                galleryList: galleryListLoaderData.apiRes.Data ?? [],
                galleryCategories: galleryCategoryLoaderData.apiRes.Data ?? [],

                videoList: videoListLoaderData.apiRes.Data ?? [],
            },
        },
    };
};

export const useBannerSliderHydrationData = (opt: { bannerParam: QueryListParam; initialBanner: BannerSet | null; apiInstance?: AxiosInstance; }) =>
{
    const adapter = useMemo(() => BannerSliderAdapter(opt.apiInstance), [opt.apiInstance]);

    const initial = useMemo(() =>
    {
        if (!opt.initialBanner) return null;

        return toListInitial(opt.bannerParam, [opt.initialBanner]);
    }, [opt.bannerParam, opt.initialBanner]);

    const query = adapter.hooks.useQueryList({ condition: opt.bannerParam, initial, deps: [opt.bannerParam.Condition ?? ""], apiInstance: opt.apiInstance });

    const banner = useMemo(() => takeFirstOrNull<BannerSet>(query.data), [query.data]);

    return { ...query, banner };
};

export const useCategoryTabsHydrationData = (
    opt: { lang: Lang; args: HomePageLoaderArgs; initialData: HomePageRawData; apiInstance?: AxiosInstance; },
): HomePageCategoryTabsHookResult =>
{
    const announcementAdapter = useMemo(() => AnnouncementAdapter(opt.apiInstance), [opt.apiInstance]);
    const categoryAdapter = useMemo(() => CategoryAdapter(opt.apiInstance), [opt.apiInstance]);
    const tagAdapter = useMemo(() => TagAdapter(opt.apiInstance), [opt.apiInstance]);

    const topAllInitial = useMemo(() => toListInitial(opt.args.categoryTabsTopAllNewsParam, opt.initialData.categoryTabsTopAllNews), [
        opt.args.categoryTabsTopAllNewsParam,
        opt.initialData.categoryTabsTopAllNews,
    ]);
    const topProjectInitial = useMemo(() => toListInitial(opt.args.categoryTabsTopProjectNewsParam, opt.initialData.categoryTabsTopProjectNews), [
        opt.args.categoryTabsTopProjectNewsParam,
        opt.initialData.categoryTabsTopProjectNews,
    ]);
    const topLegalInitial = useMemo(() => toListInitial(opt.args.categoryTabsTopLegalNewsParam, opt.initialData.categoryTabsTopLegalNews), [
        opt.args.categoryTabsTopLegalNewsParam,
        opt.initialData.categoryTabsTopLegalNews,
    ]);
    const topEventInitial = useMemo(() => toListInitial(opt.args.categoryTabsTopEventNewsParam, opt.initialData.categoryTabsTopEventNews), [
        opt.args.categoryTabsTopEventNewsParam,
        opt.initialData.categoryTabsTopEventNews,
    ]);
    const topAwardInitial = useMemo(() => toListInitial(opt.args.categoryTabsTopAwardNewsParam, opt.initialData.categoryTabsTopAwardNews), [
        opt.args.categoryTabsTopAwardNewsParam,
        opt.initialData.categoryTabsTopAwardNews,
    ]);
    const topMediaInitial = useMemo(() => toListInitial(opt.args.categoryTabsTopMediaNewsParam, opt.initialData.categoryTabsTopMediaNews), [
        opt.args.categoryTabsTopMediaNewsParam,
        opt.initialData.categoryTabsTopMediaNews,
    ]);

    const allNewsInitial = useMemo(() => toListInitial(opt.args.categoryTabsAllNewsParam, opt.initialData.categoryTabsAllNews), [
        opt.args.categoryTabsAllNewsParam,
        opt.initialData.categoryTabsAllNews,
    ]);
    const projectInitial = useMemo(() => toListInitial(opt.args.categoryTabsProjectNewsParam, opt.initialData.categoryTabsProjectNews), [
        opt.args.categoryTabsProjectNewsParam,
        opt.initialData.categoryTabsProjectNews,
    ]);
    const legalInitial = useMemo(() => toListInitial(opt.args.categoryTabsLegalNewsParam, opt.initialData.categoryTabsLegalNews), [
        opt.args.categoryTabsLegalNewsParam,
        opt.initialData.categoryTabsLegalNews,
    ]);
    const eventInitial = useMemo(() => toListInitial(opt.args.categoryTabsEventNewsParam, opt.initialData.categoryTabsEventNews), [
        opt.args.categoryTabsEventNewsParam,
        opt.initialData.categoryTabsEventNews,
    ]);
    const awardInitial = useMemo(() => toListInitial(opt.args.categoryTabsAwardNewsParam, opt.initialData.categoryTabsAwardNews), [
        opt.args.categoryTabsAwardNewsParam,
        opt.initialData.categoryTabsAwardNews,
    ]);
    const mediaInitial = useMemo(() => toListInitial(opt.args.categoryTabsMediaNewsParam, opt.initialData.categoryTabsMediaNews), [
        opt.args.categoryTabsMediaNewsParam,
        opt.initialData.categoryTabsMediaNews,
    ]);

    const categoryInitial = useMemo(() => toListInitial(opt.args.categoryTabsCategoryParam, opt.initialData.categoryTabsCategories), [
        opt.args.categoryTabsCategoryParam,
        opt.initialData.categoryTabsCategories,
    ]);
    const tagInitial = useMemo(() => toListInitial(opt.args.categoryTabsTagParam, opt.initialData.categoryTabsTags), [
        opt.args.categoryTabsTagParam,
        opt.initialData.categoryTabsTags,
    ]);

    const useTopAllNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsTopAllNewsParam,
        initial: topAllInitial,
        deps: [opt.args.categoryTabsTopAllNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useTopProjectNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsTopProjectNewsParam,
        initial: topProjectInitial,
        deps: [opt.args.categoryTabsTopProjectNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useTopLegalNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsTopLegalNewsParam,
        initial: topLegalInitial,
        deps: [opt.args.categoryTabsTopLegalNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useTopEventNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsTopEventNewsParam,
        initial: topEventInitial,
        deps: [opt.args.categoryTabsTopEventNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useTopAwardNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsTopAwardNewsParam,
        initial: topAwardInitial,
        deps: [opt.args.categoryTabsTopAwardNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useTopMediaNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsTopMediaNewsParam,
        initial: topMediaInitial,
        deps: [opt.args.categoryTabsTopMediaNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });

    const useAllNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsAllNewsParam,
        initial: allNewsInitial,
        deps: [opt.args.categoryTabsAllNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useProjectNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsProjectNewsParam,
        initial: projectInitial,
        deps: [opt.args.categoryTabsProjectNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useLegalNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsLegalNewsParam,
        initial: legalInitial,
        deps: [opt.args.categoryTabsLegalNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useEventNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsEventNewsParam,
        initial: eventInitial,
        deps: [opt.args.categoryTabsEventNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useAwardNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsAwardNewsParam,
        initial: awardInitial,
        deps: [opt.args.categoryTabsAwardNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useMediaNews = announcementAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsMediaNewsParam,
        initial: mediaInitial,
        deps: [opt.args.categoryTabsMediaNewsParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });

    const useCategoryData = categoryAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsCategoryParam,
        initial: categoryInitial,
        deps: [opt.args.categoryTabsCategoryParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useTagData = tagAdapter.hooks.useQueryList({
        condition: opt.args.categoryTabsTagParam,
        initial: tagInitial,
        deps: [opt.args.categoryTabsTagParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });

    const topAllNewsData = useMemo(() => useTopAllNews.data ?? [], [useTopAllNews.data]);
    const topProjectData = useMemo(() => useTopProjectNews.data ?? [], [useTopProjectNews.data]);
    const topLegalData = useMemo(() => useTopLegalNews.data ?? [], [useTopLegalNews.data]);
    const topEventData = useMemo(() => useTopEventNews.data ?? [], [useTopEventNews.data]);
    const topAwardData = useMemo(() => useTopAwardNews.data ?? [], [useTopAwardNews.data]);
    const topMediaData = useMemo(() => useTopMediaNews.data ?? [], [useTopMediaNews.data]);

    const allNewsData = useMemo(() => useAllNews.data ?? [], [useAllNews.data]);
    const projectData = useMemo(() => useProjectNews.data ?? [], [useProjectNews.data]);
    const legalData = useMemo(() => useLegalNews.data ?? [], [useLegalNews.data]);
    const eventData = useMemo(() => useEventNews.data ?? [], [useEventNews.data]);
    const awardData = useMemo(() => useAwardNews.data ?? [], [useAwardNews.data]);
    const mediaData = useMemo(() => useMediaNews.data ?? [], [useMediaNews.data]);

    const allNewsRawData = useMemo(
        () => takeTopThenFill(topAllNewsData, allNewsData, 6, (item) => item.Announcement?.InternalId ?? String(item.Announcement?.AnnouncementId ?? "")),
        [topAllNewsData, allNewsData],
    );
    const projectRawData = useMemo(
        () => takeTopThenFill(topProjectData, projectData, 6, (item) => item.Announcement?.InternalId ?? String(item.Announcement?.AnnouncementId ?? "")),
        [topProjectData, projectData],
    );
    const legalRawData = useMemo(
        () => takeTopThenFill(topLegalData, legalData, 6, (item) => item.Announcement?.InternalId ?? String(item.Announcement?.AnnouncementId ?? "")),
        [topLegalData, legalData],
    );
    const eventRawData = useMemo(
        () => takeTopThenFill(topEventData, eventData, 6, (item) => item.Announcement?.InternalId ?? String(item.Announcement?.AnnouncementId ?? "")),
        [topEventData, eventData],
    );
    const awardRawData = useMemo(
        () => takeTopThenFill(topAwardData, awardData, 6, (item) => item.Announcement?.InternalId ?? String(item.Announcement?.AnnouncementId ?? "")),
        [topAwardData, awardData],
    );
    const mediaRawData = useMemo(
        () => takeTopThenFill(topMediaData, mediaData, 6, (item) => item.Announcement?.InternalId ?? String(item.Announcement?.AnnouncementId ?? "")),
        [topMediaData, mediaData],
    );

    const categoryData = useMemo(() => useCategoryData.data ?? [], [useCategoryData.data]);
    const tagData = useMemo(() => useTagData.data ?? [], [useTagData.data]);
    const categoryDict = useMemo(() => buildCategoryDict(categoryData, opt.lang), [categoryData, opt.lang]);
    const tagDict = useMemo(() => buildTagDict(tagData, opt.lang), [tagData, opt.lang]);

    const loadingList = [
        useTopAllNews.isLoading,
        useTopProjectNews.isLoading,
        useTopLegalNews.isLoading,
        useTopEventNews.isLoading,
        useTopAwardNews.isLoading,
        useTopMediaNews.isLoading,
        useAllNews.isLoading,
        useProjectNews.isLoading,
        useLegalNews.isLoading,
        useEventNews.isLoading,
        useAwardNews.isLoading,
        useMediaNews.isLoading,
        useCategoryData.isLoading,
        useTagData.isLoading,
    ];

    const errorList = [
        useTopAllNews.errorText,
        useTopProjectNews.errorText,
        useTopLegalNews.errorText,
        useTopEventNews.errorText,
        useTopAwardNews.errorText,
        useTopMediaNews.errorText,
        useAllNews.errorText,
        useProjectNews.errorText,
        useLegalNews.errorText,
        useEventNews.errorText,
        useAwardNews.errorText,
        useMediaNews.errorText,
        useCategoryData.errorText,
        useTagData.errorText,
    ];

    return {
        topAllNewsData,
        topProjectData,
        topLegalData,
        topEventData,
        topAwardData,
        topMediaData,
        allNewsData,
        projectData,
        legalData,
        eventData,
        awardData,
        mediaData,
        allNewsRawData,
        projectRawData,
        legalRawData,
        eventRawData,
        awardRawData,
        mediaRawData,
        categoryData,
        tagData,
        categoryDict,
        tagDict,
        loadingList,
        errorList,
    };
};

export const useEventHydrationData = (
    opt: { lang: Lang; args: HomePageLoaderArgs; initialData: HomePageRawData; apiInstance?: AxiosInstance; },
): HomePageEventHookResult =>
{
    const announcementAdapter = useMemo(() => AnnouncementAdapter(opt.apiInstance), [opt.apiInstance]);
    const tagAdapter = useMemo(() => TagAdapter(opt.apiInstance), [opt.apiInstance]);

    const listInitial = useMemo(() => toListInitial(opt.args.eventListParam, opt.initialData.eventAnnouncements), [
        opt.args.eventListParam,
        opt.initialData.eventAnnouncements,
    ]);
    const tagInitial = useMemo(() => toListInitial(opt.args.eventTagParam, opt.initialData.eventTags), [opt.args.eventTagParam, opt.initialData.eventTags]);

    const useEventData = announcementAdapter.hooks.useQueryList({
        condition: opt.args.eventListParam,
        initial: listInitial,
        deps: [opt.args.eventListParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useTagData = tagAdapter.hooks.useQueryList({
        condition: opt.args.eventTagParam,
        initial: tagInitial,
        deps: [opt.args.eventTagParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });

    const announcementData = useMemo(() => useEventData.data ?? [], [useEventData.data]);
    const tagData = useMemo(() => useTagData.data ?? [], [useTagData.data]);
    const tagDict = useMemo(() => buildTagDict(tagData, opt.lang), [tagData, opt.lang]);

    return {
        announcementData,
        tagData,
        tagDict,
        loadingList: [useEventData.isLoading, useTagData.isLoading],
        errorList: [useEventData.errorText, useTagData.errorText],
    };
};

export const useGalleryHydrationData = (
    opt: { lang: Lang; args: HomePageLoaderArgs; initialData: HomePageRawData; apiInstance?: AxiosInstance; },
): HomePageGalleryHookResult =>
{
    const galleryAdapter = useMemo(() => GalleryAdapter(opt.apiInstance), [opt.apiInstance]);
    const categoryAdapter = useMemo(() => CategoryAdapter(opt.apiInstance), [opt.apiInstance]);

    const listInitial = useMemo(() => toListInitial(opt.args.galleryListParam, opt.initialData.galleryList), [
        opt.args.galleryListParam,
        opt.initialData.galleryList,
    ]);
    const categoryInitial = useMemo(() => toListInitial(opt.args.galleryCategoryParam, opt.initialData.galleryCategories), [
        opt.args.galleryCategoryParam,
        opt.initialData.galleryCategories,
    ]);

    const useGalleryData = galleryAdapter.hooks.useQueryList({
        condition: opt.args.galleryListParam,
        initial: listInitial,
        deps: [opt.args.galleryListParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });
    const useCategoryData = categoryAdapter.hooks.useQueryList({
        condition: opt.args.galleryCategoryParam,
        initial: categoryInitial,
        deps: [opt.args.galleryCategoryParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });

    const galleryData = useMemo(() => useGalleryData.data ?? [], [useGalleryData.data]);
    const categoryData = useMemo(() => useCategoryData.data ?? [], [useCategoryData.data]);
    const categoryDict = useMemo(() => buildCategoryDict(categoryData, opt.lang), [categoryData, opt.lang]);

    return {
        galleryData,
        categoryData,
        categoryDict,
        loadingList: [useGalleryData.isLoading, useCategoryData.isLoading],
        errorList: [useGalleryData.errorText, useCategoryData.errorText],
    };
};

export const useVideoHydrationData = (opt: { args: HomePageLoaderArgs; initialData: HomePageRawData; apiInstance?: AxiosInstance; }): HomePageVideoHookResult =>
{
    const webResourceAdapter = useMemo(() => WebResourceAdapter(opt.apiInstance), [opt.apiInstance]);

    const listInitial = useMemo(() => toListInitial(opt.args.videoListParam, opt.initialData.videoList), [opt.args.videoListParam, opt.initialData.videoList]);

    const useVideoData = webResourceAdapter.hooks.useQueryList({
        condition: opt.args.videoListParam,
        initial: listInitial,
        deps: [opt.args.videoListParam.Condition ?? ""],
        apiInstance: opt.apiInstance,
    });

    return { webResourceData: useVideoData.data ?? [], loadingList: [useVideoData.isLoading], errorList: [useVideoData.errorText] };
};

export const useHomePageHydrationSource = (opt: { lang: Lang; loaderData?: HomePageLoaderData | null; apiInstance?: AxiosInstance; }) =>
{
    const args = useMemo(() => opt.loaderData?.args ?? buildHomePageLoaderArgs(opt.lang), [opt.lang, opt.loaderData]);
    const initialData = useMemo(() => opt.loaderData?.res?.rawData ?? createEmptyRawData(), [opt.loaderData]);

    const bannerSlider = useBannerSliderHydrationData({
        bannerParam: args.bannerSliderParam,
        initialBanner: initialData.bannerSliderBanner,
        apiInstance: opt.apiInstance,
    });

    const categoryTabs = useCategoryTabsHydrationData({ lang: opt.lang, args, initialData, apiInstance: opt.apiInstance });

    const eventSession = useEventHydrationData({ lang: opt.lang, args, initialData, apiInstance: opt.apiInstance });

    const gallerySession = useGalleryHydrationData({ lang: opt.lang, args, initialData, apiInstance: opt.apiInstance });

    const videoSession = useVideoHydrationData({ args, initialData, apiInstance: opt.apiInstance });

    return { args, initialData, bannerSlider, categoryTabs, eventSession, gallerySession, videoSession };
};
