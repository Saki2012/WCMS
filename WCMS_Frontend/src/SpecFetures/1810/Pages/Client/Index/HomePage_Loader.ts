import {
    buildClientCategoryTextDict as buildCategoryDict,
    buildClientTagTextDict as buildTagDict,
} from "@/Features/Pages/Client/Index/HomePage_Helper";
import {
    SpecHomePage1810Adapter,
    type HomePageInitialLoaderData,
    type SpecHomePageInitialDataDTO,
} from "@/SpecFetures/1810/Hooks/WEB/HomePage_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { api, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import { type LoaderFunctionArgs, redirect } from "react-router-dom";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

type BannerFormModel = components["schemas"]["Banner"];

type CategoryFormModel = components["schemas"]["Category"];

type GallerySet = components["schemas"]["GallerySet_DTO"];

type TagFormModel = components["schemas"]["TagData"];

type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];

interface HomePageQueryState
{
    isLoading: boolean;
    errorText: string | null;
}

export interface HomePageRawData
{
    bannerSliderBanner: BannerFormModel | null;

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

    categoryTabsCategories: CategoryFormModel[];
    categoryTabsTags: TagFormModel[];

    eventAnnouncements: AnnouncementSet[];
    eventTags: TagFormModel[];

    galleryList: GallerySet[];
    galleryCategories: CategoryFormModel[];

    videoList: WebResourceSet[];
}

export interface HomePageLoaderArgs
{
    lang: Lang;
}

export interface HomePageLoaderRes
{
    rawData: HomePageRawData;
}

export interface HomePageLoaderData
{
    args: HomePageLoaderArgs;
    res: HomePageLoaderRes;
    initial: HomePageInitialLoaderData | null;
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

    categoryData: CategoryFormModel[];
    tagData: TagFormModel[];
    categoryDict: Record<string, string>;
    tagDict: Record<string, string>;
    loadingList: boolean[];
    errorList: Array<string | null>;
}

export interface HomePageEventHookResult
{
    announcementData: AnnouncementSet[];
    tagData: TagFormModel[];
    tagDict: Record<string, string>;
    loadingList: boolean[];
    errorList: Array<string | null>;
}

export interface HomePageGalleryHookResult
{
    galleryData: GallerySet[];
    categoryData: CategoryFormModel[];
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
// #endregion

// #region Public
export const HomePageLoader = (props: { lang: Lang; }) => async ({ request }: LoaderFunctionArgs): Promise<HomePageLoaderData> =>
{
    if (shouldRedirectEnHome(request, props.lang))
    {
        throw redirect("/en/About-ORD-en/Introduction-en", 302);
    }

    const apiInstance = getLoaderApi(request);
    const loader = SpecHomePage1810Adapter().loader.createInitialDataLoader({ getApiInstance: () => apiInstance });
    const initial = await loader({ request } as LoaderFunctionArgs);
    const rawData = toHomePageRawData(takeFirstOrNull(initial.apiRes.Data));

    return {
        args: { lang: props.lang },
        res: { rawData },
        initial,
    };
};

export const useBannerSliderHydrationData = (opt: { initialData: HomePageRawData; queryState: HomePageQueryState; }) =>
{
    const banner = useMemo(() => opt.initialData.bannerSliderBanner, [opt.initialData.bannerSliderBanner]);

    return { banner, isLoading: opt.queryState.isLoading, errorText: opt.queryState.errorText };
};

export const useCategoryTabsHydrationData = (
    opt: { lang: Lang; initialData: HomePageRawData; queryState: HomePageQueryState; },
): HomePageCategoryTabsHookResult =>
{
    const categoryData = useMemo(() => opt.initialData.categoryTabsCategories, [opt.initialData.categoryTabsCategories]);
    const tagData = useMemo(() => opt.initialData.categoryTabsTags, [opt.initialData.categoryTabsTags]);
    const categoryDict = useMemo(() => buildCategoryDict(categoryData, opt.lang), [categoryData, opt.lang]);
    const tagDict = useMemo(() => buildTagDict(tagData, opt.lang), [tagData, opt.lang]);

    return buildCategoryTabsResult(opt.initialData, categoryData, tagData, categoryDict, tagDict, opt.queryState);
};

export const useEventHydrationData = (
    opt: { lang: Lang; initialData: HomePageRawData; queryState: HomePageQueryState; },
): HomePageEventHookResult =>
{
    const tagData = useMemo(() => opt.initialData.eventTags, [opt.initialData.eventTags]);
    const tagDict = useMemo(() => buildTagDict(tagData, opt.lang), [tagData, opt.lang]);

    return {
        announcementData: opt.initialData.eventAnnouncements,
        tagData,
        tagDict,
        loadingList: [opt.queryState.isLoading],
        errorList: [opt.queryState.errorText],
    };
};

export const useGalleryHydrationData = (
    opt: { lang: Lang; initialData: HomePageRawData; queryState: HomePageQueryState; },
): HomePageGalleryHookResult =>
{
    const categoryData = useMemo(() => opt.initialData.galleryCategories, [opt.initialData.galleryCategories]);
    const categoryDict = useMemo(() => buildCategoryDict(categoryData, opt.lang), [categoryData, opt.lang]);

    return {
        galleryData: opt.initialData.galleryList,
        categoryData,
        categoryDict,
        loadingList: [opt.queryState.isLoading],
        errorList: [opt.queryState.errorText],
    };
};

export const useVideoHydrationData = (opt: { initialData: HomePageRawData; queryState: HomePageQueryState; }): HomePageVideoHookResult =>
{
    return {
        webResourceData: opt.initialData.videoList,
        loadingList: [opt.queryState.isLoading],
        errorList: [opt.queryState.errorText],
    };
};

export const useHomePageHydrationSource = (opt: { lang: Lang; loaderData?: HomePageLoaderData | null; apiInstance?: AxiosInstance; }) =>
{
    const adapter = useMemo(() => SpecHomePage1810Adapter(opt.apiInstance), [opt.apiInstance]);
    const initial = useMemo(() => opt.loaderData?.initial ?? null, [opt.loaderData]);
    const query = adapter.hooks.useInitialData({ initial, deps: [opt.lang], apiInstance: opt.apiInstance });
    const args = useMemo(() => opt.loaderData?.args ?? { lang: opt.lang }, [opt.lang, opt.loaderData]);
    const initialData = useMemo(() => resolveHomePageRawData(query.initialData, opt.loaderData), [query.initialData, opt.loaderData]);
    const queryState = useMemo<HomePageQueryState>(() => ({ isLoading: query.isLoading, errorText: query.errorText }), [query.isLoading, query.errorText]);

    const bannerSlider = useBannerSliderHydrationData({ initialData, queryState });
    const categoryTabs = useCategoryTabsHydrationData({ lang: opt.lang, initialData, queryState });
    const eventSession = useEventHydrationData({ lang: opt.lang, initialData, queryState });
    const gallerySession = useGalleryHydrationData({ lang: opt.lang, initialData, queryState });
    const videoSession = useVideoHydrationData({ initialData, queryState });

    return { args, initialData, bannerSlider, categoryTabs, eventSession, gallerySession, videoSession };
};
// #endregion

// #region Private
const shouldRedirectEnHome = (request: Request, lang: Lang): boolean =>
{
    // 宣告變數
    const pathname = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    // 執行 function
    if (lang !== "en") return false;

    // return
    return pathname === "/en";
};

const getLoaderApi = (request: Request): AxiosInstance =>
{
    // return
    return typeof window === "undefined" ? getSsrApi(request) : api;
};

const takeFirstOrNull = <T>(data: T[] | T | null | undefined): T | null =>
{
    if (!data) return null;

    return Array.isArray(data) ? data[0] ?? null : data;
};

const resolveHomePageRawData = (apiData: SpecHomePageInitialDataDTO | null, loaderData?: HomePageLoaderData | null): HomePageRawData =>
{
    if (apiData) return toHomePageRawData(apiData);
    if (loaderData?.res?.rawData) return loaderData.res.rawData;

    return createEmptyRawData();
};

const toHomePageRawData = (data: SpecHomePageInitialDataDTO | null): HomePageRawData =>
{
    const empty = createEmptyRawData();
    if (!data) return empty;

    return {
        ...empty,
        ...toBannerRawData(data),
        ...toCategoryTabsRawData(data),
        ...toEventRawData(data),
        ...toGalleryRawData(data),
        ...toVideoRawData(data),
    };
};

const toBannerRawData = (data: SpecHomePageInitialDataDTO): Pick<HomePageRawData, "bannerSliderBanner"> =>
{
    return { bannerSliderBanner: data.BannerSlider?.Banner ?? null };
};

const toCategoryTabsRawData = (data: SpecHomePageInitialDataDTO): Pick<HomePageRawData,
    "categoryTabsAllNews" | "categoryTabsProjectNews" | "categoryTabsLegalNews" | "categoryTabsEventNews" | "categoryTabsAwardNews" | "categoryTabsMediaNews" | "categoryTabsCategories" | "categoryTabsTags"> =>
{
    const section = data.CategoryTabs;

    return {
        categoryTabsAllNews: section?.AllNews ?? [],
        categoryTabsProjectNews: section?.ProjectNews ?? [],
        categoryTabsLegalNews: section?.LegalNews ?? [],
        categoryTabsEventNews: section?.EventNews ?? [],
        categoryTabsAwardNews: section?.AwardNews ?? [],
        categoryTabsMediaNews: section?.MediaNews ?? [],
        categoryTabsCategories: section?.Categories ?? [],
        categoryTabsTags: section?.Tags ?? [],
    };
};

const toEventRawData = (data: SpecHomePageInitialDataDTO): Pick<HomePageRawData, "eventAnnouncements" | "eventTags"> =>
{
    const section = data.EventSession;

    return {
        eventAnnouncements: section?.Announcements ?? [],
        eventTags: section?.Tags ?? [],
    };
};

const toGalleryRawData = (data: SpecHomePageInitialDataDTO): Pick<HomePageRawData, "galleryList" | "galleryCategories"> =>
{
    const section = data.GallerySession;

    return {
        galleryList: section?.Galleries ?? [],
        galleryCategories: section?.Categories ?? [],
    };
};

const toVideoRawData = (data: SpecHomePageInitialDataDTO): Pick<HomePageRawData, "videoList"> =>
{
    return { videoList: data.VideoSession?.WebResources ?? [] };
};

const buildCategoryTabsResult = (
    data: HomePageRawData,
    categoryData: CategoryFormModel[],
    tagData: TagFormModel[],
    categoryDict: Record<string, string>,
    tagDict: Record<string, string>,
    queryState: HomePageQueryState,
): HomePageCategoryTabsHookResult =>
{
    return {
        ...buildEmptyTopNewsData(),
        allNewsData: data.categoryTabsAllNews,
        projectData: data.categoryTabsProjectNews,
        legalData: data.categoryTabsLegalNews,
        eventData: data.categoryTabsEventNews,
        awardData: data.categoryTabsAwardNews,
        mediaData: data.categoryTabsMediaNews,
        allNewsRawData: data.categoryTabsAllNews,
        projectRawData: data.categoryTabsProjectNews,
        legalRawData: data.categoryTabsLegalNews,
        eventRawData: data.categoryTabsEventNews,
        awardRawData: data.categoryTabsAwardNews,
        mediaRawData: data.categoryTabsMediaNews,
        categoryData,
        tagData,
        categoryDict,
        tagDict,
        loadingList: [queryState.isLoading],
        errorList: [queryState.errorText],
    };
};

const buildEmptyTopNewsData = () =>
{
    return {
        topAllNewsData: [],
        topProjectData: [],
        topLegalData: [],
        topEventData: [],
        topAwardData: [],
        topMediaData: [],
    };
};

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
// #endregion
